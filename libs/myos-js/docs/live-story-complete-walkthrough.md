# MyOS JS Live Story Suite — Complete Story-by-Story Walkthrough

This document is the full narrative companion to the live story suite introduced in:

- `libs/myos-js/src/live/stories/basic-and-events.live.spec.ts`
- `libs/myos-js/src/live/stories/session-interaction.live.spec.ts`
- `libs/myos-js/src/live/stories/links-and-participants.live.spec.ts`
- `libs/myos-js/src/live/stories/bootstrap-and-payments.live.spec.ts`

It explains, story by story:

1. what each story is about,
2. which DSL documents/builders are used (including all related docs),
3. how each test works,
4. what was run on live MyOS, what worked, and what did not.

---

## 0. Scope and execution model

### Core principle

All story documents are authored with `@blue-labs/sdk-dsl`, then bootstrapped and exercised using `@blue-labs/myos-js`.

### Shared harness used by all stories

The suite is standardized on reusable helpers from `libs/myos-js/src/live/helpers`:

- client/bootstrap:
  - `createLiveClient`
  - `defaultBootstrapBinding`
  - `createUniqueName`
  - `bootstrapDslDocument`
- retrieval/extraction:
  - `retrieveDocument`
  - `extractField`
  - `extractTimelineId`
- synchronization/polling:
  - `waitForAllowedOperation`
  - `waitForFieldValue`
  - `waitForPredicate`
- feed/epoch helpers:
  - `listFeedEntries`
  - `latestEmittedEvents`
  - `latestEpoch`

### Important runtime note

MyOS bootstrap frequently creates an initial bootstrap session wrapper. The helper layer resolves to target sessions where needed. This is critical for stable story execution.

### Live run status legend

- **Worked on MyOS**: behavior validated end-to-end in this environment.
- **Partially worked**: core path validated, but deeper assertions are runtime-gated.
- **Blocked**: meaningful runtime blocker documented in `libs/myos-js/issues.md`.

---

## Story 0 — Counter bootstrap and increment

### What the story is about

Baseline “hello-world” live flow:

- bootstrap a simple counter doc,
- verify operation availability,
- run increment,
- verify state mutation.

### DSL docs used

- `buildCounterStoryDocument` in `src/live/stories/docs/basic.docs.ts`
  - DSL constructs:
    - `DocBuilder.doc()`
    - `section('counterSection', ...)`
    - `field('/counter', 0)`, `field('/name', ...)`
    - `channel('ownerChannel', 'MyOS/MyOS Timeline Channel')`
    - `operation('increment', ..., BasicBlueTypes.Integer, ..., replaceExpression(...))`

### How the test works

In `basic-and-events.live.spec.ts`:

1. bootstrap counter doc with owner binding,
2. retrieve and assert structural contracts exist (`increment`, `incrementImpl`, section contract),
3. wait for `increment` to become allowed,
4. run operation with request `1`,
5. poll `/counter` until `1`.

### MyOS run result

✅ **Worked on MyOS**.

---

## Story 1 — Composite channel shared value

### What the story is about

Demonstrates multi-channel composition where either participant channel can drive one shared operation.

### DSL docs used

- `buildCompositeSharedValueDocument` (`basic.docs.ts`)
  - constructs:
    - two timeline channels: `aliceChannel`, `bobChannel`
    - `compositeChannel('aliceOrBobChannel', 'aliceChannel', 'bobChannel')`
    - `operation('setDataValue', ..., BasicBlueTypes.Text, replaceExpression(...))`
    - section metadata around related fields/contracts

### How the test works

1. bootstrap with both channel bindings,
2. retrieve and assert channel/composite contracts exist,
3. assert distinct timeline IDs for `aliceChannel` and `bobChannel`,
4. wait for `setDataValue`,
5. run operation with `'hello'`,
6. poll `/dataValue == 'hello'`.

### MyOS run result

✅ **Worked on MyOS**.

---

