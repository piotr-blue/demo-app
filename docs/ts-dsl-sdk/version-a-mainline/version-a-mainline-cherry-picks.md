# Cherry-pick catalog from Version B into Version A (updated)

## Must-have
- stronger parity tests
- stronger integration tests
- canonical scenario discipline
- editing collision-safe envelope fix
- named-event / linked-doc final semantics
- public docs/deviation discipline

## Additional selective audit from latest Version B commits
Audit these exact commits from `references/sdk-version-b/.git`:
- `de0dd4859075be3d0d3491f1d79898baa73fac55`
- `6d5c4644c3aa7036d31f124296487ebd3c69283e`
- `74a80ac33a8788319d81e811c80112bbe6d5167e`
- `2ee6a8ce306ba820693455811e5e2dfb83eee13a`

### Likely relevant
- `de0dd48...`
  - myos-js HTTP error logging improvements
  - bootstrap-account docs clarifications if still accurate
- `6d5c464...`
  - document event polling helpers/specs if current tests still read the wrong source (feed entries vs emitted events)
- `74a80ac...`
  - bootstrap binding fix in live helpers if still needed
- `2ee6a8c...`
  - selected test fixes only if still semantically valid after Stages 1–3
  - examples:
    - bootstrap binding assertions
    - `BasicBlueTypes` replacement for bad scalar aliases
    - `waitForLatestEmittedEvent` / polling helpers
    - serialized-node assertion helpers (`isTypeOf`) if still needed

### Likely not relevant
- fixes that only compensated for Version B migration regressions
- assertion rewrites tied to Version B-only names or semantics
- PayNote channel additions if Version A already does the right thing by default

## Nice-to-have
- small export polish
- useful live-story examples that are public-repo-safe

## Do not port wholesale
- monolithic `doc-builder.ts`
- monolithic `steps-builder.ts`
- stale provenance references
- unsupported runtime fields or old compatibility hacks
- entire tail commits without selective audit
