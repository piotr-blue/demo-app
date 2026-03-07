# myos-js operation matrix guide

The canonical operation matrix is generated from OpenAPI metadata:

- `docs/operation-matrix.md`

It tracks:

- tag/family
- operationId
- HTTP method + path
- response schema + status
- pagination style
- SDK method mapping
- coverage expectation (contract/unit/live/gated)

## Regeneration

```bash
node libs/myos-js/scripts/generate-operation-matrix.mjs
```

## Coverage policy

- Every operationId must have at least mocked contract coverage.
- High-value flows are covered with live tests.
- System-only and webhook-callback-dependent endpoints are explicitly gated.