## Story 2 — Direct change operation flow

### What the story is about

Validates DSL `directChange(...)` contract generation and runtime application of JSON-patch-like changes.

### DSL docs used

- `buildDirectChangeDocument` (`basic.docs.ts`)
  - constructs:
    - `field('/text', 'Initial')`
    - timeline channel
    - `directChange('changeDocument', ...)`

### How the test works

1. bootstrap doc,
2. assert structural contracts exist:
   - `changeDocument`
   - `changeDocumentImpl`
   - `contractsPolicy`
3. run `changeDocument` with a runtime-correct `Conversation/Change Request`
   payload including `summary` and typed `Core/Json Patch Entry` changeset
   items,
4. wait for `/text = "Updated text"`.

### MyOS run result

✅ **Implemented**

### What happened on MyOS

- Direct change mutates the document when the request payload is fully typed for
  the current runtime path.
- The working live payload includes top-level `summary` plus
  `type: Core/Json Patch Entry` on each changeset entry.

---

## Story 3 — canEmit + named event listeners

### What the story is about

Tests event emission/listening with both:

- simple named event,
- matcher with payload extraction.

### DSL docs used

- `buildNamedEventDocument` (`basic.docs.ts`)
  - constructs:
    - `canEmit('ownerChannel')` (JS mapping produces `ownerUpdate`)
    - `onNamedEvent('shipment-confirmed', ...)`
    - `onTriggeredWithMatcher('Common/Named Event', {name: ...}, ...)`
    - field updates via `replaceValue` and `replaceExpression`

### How the test works

1. bootstrap and assert `ownerUpdate` + workflow contracts,
2. run `ownerUpdate` with `shipment-confirmed`,
3. assert `/shipment/status == 'confirmed'`,
4. run second payload-bearing event,
5. assert `/shipment/orderId == 'ORD-100'`.

### MyOS run result

✅ **Worked on MyOS**.

---

## Story 4 — onDocChange reaction

### What the story is about

Tests DSL change listeners on a field path.

### DSL docs used

- `buildDocChangeReactionDocument` (`basic.docs.ts`)
  - constructs:
    - increment operation on `/counter`
    - `onDocChange('...','/counter',...)` to mark `/counterState`

### How the test works

1. bootstrap,
2. run increment with `2`,
3. assert `/counter == 2`,
4. assert `/counterState == 'updated'`.

### MyOS run result

✅ **Worked on MyOS**.

---

## Story 5 — onChannelEvent with real timeline entry

### What the story is about

Verifies a second timeline channel can trigger workflow logic from real timeline entries.

### DSL docs used

- `buildChannelEventSignalDocument` (`basic.docs.ts`)
  - constructs:
    - two channels (`ownerChannel`, `signalChannel`)
    - `onChannelEvent(..., 'signalChannel', 'Conversation/Timeline Entry', ...)`

### How the test works

1. bootstrap with two bindings,
2. resolve `signalChannel` timeline ID,
3. create timeline entry with message `{ type: 'Common/Named Event', name: 'shipment-confirmed' }`,
4. assert `/shipmentConfirmed == true`,
5. assert `/shipmentSource == 'shipment-confirmed'`.

### MyOS run result

✅ **Worked on MyOS**.

---

## Story 6 — Permission -> subscribe -> remote call -> mirror

### What the story is about

Cross-session orchestration:

- source counter doc,
- mirror agent that requests permission, subscribes, and calls source operation,
- mirror updates local reflected state.

### DSL docs used (all related docs)

1. `buildSourceCounterDocument` (`session.docs.ts`)
   - counter operation source
   - includes section metadata
2. `buildCounterMirrorAgentDocument` (`session.docs.ts`)
   - `type('MyOS/Agent')`
   - `sessionInteraction()`
   - `myOsAdmin('myOsAdminChannel')`
   - `onInit -> requestSingleDocPermission`
   - matcher-based grant handling
   - subscribe + callOperation
   - matcher-based epoch update handling with `jsRaw` + `updateDocumentFromExpression`

