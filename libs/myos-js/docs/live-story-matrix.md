# MyOS JS live story matrix

This matrix tracks the live end-to-end story suite where:

- documents are authored via `@blue-labs/sdk-dsl`,
- bootstrapped and driven via `@blue-labs/myos-js`,
- and asserted for both generated structure and runtime behavior.

| Story | Docs created | DSL constructs covered | MyOS SDK operations used | Runtime assertions | Status |
|---|---|---|---|---|---|
| Story 0 — Counter | 1 | `name`, `field`, `channel`, `operation`, `requestType`, `replaceExpression`, `section` | `documents.bootstrap`, `documents.retrieve`, `documents.runOperation` | `/counter` starts at `0`, `increment` allowed, then `/counter=1`, section metadata survives roundtrip | implemented |
| Story 1 — Composite shared value | 1 | `channels`, `compositeChannel`, operation builder, request description | `documents.bootstrap`, `documents.retrieve`, `documents.runOperation` | composite operation callable, `/dataValue` updates, child channel timelineIds are distinct | implemented |
| Story 2 — Direct change | 1 | `directChange`, contracts policy, change request contract | `documents.bootstrap`, `documents.runOperation`, `documents.retrieve` | request reaches feed but runtime does not currently apply change to document state | blocked (see `libs/myos-js/issues.md`) |
| Story 3 — canEmit + named event | 1 | `canEmit`, `onNamedEvent`, `onTriggeredWithMatcher` | `documents.bootstrap`, `documents.runOperation`, `documents.retrieve` | named event updates shipment status; payload variant copies `orderId` | implemented |
| Story 4 — onDocChange | 1 | `onDocChange`, operation + update workflow | `documents.bootstrap`, `documents.runOperation`, `documents.retrieve` | increment updates `/counter`, doc-change workflow sets `/counterState=updated` | implemented |
| Story 5 — onChannelEvent real timeline entry | 1 | `onChannelEvent` with timeline-entry matcher | `documents.bootstrap`, `documents.retrieve`, `timelines.entries.create` | external timeline entry on `signalChannel` sets `/shipmentConfirmed=true` | implemented |
| Story 6 — Subscribe + remote op + mirror | 2 | `type(MyOS/Agent)`, `sessionInteraction`, `myOsAdmin`, permission/subscription/call-operation DSL wiring | `documents.bootstrap`, `documents.retrieve`, `documents.runOperation` | source operation path is live; mirror orchestration assertions are runtime-gated | blocked (see `libs/myos-js/issues.md`) |
| Story 7 — Initiated snapshot reaction | 2 | initiated snapshot watcher DSL wiring | `documents.bootstrap`, `documents.retrieve`, `documents.runOperation` | source profile update path is live; watcher snapshot assertions are runtime-gated | blocked (see `libs/myos-js/issues.md`) |
| Story 8 — Filtered subscriptions | 2 | filtered subscription helper (`subscribeToSessionWithMatchers`), multiple IDs and matchers | `documents.bootstrap`, `documents.retrieve`, `documents.runOperation` | source patterned emission path is live; subscriber filtered-update assertions are runtime-gated | blocked (see `libs/myos-js/issues.md`) |
| Story 9 — Anchors + links visibility | 2 | `documentAnchors`, `sessionLink` | `documents.bootstrap`, `documents.links.list` | linked session appears via links API for target anchor | implemented |
| Story 10 — Linked-docs permission watcher | 3+ | linked-doc permission request flow + correlated response handling | `documents.bootstrap`, `documents.retrieve`, `documents.feedEntries.list` | initial grant events are confirmed in watcher feed; later-link incremental updates are runtime-gated | blocked (see `libs/myos-js/issues.md`) |
| Story 11 — Participants add orchestration | 1 | `participantsOrchestration`, participant request emission, participant-resolved workflow updates | `documents.bootstrap`, `documents.runOperation`, `documents.retrieve` | reviewer channel contract is added dynamically, reviewer group updated, resolved marker stored | implemented |
| Story 12 — Participants remove orchestration | 1 (extends story 11 doc) | remove participant request + responded workflow updates | `documents.runOperation`, `documents.retrieve` | reviewer contract removed, reviewer group pruned, removal marker stored | implemented |
| Story 13 — Parent bootstraps child | 2 | `steps.myOs().bootstrapDocument`, bootstrap response workflow, nested child built with DSL | `documents.bootstrap`, `documents.retrieve`, `documents.runOperation` | live child-bootstrap request currently rejected by runtime validation | blocked (see `libs/myos-js/issues.md`) |
| Story 14 — PayNote shipment escrow | 1 | `PayNotes.payNote`, `capture().lockOnInit`, `unlockOnOperation`, `requestOnOperation`, event-reaction workflow | `documents.bootstrap`, `documents.runOperation`, `documents.feedEntries.list`, `documents.epochs.*` | expected emitted paynote lock/unlock/capture visibility remains runtime-gated | blocked (see `libs/myos-js/issues.md`) |
| Story 15 — Payment request emission | 1 | `triggerPayment`, rails (`viaAch`, `viaCreditLine`, `viaLedger`), payment payload fields | `documents.bootstrap`, `documents.runOperation`, `documents.feedEntries.list` | operation paths run; emitted payment payload visibility remains runtime-gated | blocked (see `libs/myos-js/issues.md`) |
| Story 16 — Backward payment / voucher | 0 (live story skipped) | `requestBackwardPayment`, `attachPayNote` (runtime-gated) | n/a (skipped when alias unavailable) | blocked by missing repository type alias in current runtime package | blocked (see `libs/myos-js/issues.md`) |
| Story 17 — Triggered matcher | 1 | `onTriggeredWithMatcher` with correlation matcher + `canEmit` | `documents.bootstrap`, `documents.runOperation`, `documents.retrieve` | correlated event with `CID_1` flips `/matched=true` | implemented |
| Story 18 — Section metadata preservation | sampled docs (Story 0, Story 6 source doc) | `section`, `relatedFields`, `relatedContracts` | `documents.retrieve` | section contracts and related references survive live bootstrap/retrieve roundtrip | implemented |

