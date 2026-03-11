# SDK DSL Final Status and Deferred Items

This file records the remaining deferred items and runtime guards for the final
Version-A mainline SDK. It is not a backlog of broad parity work: the uplifted
surface is considered production-ready within the current public runtime.

## Supported mainline surface

- modular `DocBuilder` / `SimpleDocBuilder` authoring
- Java-aligned interaction builders (`access`, `accessLinked`, `agency`)
- MyOS step helpers, worker/session helpers, and linked-doc helpers
- AI integration builders and response workflows
- PayNote builder for the runtime-confirmed subset
- editing pipeline support through `DocStructure`, `DocPatch`, and
  `BlueChangeCompiler`

## Final runtime-correct semantics

### `subscribeToSession(...)` helpers

- `steps.myOs().subscribeToSession(...)` and
  `subscribeToSessionWithMatchers(...)` stay runtime-correct and do not accept
  `onBehalfOf`

### `onChannelEvent(...)`

- timeline-like channels (`Conversation/Timeline Channel`,
  `Conversation/Composite Timeline Channel`, `MyOS/MyOS Timeline Channel`)
  match message-type handlers under `event.message`
- direct-event channels remain direct `event` matchers
- explicit timeline-entry matchers stay direct because the event itself is the
  entry envelope

### Stage-6 operation-triggered PayNote branches

- `unlockOnOperation(...)`, `requestOnOperation(...)`, and
  `requestPartialOnOperation(...)` do not emit synthetic request schemas
- runtime proof for these helpers is on the resolved-content
  `Conversation/Operation Request` timeline-entry path used by the real MyOS
  flow and mirrored by sdk-dsl test support
- this does not claim a broader raw-node processor contract-validation path

## Deferred / runtime-guarded items

### `requestBackwardPayment(...)`

- status: deferred/runtime-guarded
- behavior: fail fast instead of emitting a non-public runtime shape

### Reserve/release lock-unlock alias availability

- status: runtime-guarded
- behavior: helpers fail fast when the installed `@blue-repository/types`
  package does not provide the required public aliases

## No longer open

- named-event fallback assumptions are resolved; the SDK uses
  `Common/Named Event`
- interaction-drift notes from the pre-mainline state are resolved and should
  not be treated as current gaps