### How the test works

1. bootstrap source and validate source operation path (`increment`),
2. run source increment once (this portion remains always active),
3. if enabled via `MYOS_ENABLE_STORY_6=true`, bootstrap mirror agent and assert:
   - source counter advanced by remote call,
   - mirror `/mirroredCounter` and `/subscriptionState` update.

### MyOS run result

⚠️ **Partially worked / blocked**.

- Source-document path works.
- Mirror orchestration assertions are runtime-gated by default.

### What happened on MyOS

- Permission grant side-document appears,
- mirror agent remains idle in observed runs,
- remote increment from mirror did not materialize.
- Tracked in issues as Story 6 blocker.

---

## Story 7 — Subscription initiated snapshot watcher

### What the story is about

Agent should capture initial and advanced snapshots from subscription update events.

### DSL docs used

1. `buildSourceProfileDocument`
   - fields `/displayName`, `/score`
   - operation `updateScore`
2. `buildSnapshotWatcherDocument`
   - agent with `sessionInteraction()`
   - permission request on init
   - subscribe on grant
   - matcher-based handlers for:
     - `MyOS/Subscription to Session Initiated`
     - `MyOS/Session Epoch Advanced`
   - updates `/snapshot/*` and `/lastEpoch`

### How the test works

1. bootstrap source profile and verify source operation path (`updateScore` to 9),
2. if enabled via `MYOS_ENABLE_STORY_7=true`, bootstrap watcher and assert snapshot fields update.

### MyOS run result

⚠️ **Partially worked / blocked**.

- Source profile update works.
- Watcher snapshot assertions are runtime-gated by default.

### What happened on MyOS

- Watcher bootstraps successfully,
- snapshot fields do not move as expected in observed runs.
- Tracked in issues as Story 7 blocker.

---

## Story 8 — Filtered subscriptions with matchers

### What the story is about

Proves filtered subscription support using the new DSL helper with multiple subscription IDs and matcher payloads.

### DSL docs used

1. `buildPatternSourceDocument`
   - emits request/event topics
   - increments `/emitted`
2. `buildPatternSubscriberDocument`
   - uses `subscribeToSessionWithMatchers(...)` twice:
     - event filter (`Conversation/Event` + topic)
     - request filter (`Conversation/Request`)
   - tracks readiness + match counters + topics

### How the test works

1. bootstrap source and verify source operation path (`emitPatternedEvents`, `/emitted` increment),
2. if enabled via `MYOS_ENABLE_STORY_8=true`, bootstrap subscriber and assert:
   - both subscriptions initiate,
   - per-filter counters and topics update.

### MyOS run result

⚠️ **Partially worked / blocked**.

- Source emission path works.
- Subscriber filtered-update assertions are runtime-gated by default.

### What happened on MyOS

- Subscriber session boots,
- expected counter/topic updates are not observed in this environment.
- Tracked in issues as Story 8 blocker.

---

## Story 9 — Anchors + links API visibility

### What the story is about

Ensures anchor + link modeling is visible through MyOS links API.

### DSL docs used

1. `buildBaseAnchorDocument`
   - `documentAnchors([anchorName])`
2. `buildLinkedDocument`
   - `sessionLink('targetBaseSession', anchorName, baseSessionId)`

### How the test works

1. bootstrap base anchored doc,
2. bootstrap linked doc to base anchor,
3. call `documents.links.list(baseSessionId, { anchor })`,
4. assert returned links list is non-empty.

### MyOS run result

✅ **Worked on MyOS**.

---

## Story 10 — Linked-doc permission watcher

### What the story is about

Watcher agent requests linked-doc permissions and should track grants, including grants for later-added linked docs.

### DSL docs used

