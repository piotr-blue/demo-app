# How Blue Studio Web Works (Exact Flow)

This document describes the app behavior as implemented in source under `apps/blue-studio-web`.

## 1. Runtime Architecture

- Framework: Next.js App Router (`app/page.tsx`, `app/layout.tsx`)
- Frontend runtime: client-side React state in `StudioApp` + `WorkspaceShell`
- Backend runtime: Next.js route handlers under `app/api/**`
- LLM: OpenAI Responses API (`model: gpt-5.4`, `reasoning.effort: low`)
- MyOS integration: `@blue-labs/myos-js`

Important config in `next.config.ts`:

- transpiles local workspace packages `@blue-labs/sdk-dsl` and `@blue-labs/myos-js`
- includes `lib/prompts/*.md` in API output tracing
- resolves `.js/.mjs/.cjs` imports to TS extensions for local runtime compatibility

## 2. Boot Sequence

### Entry

1. `app/page.tsx` renders `<StudioApp />`.
2. `StudioApp` hydrates from browser storage:
   - `readCredentials()`
   - `readActiveWorkspaceId()`
   - `readSelectedTab()`
3. If credentials exist but no workspace ID, it creates one: `workspace_<timestamp>_<rand>`.
4. If credentials are missing, it renders `CredentialsGate`.
5. If credentials + workspace ID exist, it renders `WorkspaceShell`.

### Credentials gate

`CredentialsGate` collects:

- `openAiApiKey`
- `myOsApiKey`
- `myOsAccountId`
- `myOsBaseUrl` (default `https://api.dev.myos.blue/`)

On submit, `StudioApp` stores credentials and creates/stores a workspace ID.

## 3. Persistence Model

### localStorage (`lib/storage/local-storage.ts`)

- `blueStudio.credentials`
- `blueStudio.activeWorkspaceId`
- `blueStudio.selectedTab`

### IndexedDB (`lib/storage/indexeddb.ts`)

DB: `blue-studio-web`, version `1`

Stores:

- `workspaces` (key = workspace ID, full `WorkspaceState` object)
- `files` (keyPath = `id`, indexed by `workspaceId`, stores file blobs)

Workspace load flow:

- `WorkspaceShell` reads `readWorkspace(workspaceId)`
- if not found, creates with `createWorkspace()` and saves
- every workspace state change is persisted via `saveWorkspace(workspace)`

## 4. Workspace State Machine

State type: `WorkspacePhase` in `lib/workspace/types.ts`

Phases:

- `needs-credentials`
- `blueprint-chat`
- `blueprint-ready`
- `dsl-generating`
- `dsl-ready`
- `binding-review`
- `bootstrapping`
- `document-running`
- `error`

Normal path:

1. `blueprint-chat`
2. `blueprint-ready`
3. `dsl-generating`
4. `dsl-ready`
5. `binding-review`
6. `bootstrapping`
7. `document-running`

Error path can be entered from any step and sets `errorMessage`.

## 5. End-to-End User Flow

### 5.1 Chat + context submission

When user submits prompt in `WorkspaceShell`:

1. For each attached file part, client calls `/api/files/extract`.
2. Extracted text is saved as `StoredAttachment` in workspace state.
3. Original blob is saved in IndexedDB `files` store.
4. If app was waiting for a model question (`pendingQuestionRef`), it appends `{question, answer}` to `qaPairs`.
5. Sends chat message through `useChat` transport (`/api/chat`) with:
   - `credentials`
   - `attachments`
   - `qaPairs`
   - `currentBlueprint`

### 5.2 Blueprint generation (`/api/chat`)

Server route behavior:

1. Validates body schema.
2. Parses credentials (`parseRouteCredentials`).
3. Loads blueprint prompt markdown via `getBlueprintArchitectPrompt()`.
4. Builds envelope from message history + attachments + QA + current blueprint.
5. Counts input tokens (`responses.inputTokens.count`) and enforces budget.
6. Calls OpenAI Responses API.
7. Parses model output with `parseBlueprintResponse()`:
   - `STATE: questions` -> emits streamed text + `data-blueprint-question`
   - `STATE: ready` -> emits streamed text + `data-blueprint-ready`
   - anything else -> emits streamed text + `data-blueprint-unknown`
8. On exception, returns streamed assistant error text + `data-blueprint-error` (HTTP 200).

Client `onData` handling:

- `data-blueprint-question`: stores question in `pendingQuestionRef`
- `data-blueprint-ready`: saves blueprint to `currentBlueprint` + `blueprintVersions`
- `data-blueprint-error`: sets `phase = error`

### 5.3 DSL generation (`/api/dsl/generate`)

Triggered by `Generate DSL` button when blueprint is ready.

Route behavior:

1. Validates `credentials`, `blueprint`, `attachments`.
2. Loads JS/TS DSL prompt markdown.
3. Builds input as:
   - `BLUEPRINT:` block
   - `CONTEXT:` block from attachments
