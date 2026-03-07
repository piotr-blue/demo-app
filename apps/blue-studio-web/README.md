# Blue Studio Web

Blue Studio Web is a two-pane AI workspace that turns user intent into a running MyOS document:

1. Chat to generate a blueprint (`STATE: questions` / `STATE: ready`)
2. Generate JS/TS DSL from blueprint
3. Compile + validate generated DSL server-side
4. Review channel bindings
5. Bootstrap and poll running document state

## Prompts

Prompt assets are local and version-pinned in `lib/prompts`:

- `blueprint-architect-prompt.md` (upstream sync)
- `blueprint-to-js-dsl-prompt.md` (JS/TS rewrite for `@blue-labs/sdk-dsl`)

Prompts are **not fetched from GitHub at runtime**.

## Runtime + routes

All routes that touch OpenAI, MyOS, extraction, or DSL compile are Node runtime:

- `/api/chat`
- `/api/token-count`
- `/api/files/extract`
- `/api/dsl/compile`
- `/api/dsl/continue`
- `/api/myos/bootstrap`
- `/api/myos/retrieve`

## Local persistence strategy

- `localStorage`
  - credentials
  - active workspace id
  - selected inspector tab
- IndexedDB
  - workspace snapshots/state
  - uploaded file blobs
  - extracted text artifacts

## Security notes

- Credentials are never persisted server-side.
- Credentials are never intentionally logged by app code.
- Error messages are redacted before returning to clients.
- Inputs for secret keys use `type="password"`.
- Logout clears localStorage + IndexedDB workspace state.

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

## Vercel deployment notes

- Set app root to `apps/blue-studio-web` in the Vercel monorepo project settings.
- Keep route handlers touching OpenAI/MyOS/extraction/DSL on `runtime = "nodejs"`.
- Keep these routes dynamic (`dynamic = "force-dynamic"`), no cache assumptions.
- Credentials are user-provided in browser; server env vars are optional for defaults only.