1. `buildBaseAnchorDocument`
2. `buildLinkedDocument` (seed + later linked doc)
3. `buildLinkedGrantWatcherDocument`
   - agent with `requestLinkedDocsPermission`
   - matcher-based handlers for:
     - `MyOS/Linked Documents Permission Granted`
     - fallback `MyOS/Single Document Permission Granted`
   - increments `/grantSeenCount`
   - stores `/lastGrantedTargetSessionId`

### How the test works

1. bootstrap base + seed link,
2. bootstrap watcher agent,
3. assert the initial linked-doc permission grant via the watcher's latest
   emitted event snapshot,
4. bootstrap later linked doc,
5. wait for a new correlated emitted grant event after the pre-link epoch
   boundary,
6. assert `/grantSeenCount` increases and `/lastGrantedTargetSessionId`
   changes to the later linked session.

### MyOS run result

✅ **Worked on MyOS**.

### What happened on MyOS

- The watcher receives the initial correlated linked-doc grant.
- Later linked docs also produce a new correlated grant event.
- The reliable assertion surface is the latest epoch `emitted` snapshot, not
  feed entries.

---

## Story 11 — Participants add orchestration

### What the story is about

Dynamic participant add flow with contract/group updates in an orchestration agent.

### DSL docs used

- `buildProjectBoardDocument` (`links.docs.ts`)
  - `participantsOrchestration()`
  - operation `addReviewer` (dictionary request)
  - emits `MyOS/Adding Participant Requested`
  - consumes participant-resolved events and updates:
    - dynamic `/contracts/<channel>`
    - `/reviewerGroup`
    - `/lastResolvedParticipant`

### How the test works

1. bootstrap board agent,
2. assert marker + reviewer group presence,
3. run `addReviewer` with email/channel,
4. wait for `/lastResolvedParticipant`,
5. assert new reviewer channel timeline differs from owner,
6. assert reviewer group reflects addition.

### MyOS run result

✅ **Worked on MyOS**.

---

## Story 12 — Participants remove orchestration

### What the story is about

Follow-up removal flow from Story 11.

### DSL docs used

- same `buildProjectBoardDocument`, specifically:
  - operation `removeReviewer`
  - emits `MyOS/Removing Participant Requested`
  - updates document through:
    - operation-side `jsRaw` remove patch
    - event-side remove handler (additional safety)

### How the test works

1. after add flow, run `removeReviewer`,
2. wait for `/lastRemovedParticipant`,
3. assert reviewer contract removed,
4. assert reviewer group no longer contains reviewer.

### MyOS run result

✅ **Worked on MyOS**.

---

## Story 13 — Parent bootstraps child voucher doc

### What the story is about

Parent agent requests child bootstrap and tracks child session lifecycle.

### DSL docs used (all related docs)

1. `buildVoucherChildDocument`
   - child voucher with `redeem` operation
2. `buildParentVoucherOrchestratorDocument`
   - agent + `sessionInteraction`
   - operation `issueVoucher` using `steps.myOs().bootstrapDocument(...)`
     with explicit `onBehalfOf: ownerChannel`
   - reacts to `MyOS/Target Document Session Started`
     matched by `inResponseTo.requestId`
   - stores `/childSessionId` from `event.initiatorSessionIds[0]`
   - tracks `/childSessionId` and `/childStatus`
   - includes section metadata

### How the test works

1. bootstrap parent,
2. run `issueVoucher`,
3. wait for child session metadata,
4. retrieve child and run `redeem`,
5. assert child voucher status progression.

### MyOS run result

✅ **Implemented**

### What happened on MyOS

- Parent emits `Conversation/Document Bootstrap Requested` with explicit
  `onBehalfOf` and correlated `requestId`.
- Parent workflow listens for `MyOS/Target Document Session Started` with
  matching `inResponseTo.requestId`.
- Child session id is read from `initiatorSessionIds[0]`, then the child
  voucher document is retrieved and redeemed in the live test.

---

## Story 14 — PayNote shipment escrow (capture lock/unlock/request)

### What the story is about

PayNote capture controls:

