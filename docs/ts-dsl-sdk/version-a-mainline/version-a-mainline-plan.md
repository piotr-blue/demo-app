# Version A mainline uplift plan (updated)

## Stage 1 — Runtime alignment
Focus files will likely include:
- `libs/sdk-dsl/src/lib/steps/myos-steps.ts`
- `libs/sdk-dsl/src/lib/steps/access-steps.ts`
- `libs/sdk-dsl/src/lib/steps/myos-permissions.ts`
- worker/session helpers
- linked-doc helpers
- named-event helpers

Deliverables:
- subscribe helpers without unsupported fields
- unsupported/deferred markers enforced
- correct worker-session request envelope
- corrected linked-doc semantics
- `Common/Named Event` support
- runtime-shape docs updated

## Stage 2 — Hardening import from Version B
Bring in:
- canonical scenario approach
- strongest parity/integration tests
- editing pipeline hardening
- docs/deviations discipline

Deliverables:
- stronger test corpus
- editing collision-safe behavior
- public-repo-safe scenario docs

## Stage 3 — Ergonomics and compatibility
Deliverables:
- public exports/utilities
- compatibility wrappers and helpers
- low-diff surface for demo-app + myos-js

## Stage 4 — Reference-B tail-commit audit
Audit the latest known useful commits in `references/sdk-version-b/.git`:
- `de0dd4859075be3d0d3491f1d79898baa73fac55`
- `6d5c4644c3aa7036d31f124296487ebd3c69283e`
- `74a80ac33a8788319d81e811c80112bbe6d5167e`
- `2ee6a8ce306ba820693455811e5e2dfb83eee13a`

For each commit:
- inspect the diff
- identify which parts are still relevant after Stages 1–3
- port only those parts
- record why the rest is not applicable if skipped

Expected likely areas:
- `libs/myos-js` HTTP error logging
- event polling helpers for live/integration assertions
- bootstrap binding fix
- selected live-test assertion fixes
- `BasicBlueTypes` / serialized-node assertion fixes if still relevant

## Stage 5 — Canonicalization, docs, and release quality
Deliverables:
- final mapping/docs/deviations
- public scenario suite
- no provenance leaks
- correct exports/dist/types
- publish-ready package shape
- final scorecard and green verification
