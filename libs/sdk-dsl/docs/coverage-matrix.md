# SDK DSL Coverage Matrix (runtime-first)

Legend:
- ✅ covered
- ⚠️ partial / runtime-blocked

## Coverage summary

- Total sdk-dsl tests: **130** across **24** test files
- Execution-backed tests: **50** (`*.execution.spec.ts`)
- Patch roundtrip matrix tests: **20** (`patch-roundtrip.matrix.spec.ts`)
- Structure roundtrip tests: **5** (`doc-structure.roundtrip.spec.ts`)

## Construct matrix

| Construct area | Mapping tests | Execution tests | Patch/roundtrip tests | Notes |
|---|---:|---:|---:|---|
| Doc identity + root fields | ✅ | ✅ | ✅ | covered via doc-builder + patch matrix |
| Field metadata builder | ✅ | ⚠️ | ✅ | runtime execution focuses on field effects |
| Sections + related tracking | ✅ | ⚠️ | ✅ | structural extraction + section-aware patch grouping covered |
| Channels + composite channel | ✅ | ✅ | ✅ | includes composite source runtime behavior |
| Operation + implementation | ✅ | ✅ | ✅ | core increment/decrement scenarios |
| Workflow helpers (`onInit/onEvent/...`) | ✅ | ✅ | ✅ | matcher runtime matrix added |
| Trigger matcher helpers | ✅ | ✅ | ✅ | requestId/subscriptionId/matcher variants |
| Named events | ✅ | ✅ | ✅ | runtime alias behavior (`Conversation/Event`) |
| MyOS admin + canEmit | ✅ | ✅ | ✅ | runtime emission + helper wiring |
| AI integration + tasks + responses | ✅ | ✅ | ✅ | task and named response matching covered |
| Access / linked access / agency builders | ✅ | ✅ | ✅ | mapping + runtime + override helpers |
| Steps core helpers | ✅ | ✅ | ✅ | emit/update/bootstrap/raw/capture coverage |
| Payment step helpers | ✅ | ✅ | ✅ | rails + validation + runtime reserve flow |
| Backward payment helper | ✅ | ✅ | ✅ | fail-fast runtime-availability behavior |
| PayNote builder (runtime-supported paths) | ✅ | ✅ | ✅ | capture/reserve/release request flows |
| PayNote reserve/release lock-unlock aliases | ✅ | ✅ | ✅ | fail-fast runtime-availability behavior |
| DocStructure extraction | ✅ | ⚠️ | ✅ | robust summary/prompt + roundtrip equivalence |
| Generic DocPatch | ✅ | n/a | ✅ | RFC-style JSON patch behavior |
| BlueChangeCompiler | ✅ | n/a | ✅ | root/contract split + atomic contract replacement |

## Runtime-blocked / parity-gap notes

See:
- `libs/sdk-dsl/issues.md`
- `libs/sdk-dsl/mappings_diff.md`