- lock on init,
- unlock on shipment confirmation,
- capture request by guarantor.

### DSL docs used

- `buildShipmentEscrowPayNoteDocument`
  - starts from `PayNotes.payNote(...)`
  - `capture().lockOnInit().unlockOnOperation(...).requestOnOperation(...)`
  - additional fields `/shipment/status`, `/capture/status`
  - event handlers:
    - `PayNote/Card Transaction Capture Unlock Requested`
    - `PayNote/Capture Funds Requested`
  - section metadata included

### How the test works

If enabled via `MYOS_ENABLE_STORY_14=true`:

1. bootstrap paynote,
2. assert section structure,
3. verify lock-request event visibility,
4. run `confirmShipment`, assert status updates + unlock event visibility,
5. run `requestCapture`, assert capture request visibility.

### MyOS run result

❌ **Blocked** (gated by default).

### What happened on MyOS

- Event visibility for lock/unlock/capture did not produce reliable assertions through currently used feed/epoch surfaces.
- Tracked in issues as Story 14 blocker.

---

## Story 15 — Payment request emissions (ACH / credit-line / ledger)

### What the story is about

Validates rail-specific `triggerPayment` event payload composition for three payment rails.

### DSL docs used

- `buildPaymentEmissionDocument`
  - operations:
    - `issuePayoutAch`
    - `issuePayoutCreditLine`
    - `issuePayoutLedger`
  - each sets `/payment/requested = true` and emits `PayNote/Reserve Funds Requested` with rail-specific fields.

### How the test works

If enabled via `MYOS_ENABLE_STORY_15=true`:

1. bootstrap doc,
2. run all three operations and assert `/payment/requested`,
3. inspect emitted events and assert rail payload fields:
   - ACH: `routingNumber`
   - credit line: `creditLineId`
   - ledger: `ledgerAccountTo`

### MyOS run result

❌ **Blocked** (gated by default).

### What happened on MyOS

- Operation requests are visible, but emitted payment event payloads are not consistently surfaced by feed/epoch APIs used in test assertions.
- Tracked in issues as Story 15 blocker.

---

## Story 16 — Backward payment / voucher request

### What the story is about

Backward payment flow emitting `PayNote/Backward Payment Requested` with an attached PayNote payload.

### DSL docs used

- `buildBackwardPaymentVoucherDocument`
  - operation `issueVoucher`
  - uses `steps.requestBackwardPayment(...)`
  - attaches child paynote payload from `PayNotes.payNote(...).buildJson()`

### How the test works

1. first checks `isRepositoryTypeAliasAvailable('PayNote/Backward Payment Requested')`,
2. if alias is present, bootstraps doc and asserts backward payment event appears after operation,
3. otherwise returns early (runtime/type gate).

### MyOS run result

❌ **Blocked by type/runtime availability**.

### What happened on MyOS

- Current runtime package does not expose alias `PayNote/Backward Payment Requested`.
- Story is intentionally skipped until alias is available.

---

## Story 17 — Triggered matcher with correlation id

### What the story is about

Verifies `onTriggeredWithMatcher` matching on correlation metadata.

### DSL docs used

- `buildTriggeredMatcherDocument`
  - `canEmit('ownerChannel')`
  - `onTriggeredWithMatcher('Conversation/Event', { name, correlationId }, ...)`

### How the test works

1. bootstrap doc,
2. run `ownerUpdate` with correlated event (`CID_1`),
3. assert `/matched == true`,
4. sanity check processing remains active.

### MyOS run result

✅ **Worked on MyOS**.

---

## Story 18 — Section metadata roundtrip preservation

### What the story is about

Cross-cutting structural coverage: section contracts and related references survive bootstrap/retrieve roundtrip.

### DSL docs used

Section-enabled docs sampled in tests:

- Story 0: `buildCounterStoryDocument` (`counterSection`)
- Story 6 source: `buildSourceCounterDocument` (`sourceCounterSection`)
- (other sectionized docs also exist, e.g. parent/paynote docs in story builders)

