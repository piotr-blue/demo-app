# Blue Studio Web — proof of run

This document captures the final validation evidence for the phase-2 implementation.

## Static + automated checks

Executed from repository root:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Result:

- `typecheck` passed
- `lint` passed
- `vitest` passed (`91` tests across unit + route coverage)
  - assistant viewer fallback + neutral QA input
  - money minor-unit formatting
  - synthetic file creation + workspace picker filters
  - document reference render/fetch routes
  - webhook register/unregister/incoming + subscription routes
  - digest/timestamp/signature verification helpers + delivery dedupe
- production build passed (all app routes compiled)

## Playwright UI smoke

Executed:

```bash
npm run test:e2e
```

Covered:

- thread routing (`/` redirect + `/t/[threadId]` flow)
- multi-thread switching + persistence
- document assistant blueprint-only mode + no-participant fallback guidance
- `+` menu all three attachment paths (upload, app document, external session)
- drag-and-drop attachment regression
- clear-all thread reset behavior
- webhook/SSE invalidation updates status + thread title/summary

Result:

- targeted Playwright scenarios passed (`6` tests)

## Live counter end-to-end flow

Executed (with env-provided credentials):

```bash
OPENAI_API_KEY=... \
MYOS_API_KEY=... \
MYOS_ACCOUNT_ID=... \
MYOS_BASE_URL=https://api.dev.myos.blue/ \
npm run test:live
```

Live flow assertions:

1. `/api/chat` produced a ready blueprint (`STATE: ready`)
2. `/api/dsl/continue` generated and compiled DSL successfully
3. `/api/myos/bootstrap` returned session information
4. `/api/myos/retrieve` polling confirmed running/snapshot availability
5. `/api/document/status-templates` returned a valid template bundle
6. `/api/document/qa` returned a non-empty live-state answer

Result:

- `live-tests/counter-flow.spec.ts` passed

This satisfies the required end-to-end counter document proof path: prompt → blueprint → DSL → bootstrap → retrieved running document state.