4. Counts tokens and checks budget.
5. Calls OpenAI Responses API.
6. Extracts TypeScript fenced block using `extractDslCodeBlock()`.
7. Returns `{ ok: true, dsl, inputTokens }`.

Client updates:

- `phase = dsl-ready`
- saves `currentDsl`
- appends to `dslVersions`
- clears previous compile/bootstrap data

### 5.4 DSL compile (`/api/dsl/compile`)

Triggered by `Compile DSL` button.

Route behavior:

1. Validates `{ code, accountId? }`.
2. Compiles and executes generated DSL via `compileDslModule()`.
3. Converts document to summary and extracts channels.
4. Returns:
   - `documentJson`
   - `structure`
   - `bindings` (if `accountId` provided)

Binding extraction (`lib/dsl/channel-extraction.ts`):

- reads `structure.contracts` with `kind === "channel"`
- pre-fills owner-like names (`owner|me|requester|creator|author`) with accountId and `mode = accountId`
- other channels default to `mode = email`, empty value

Client updates:

- `phase = binding-review`
- saves `currentDocumentJson`
- saves `channelBindings`
- writes successful `compileStatus`

### 5.5 Bootstrap (`/api/myos/bootstrap`)

Triggered by the `OK — bootstrap` button in `WorkspaceShell`.

Client pre-check:

- all `channelBindings` must have non-empty `value`

Route behavior:

1. Validates payload.
2. Converts UI bindings with `toMyOsBindings()`.
3. Calls `client.documents.bootstrap(documentJson, normalizedBindings)`.
4. Reads `bootstrapSessionId` from bootstrap response.
5. Resolves `sessionId` with `resolveTargetSessionId()`:
   - retrieves bootstrap session
   - if not bootstrap type, uses bootstrap session directly
   - else tries to find non-bootstrap session by documentId list
   - if needed, scans all UUID-like values found in response/retrieve payload and tests each
6. Returns `{ ok: true, sessionId, bootstrapSessionId, bootstrap }`.

Client updates:

- `phase = bootstrapping`
- records bootstrap events
- stores `sessionId`
- starts polling

### 5.6 Polling (`/api/myos/retrieve`)

`beginPolling(sessionId)` in client:

- up to 120 iterations
- sleeps 1 second each iteration
- calls `/api/myos/retrieve`
- on success:
  - reads `retrieved.document`
  - reads `allowedOperations`
  - infers status from `processingStatus` or `status`
  - computes snapshot diffs (`buildSnapshotDiffs`) vs previous snapshot
  - appends `DocumentSnapshot`
- marks running when any of:
  - allowed operations exist
  - status contains `running`
  - document object exists
- once running:
  - `phase = document-running`
  - polling loop exits

## 6. Special Route: `/api/dsl/continue`

This route combines generate + compile in one call (used by tests/live flow).

Flow:

1. generate DSL from blueprint
2. compile DSL
3. if compile fails, attempts repair prompt round
4. if repair also fails and blueprint looks like counter, uses built-in fallback counter DSL
5. returns compiled document + bindings

The UI (`WorkspaceShell`) currently uses separate `/api/dsl/generate` and `/api/dsl/compile` endpoints, not `/api/dsl/continue`.

## 7. Utility Route: `/api/token-count`

This route validates:

- `apiKey`
- `systemPrompt`
- `input`

Then returns the OpenAI-counted `inputTokens`. It is a utility endpoint and not part of the main UI happy path.

## 8. Inspector and UI Outputs

Tabs:

- `overview`: phase, sessionId, documentId, allowed operations badges
- `blueprint`: current blueprint text
- `dsl`: current DSL + compile diagnostics
- `bindings`: JSON view of draft/final bindings
- `bootstrap`: timeline of bootstrap events
- `document`: latest retrieved document JSON
- `changes`: latest snapshot diff array
- `activity`: event log (`ActivityItem[]`)

Attachment behavior:

- Context files list is clickable
- file opens from IndexedDB blob URL in a new tab

## 9. Error Handling and Redaction

- Routes use `safeErrorMessage()` to avoid leaking raw secrets
- Redaction covers patterns like `sk-...` and `Bearer ...`
- Most API failures return HTTP 400/500 JSON `{ ok: false, error }`
- `/api/chat` intentionally returns streamed error text with HTTP 200

## 10. Security and Data Boundaries

- Credentials live in browser storage and are sent to API routes on each request
- No server-side credential persistence is implemented in this app
- Logout flow:
  - clears current workspace from IndexedDB
  - clears local workspace keys
  - clears stored credentials
- Clear workspace flow:
  - clears IndexedDB data for only the current workspace ID
  - creates a fresh in-memory workspace with the same credentials
  - leaves persisted credentials intact

## 11. Current Test Coverage (in-repo)

- Unit/integration route tests under `app/api/**/route.spec.ts`
- Library tests under `lib/**/*.spec.ts`
- Playwright e2e under `e2e/`
- Live end-to-end route flow under `live-tests/counter-flow.spec.ts`

This is the implemented behavior as of the current repository state.
