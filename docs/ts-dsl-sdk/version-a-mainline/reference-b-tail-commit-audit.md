# Reference-B tail-commit audit

The `references/sdk-version-b` reference intentionally includes `.git`.
Use it to inspect the latest commits that may contain useful fixes discovered during the Version B migration and integration work.

## Commits to audit

### `de0dd4859075be3d0d3491f1d79898baa73fac55`
Topic:
- docs clarifications and HTTP error logging

Likely relevance:
- `libs/myos-js/src/lib/core/http-client.ts`
- `libs/myos-js` docs around bootstrap account id

Port only if the same issue still exists in Version A.

### `6d5c4644c3aa7036d31f124296487ebd3c69283e`
Topic:
- document events polling

Likely relevance:
- `libs/myos-js/src/live/helpers/live-document.ts`
- live tests asserting on emitted events

Port if Version A still asserts on feed entries when it should assert on emitted document events.

### `74a80ac33a8788319d81e811c80112bbe6d5167e`
Topic:
- bootstrap binding fix

Likely relevance:
- `libs/myos-js/src/live/helpers/live-client.ts`

Port if the same bootstrap binding bug exists in Version A.

### `2ee6a8ce306ba820693455811e5e2dfb83eee13a`
Topic:
- test fixes

This commit is mixed.
Audit it carefully after Stages 1–3.

Likely relevant only if still applicable:
- bootstrap channel binding test fixes
- `BasicBlueTypes` instead of bad scalar aliases
- `waitForLatestEmittedEvent` / event polling helpers
- serialized-node assertion helpers such as `isTypeOf`

Potentially NOT relevant:
- fixes that only compensated for Version B migration regressions
- `ownerUpdate` -> `ownerEmit` if Version A deliberately keeps `ownerUpdate`
- PayNote channel additions if Version A already creates the channels correctly

## Rules
- Do not replay these commits wholesale.
- Port only what still makes sense after runtime alignment and compatibility uplift.
- Record every decision in `version-a-mainline-decisions.md`.

## Audit outcome

### `de0dd4859075be3d0d3491f1d79898baa73fac55`
- Ported: richer `http-client` validation/error message details plus unit tests.
- Not applicable: the docs-only wording changes were deferred to the final docs
  pass.

### `6d5c4644c3aa7036d31f124296487ebd3c69283e`
- Ported: emitted-event polling from epoch snapshots, schema-based polling
  helpers, helper specs, and payment-story assertion rewrites.
- Not applicable: deleting the old feed-entry helper entirely, because some
  advanced-control stories still intentionally inspect feed entries.

### `74a80ac33a8788319d81e811c80112bbe6d5167e`
- Ported: `defaultBootstrapBinding(...)` now returns both `email` and
  `accountId` when available.

### `2ee6a8ce306ba820693455811e5e2dfb83eee13a`
- Ported: `BasicBlueTypes.Integer` in the live counter example, default
  bootstrap binding adoption, and emitted-event polling fixes in the payment
  stories.
- Not applicable: `ownerEmit` renames, paynote channel additions already present
  in Version A output, and bootstrap-step object bindings that would require a
  wider SDK API expansion.