### How the test works

- For sampled docs, tests retrieve document and assert section contract presence plus related metadata fields.

### MyOS run result

✅ **Worked on MyOS** for sampled docs included in active assertions.

---

## Story 19 — Propose / accept / reject change lifecycle

### What the story is about

Covers first-class change-lifecycle contracts beyond direct-change:

- propose change,
- accept change,
- reject change.

### DSL docs used

- `buildChangeLifecycleDocument`
  - `proposeChange('proposeChange', 'ownerChannel')`
  - `acceptChange('acceptChange', 'ownerChannel')`
  - `rejectChange('rejectChange', 'ownerChannel')`
  - inherited `contractsPolicy`.

### How the test works

1. bootstrap document,
2. assert lifecycle contracts are present (`propose/accept/reject` + impl),
3. optional env-gated behavioral probe sends a propose request and watches feed emission.

### MyOS run result

⚠️ **Structure proven**. Behavioral lifecycle execution remains env-gated pending
dedicated runtime confirmation.

---

## Story 20 — Permission revoke lifecycle (single + linked)

### What the story is about

Adds full permission lifecycle surface for an agent:

- request single-doc permission,
- revoke single-doc permission,
- request linked-doc permission,
- revoke linked-doc permission.

### DSL docs used

- target source doc (`buildStopResumeControlDocument`) used as permission target,
- anchor root + linked seed docs (`buildBaseAnchorDocument`, `buildLinkedDocument`),
- lifecycle agent (`buildPermissionLifecycleAgentDocument`) with:
  - `sessionInteraction()`,
  - `myOsAdmin('myOsAdminChannel')`,
  - request/revoke operations for single and linked permission flows,
  - response matchers updating counters.

### How the test works

1. bootstrap source and linked graph docs,
2. bootstrap lifecycle agent,
3. assert lifecycle operations/contracts are present,
4. optional env-gated behavioral path runs request/revoke operations and waits for counter updates.

### MyOS run result

⚠️ **Structure proven**. End-to-end revoke/grant behavior remains env-gated for
runtime confirmation.

---

## Story 21 — Subscription revoked / reinitiated lifecycle

### What the story is about

Companion to Story 20, focusing on subscription lifecycle after permission
roundtrips.

### DSL docs used

- Reuses `buildPermissionLifecycleAgentDocument`:
  - single-doc permission request stays runtime-correct and uses an explicit subscribe step,
  - subscription initiation events increment `/subscriptionInitiatedCount`.

### How the test works

1. run single grant + revoke flow,
2. request single grant again,
3. verify subscription initiation count grows beyond initial value (env-gated).

### MyOS run result

⚠️ **Structure proven**. Runtime subscription revoke/re-init behavior remains
env-gated for confirmation.

---

## Story 22 — Document + document-type link coverage

### What the story is about

Extends link coverage beyond session links by asserting:

- `MyOS/Document Link`,
- `MyOS/Document Type Link`,
- alongside `MyOS/MyOS Session Link`.

### DSL docs used

- linked session seed (`buildStopResumeControlDocument`),
- link-coverage doc (`buildLinkCoverageDocument`) with:
  - `documentAnchors(...)`,
  - explicit `documentLinks({...})` map containing all three link variants.

### How the test works

1. bootstrap linked session seed,
2. bootstrap link coverage doc,
3. retrieve and assert all link variant contracts are present.

### MyOS run result

✅ **Structure path works** (contract roundtrip proven).

---

## Story 23 — Timeline permissions inspection roundtrip

### What the story is about

Adds API-level coverage for timeline permission management on a document channel.

### DSL docs used

- `buildStopResumeControlDocument` for a stable `ownerChannel` timeline source.

### How the test works

1. bootstrap doc and extract `ownerChannel` timeline id,
2. optional env-gated API flow:
   - create permission,
   - list permissions,
   - retrieve permission,
   - delete permission.

