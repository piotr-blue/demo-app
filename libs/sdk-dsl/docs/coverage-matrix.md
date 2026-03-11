# SDK DSL Coverage Matrix

This document tracks the current public proof surface for `@blue-labs/sdk-dsl`
after the Version-A mainline uplift and final correction pass.

## Test corpus snapshot

- `33` spec/test files under `libs/sdk-dsl/src`
- `9` execution-backed runtime files (`*.execution.spec.ts`)
- `6` mapping/parity files (`*.mapping.spec.ts`)
- `2` roundtrip/editing matrix files
- public API / canonical coverage under `libs/sdk-dsl/src/__tests__`

## Coverage matrix

| Area | Proof type | Current status | Notes |
| --- | --- | --- | --- |
| DocBuilder core (`name`, fields, sections, channels, operations) | mapping + runtime + roundtrip | covered | builder shape, operation wiring, and section tracking are exercised through mapping specs, runtime execution, and patch/structure roundtrips |
| Triggered workflows (`onInit`, `onEvent`, matcher helpers) | mapping + runtime | covered | includes requestId/subscriptionId/custom matcher paths |
| `onChannelEvent(...)` direct-event channels | mapping | covered | non-timeline channels stay on direct `event` matching |
| `onChannelEvent(...)` timeline-like channels | mapping + runtime | covered | message-type matchers materialize under `event.message`; explicit timeline-entry matchers stay direct |
| Named events | mapping + runtime | covered | uses `Common/Named Event` with root fields; no fallback wrapper semantics remain |
| MyOS helper surface | mapping + runtime | covered | admin channels, marker helpers, subscription helpers, and worker/session flows are exercised in public/runtime specs |
| AI integrations and response workflows | mapping + runtime | covered | task and named-response matching are both exercised |
| Access / linked access / agency | mapping + runtime | covered | runtime-correct request, grant, revoke, and linked-doc semantics are covered |
| StepsBuilder core helpers | mapping + runtime | covered | document updates, raw helpers, bootstrap helpers including explicit `onBehalfOf`, and capture helpers are exercised |
| PayNote runtime-confirmed subset | mapping + runtime + canonical | covered | init/event/doc-path/request flows are covered for reserve/capture/release in the currently supported runtime subset |
| Stage-6 operation-triggered PayNote branches | mapping + runtime + canonical | covered | `unlockOnOperation(...)`, `requestOnOperation(...)`, and `requestPartialOnOperation(...)` now omit synthetic request schemas; runtime proof is through the resolved-content `Conversation/Operation Request` timeline-entry path used in sdk-dsl test support |
| Deferred PayNote helpers | mapping + guard tests | covered | unsupported alias/type cases fail fast explicitly instead of emitting bad runtime shapes |
| `DocStructure` extraction | mapping + roundtrip + public API | covered | summary extraction, section access, and canonical roundtrips are exercised |
| `DocPatch` / `BlueChangeCompiler` | roundtrip + public API | covered | diff/apply/planning behavior is covered through matrix and public API tests |
| Canonical Java-sandbox sample representations | canonical | covered | exported sample builders are validated through fixture intent tokens and targeted structural assertions |

## Explicitly deferred / guarded items

- `requestBackwardPayment(...)` remains deferred and runtime-guarded
- reserve/release lock-unlock helpers remain fail-fast when the installed
  `@blue-repository/types` package does not expose the required aliases

## Related status docs

- `libs/sdk-dsl/issues.md`
- `libs/sdk-dsl/mappings_diff.md`
