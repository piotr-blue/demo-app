# @blue-labs/myos-js

Node-native MyOS SDK for Blue documents and runtime APIs.

## Runtime-first principles

- This SDK is **runtime-first** and designed for compatibility with the current MyOS backend.
- `@blue-labs/sdk-dsl` remains the authoring layer for Blue documents.
- `@blue-labs/myos-js` focuses on transport, API resources, retries, and operational ergonomics.

## Install (workspace package)

This package lives at `libs/myos-js` in the monorepo.

## Quick start

```ts
import { MyOsClient } from '@blue-labs/myos-js';

const client = new MyOsClient({
  apiKey: process.env.MYOS_API_KEY!,
  baseUrl: process.env.MYOS_BASE_URL ?? 'https://api.dev.myos.blue',
});

const me = await client.user.get();
```

## Resource families

- `client.documents`
- `client.timelines`
- `client.webhooks`
- `client.me`
- `client.user`
- `client.users`
- `client.apiKeys`
- `client.myOsEvents`
- `client.integrations`
- `client.maintenance`

## Request options

Most methods accept `requestOptions` as the last argument:

```ts
await client.documents.retrieve('session-id', {
  timeoutMs: 10_000,
  maxRetries: 1,
  headers: { 'X-Trace-Id': 'trace-123' },
  blueContext: { 'Blue Repository': 'repo-blue-id' },
});
```

## sdk-dsl integration

`documents.bootstrap(...)` accepts:

- BlueNode (`DocBuilder.doc().buildDocument()`)
- plain Blue JSON objects
- builder-like objects exposing `buildDocument()`

See:

- `docs/myos-js-sdk-dsl-integration.md`

## Testing

- Unit + contract tests:
  - `NX_DAEMON=false npx nx test myos-js --skip-nx-cache`
- Type-check:
  - `npx tsc -p libs/myos-js/tsconfig.lib.json --noEmit`
- Lint:
  - `NX_DAEMON=false npx nx run myos-js:lint --skip-nx-cache`

Live tests are opt-in via environment variables.
AccountId-oriented live scenarios also require `MYOS_ACCOUNT_ID`.

See:

- `docs/myos-js-live-testing.md`

## Operation coverage

The SDK operation coverage matrix is generated from OpenAPI metadata.

- `operation-matrix.md`
- `docs/operation-matrix.md`
