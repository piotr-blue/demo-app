# myos-js developer guide

## Architecture

`myos-js` is split into:

1. **Generated schema layer**
   - `src/lib/generated/schema-types.ts`
   - generated from `openapi/api-schema-2.yaml`
2. **Core transport layer**
   - `src/lib/core/http-client.ts`
   - `src/lib/core/errors.ts`
   - `src/lib/core/request-options.ts`
   - `src/lib/core/pagination.ts`
   - `src/lib/core/serialize.ts`
   - `src/lib/core/redact.ts`
3. **Resource layer**
   - `src/lib/resources/*`
   - explicit operation mapping wrappers
4. **sdk-dsl bridge**
   - `src/lib/dsl/document-input.ts`
   - `src/lib/dsl/bootstrap-options.ts`

## Generation flow

```bash
node libs/myos-js/scripts/generate-openapi-snapshot.mjs
node libs/myos-js/scripts/generate-schema-types.mjs
node libs/myos-js/scripts/generate-operation-matrix.mjs
```

Or from package scripts:

```bash
cd libs/myos-js
npm run generate:all
```

## Error model

- `MyOsError`
- `MyOsAuthError`
- `MyOsValidationError`
- `MyOsRateLimitError`
- `MyOsNotFoundError`
- `MyOsServerError`

Status mapping is deterministic and tested.

## Retry behavior

- Retries transient failures (`429`, `5xx`, and retryable transport failures).
- Uses exponential backoff with jitter.
- Per-request `maxRetries` override is supported.

## Blue-Context support

- Request: `RequestOptions.blueContext`
- Response: `HttpResponseEnvelope.blueContext` from low-level request API

## Security checklist

- Never log API keys.
- Never snapshot raw `Authorization` headers.
- Use redaction helpers for diagnostics.
- Keep secrets in environment variables only.