### MyOS run result

⚠️ **Structure + extraction proven**. Full permission CRUD run is env-gated and
requires accountId-backed configuration.

---

## Story 24 — Stop / resume processing roundtrip

### What the story is about

Verifies document processing lifecycle controls:

- stop processing,
- resume processing.

### DSL docs used

- `buildStopResumeControlDocument` with a simple `tick` operation.

### How the test works

1. bootstrap doc and assert operation contracts,
2. optional env-gated behavior path:
   - run `tick`,
   - stop processing and wait for paused status,
   - resume processing and wait for active status.

### MyOS run result

⚠️ **Structure proven**. Full stop/resume behavior path currently runs behind
story gate.

---

## Story 25 — MyOS events observability

### What the story is about

Adds direct visibility checks through `myOsEvents.list`, with debug-state
capture assistance when event visibility diverges.

### DSL docs used

- `buildStopResumeControlDocument` (document lifecycle trigger source).

### How the test works

1. bootstrap doc,
2. optional env-gated behavior path:
   - stop + resume to trigger lifecycle events,
   - list MyOS events and inspect lifecycle event types,
   - fallback to `captureDebugState(sessionId)` evidence snapshot.

### MyOS run result

⚠️ **Story wired and observable helpers integrated**; behavioral event
observability remains env-gated pending dedicated live verification.

---

## Story 26 — Worker agency optional lifecycle

### What the story is about

Optional coverage for worker-agency marker + permission lifecycle wiring.

### DSL docs used

- source control doc (`buildStopResumeControlDocument`),
- worker agency agent (`buildWorkerAgencyLifecycleDocument`) with:
  - `workerAgency()`,
  - `myOsAdmin('myOsAdminChannel')`,
  - worker agency grant/revoke operations,
  - correlated response matchers updating counters.

### How the test works

1. bootstrap source + worker agent docs,
2. assert worker agency marker and operations are present,
3. optional env-gated behavior path runs grant/revoke operations and waits for
   counter updates.

### MyOS run result

⚠️ **Structure proven**. Worker-agency behavior remains optional and env-gated
pending runtime/type stability confirmation.

---

## Final picture: what worked vs what failed

### Fully validated on live MyOS (current environment)

- Stories: **0, 1, 3, 4, 5, 9, 11, 12, 17, 18**

### Partially validated (core path works, deeper orchestration gated)

- Stories: **6, 7, 8, 19, 20, 21, 23, 24, 25, 26**

### Blocked/gated by runtime constraints

- Stories: **2, 13, 14, 15, 16**

### Structure-proven mapping coverage

- Story: **22**

---

## How to run and interpret

### Default run (safe, blocker-aware)

The stories are runnable as written with gates active for known runtime blockers.

### Force running gated stories

To explicitly attempt blocked subflows while investigating runtime fixes, set:

- `MYOS_ENABLE_STORY_6=true`
- `MYOS_ENABLE_STORY_7=true`
- `MYOS_ENABLE_STORY_8=true`
- `MYOS_ENABLE_STORY_14=true`
- `MYOS_ENABLE_STORY_15=true`
- `MYOS_ENABLE_STORY_19=true`
- `MYOS_ENABLE_STORY_20=true`
- `MYOS_ENABLE_STORY_21=true`
- `MYOS_ENABLE_STORY_23=true`
- `MYOS_ENABLE_STORY_24=true`
- `MYOS_ENABLE_STORY_25=true`
- `MYOS_ENABLE_STORY_26=true`

Then rerun targeted story files.

---

## Related references

- Story matrix: `libs/myos-js/docs/live-story-matrix.md`
- Mapping notes: `libs/myos-js/docs/live-story-js-mappings.md`
- Live test guide: `libs/myos-js/docs/myos-js-live-testing.md`
- Runtime blockers/issues: `libs/myos-js/issues.md`
- DSL helper changes rationale: `docs/dsl-change-propositions.md`
