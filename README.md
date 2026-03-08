# Blue Studio Web (demo-app)

This repository hosts `apps/blue-studio-web`, a Next.js App Router + TypeScript web app that:

- runs a blueprint chat loop with OpenAI Responses API (`gpt-5.4`, `reasoning.effort=low`)
- generates JS/TS Blue DSL from a ready blueprint
- compiles and validates the generated DSL server-side before bootstrap
- reviews channel bindings and bootstraps the document via `@blue-labs/myos-js`
- polls/retrieves document state and renders inspector tabs (overview, status, assistant, blueprint, dsl, bindings, bootstrap, document, changes, activity)
- supports multi-source attachments (`upload`, `attach app document`, `attach external MyOS session`)
- supports webhook/SSE invalidation routing for live local thread updates

## Repository layout

- `apps/blue-studio-web` — main app
- `libs/sdk-dsl` — imported SDK DSL source from blue-js branch
- `libs/myos-js` — imported MyOS SDK source from blue-js branch
- `libs/language` and `libs/document-processor` — tsconfig stubs used for toolchain compatibility

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Live end-to-end test (counter flow)

```bash
OPENAI_API_KEY="..." \
MYOS_API_KEY="..." \
MYOS_ACCOUNT_ID="..." \
MYOS_BASE_URL="https://api.dev.myos.blue/" \
npm run test:live
```

This test exercises the app routes end-to-end:

1. chat blueprint generation
2. DSL generation + compile/validation
3. MyOS bootstrap
4. retrieve polling until running/snapshot availability