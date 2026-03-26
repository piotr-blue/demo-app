# Blue Studio Web

Blue Studio Web now includes two parallel experiences:

1. **MyOS Demo (default)**: Home-first, seeded local-first demo app
2. **Legacy Blue Studio**: existing blueprint → DSL → bootstrap flow at `/t/[threadId]`

## MyOS Demo routes

- `/` → redirects to `/home`
- `/home`
- `/search`
- `/workspaces/[workspaceId]`
- `/documents/[documentId]`
- `/threads/[threadId]`
- `/settings`
- `/blink` → compatibility redirect to `/home`
- `/documents` → compatibility redirect to `/home?section=documents`
- `/t/[threadId]` (legacy)

The MyOS demo uses a dedicated local-first state layer under `lib/demo/*` backed by IndexedDB.
It ships with deterministic seeded data (Home + 3 workspaces + tasks/documents/activity) and
includes a **Reset demo data** action in Settings.

## Legacy Blue Studio flow

Legacy Blue Studio remains a two-pane AI workspace that turns user intent into a running MyOS document:

1. Chat to generate a blueprint (`STATE: questions` / `STATE: ready`)
2. Generate JS/TS DSL from blueprint
3. Compile + validate generated DSL server-side
4. Review channel bindings
5. Bootstrap and poll/retrieve running document state
6. Ask document assistant questions (blueprint-only before bootstrap, live-state after)
7. Receive webhook-driven invalidations and refresh matching local threads live

## Attachment sources

The `+` menu supports three attachment sources:

1. `Upload file`
2. `Attach app document from another thread`
3. `Attach external MyOS session by sessionId`

Both document-attach flows render canonical plain-text references and create synthetic
`text/plain` files. Those files are fed into the same pending attachment pipeline as normal uploads.
Drag-and-drop behavior is unchanged.

## Prompts

Prompt assets are local and version-pinned in `lib/prompts`:

- `blueprint-architect-prompt.md` (upstream sync)
- `blueprint-to-js-dsl-prompt.md` (JS/TS rewrite for `@blue-labs/sdk-dsl`)
- `document-status-templates-prompt.md`
- `document-qa-prompt.md`
- `document-reference-renderer-prompt.md`

Prompts are **not fetched from GitHub at runtime**.

## Runtime + routes

All routes that touch OpenAI, MyOS, extraction, DSL compile, or live updates are Node runtime:

- `/api/chat`
- `/api/token-count`
- `/api/files/extract`
- `/api/dsl/compile`
- `/api/dsl/continue`
- `/api/dsl/generate`
- `/api/document/qa`
- `/api/document/status-templates`
- `/api/document/reference/render`
- `/api/document/reference/fetch-external`
- `/api/myos/bootstrap`
- `/api/myos/retrieve`
- `/api/myos/live`
- `/api/myos/live/subscriptions`
- `/api/myos/webhooks/register`
- `/api/myos/webhooks/unregister`
- `/api/myos/webhooks/incoming/[registrationId]`

## Local persistence strategy

- `localStorage`
  - credentials
  - last visited thread id
  - browser install id
  - webhook registration metadata keyed by account hash
- IndexedDB
  - workspace snapshots/state
  - uploaded file blobs
  - extracted text artifacts

`Clear all threads` wipes all local workspaces/files and creates one fresh thread.
`Log out` does the same and also clears credentials.

## Security notes

- Credentials are never persisted server-side.
- Credentials are never intentionally logged by app code.
- Error messages are redacted before returning to clients.
- Inputs for secret keys use `type="password"`.
- Webhook verification enforces:
  - `Content-Digest`
  - RFC 9421 HTTP message signatures (JWKS-backed)
  - timestamp skew checks (`X-MyOS-Timestamp`)
  - delivery-id dedupe (`X-MyOS-Delivery-Id`)

### XSS tradeoff

Because credentials are kept in browser storage (user requirement), an XSS vulnerability in the app could expose those credentials. This app mitigates that risk with framework defaults and strict handling, but browser-stored secrets remain a deliberate tradeoff for user-controlled local auth.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

Live counter scenario:

```bash
OPENAI_API_KEY="..." \
MYOS_API_KEY="..." \
MYOS_ACCOUNT_ID="..." \
MYOS_BASE_URL="https://api.dev.myos.blue/" \
npm run test:live
```

### Mandatory live proof flow (shop -> linked order)

To execute the required proof flow test:

```bash
# one-time template
cp /opt/cursor/artifacts/live-credentials.example.json /opt/cursor/artifacts/live-credentials.json
# edit /opt/cursor/artifacts/live-credentials.json with real keys

bash apps/blue-studio-web/scripts/run-live-proof.sh
```

This runs:

- `live-tests/live-account-proof.spec.ts`

The spec automates:

1. Root assistant creates a shop document including an `orders` anchor.
2. Document-context assistant creates an order child linked to `orders`.
3. Retrieval verifies the child appears under the parent `orders` links.
4. Final order details (including `sessionId`) are printed in test logs under:
   - `MANDATORY_PROOF_ORDER_DETAILS`

## Vercel deployment notes

- Set app root to `apps/blue-studio-web` in the Vercel monorepo project settings.
- Keep route handlers touching OpenAI/MyOS/extraction/DSL/live updates on `runtime = "nodejs"`.
- Keep these routes dynamic (`dynamic = "force-dynamic"`), no cache assumptions.
- Credentials are user-provided in browser; server env vars are optional for defaults only.
- If Deployment Protection is enabled (Vercel Authentication / Password Protection), set
  `VERCEL_AUTOMATION_BYPASS_SECRET` so registered webhook callback URLs include
  `x-vercel-protection-bypass=...` and external webhook POSTs can reach `/api/myos/webhooks/incoming/*`.
