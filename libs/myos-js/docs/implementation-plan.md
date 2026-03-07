# myos-js implementation plan

## Mission

Build `@blue-labs/myos-js` as a Node-native, runtime-first SDK that is schema-complete for currently available MyOS API operations and integrates naturally with `@blue-labs/sdk-dsl`.

## Security and secrets policy

- Never commit API keys or secret environment values.
- Never print secret values in logs, test snapshots, or error snapshots.
- Use environment variables only:
  - `MYOS_API_KEY` (required for live user tests)
  - `MYOS_BASE_URL` (optional, defaults to `https://api.dev.myos.blue`)
  - `MYOS_BOOTSTRAP_EMAIL` (required for bootstrap live tests)
  - `MYOS_SYSTEM_API_KEY` (optional, system-only maintenance tests)
  - `MYOS_WEBHOOK_TEST_URL` (optional, webhook live tests)
  - `MYOS_DASHBOARD_URL` (optional debug metadata only; never used as HTTP API base)
- Redact sensitive headers (`Authorization`) in diagnostic output.

## Work breakdown

1. Baseline verification on existing sdk-dsl branch.
2. OpenAPI operation inventory + generated schema types.
3. Core HTTP transport + retry + error handling + request options.
4. Resource clients for all operation families.
5. SDK-DSL bootstrap integration (`BlueNode` / JSON / builder-like input).
6. Three-tier test harness (unit, mocked contract, live opt-in).
7. Documentation and examples.

## Testing policy

- Unit tests: always on.
- Contract tests: always on and cover all operation mappings.
- Live tests: opt-in and skipped with explicit reasons when env is incomplete.
- Maintenance live tests require `MYOS_SYSTEM_API_KEY` and are otherwise skipped.
