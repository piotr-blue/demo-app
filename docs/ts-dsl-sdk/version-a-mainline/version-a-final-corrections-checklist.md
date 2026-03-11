# Version A — final corrections checklist

- [ ] `onChannelEvent(...)` audited and confirmed correct
- [ ] timeline message matcher shape explicitly tested
- [ ] direct-event channel semantics remain covered
- [ ] Stage-6 operation-triggered PayNote helpers no longer emit synthetic request schemas where requestless semantics are intended
- [ ] PayNote parity tests updated
- [ ] PayNote integration/canonical tests updated
- [ ] any resolved-content proof path documented honestly
- [ ] stale docs updated/replaced:
  - [ ] `libs/sdk-dsl/docs/coverage-matrix.md`
  - [ ] `libs/sdk-dsl/issues.md`
  - [ ] `libs/sdk-dsl/mappings_diff.md`
- [ ] `npm install`
- [ ] `tsc` lib green
- [ ] `tsc` spec green
- [ ] `eslint` green
- [ ] `vitest` green
- [ ] `vite build` green
