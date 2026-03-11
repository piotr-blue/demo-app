# myos-js issues tracker

## Known limitations and follow-ups

1. **OpenAPI source management**
   - Status: in progress
   - Notes: schema is being captured into repository for deterministic type generation.

2. **Live test environment variability**
   - Status: expected
   - Notes: live tests are opt-in and network/backend state dependent; failures should be debugged with clear runtime evidence.

3. **Maintenance endpoint gating**
   - Status: intentional
   - Notes: maintenance operations require system credentials and are skipped without `MYOS_SYSTEM_API_KEY`.

4. **Webhook live tests callback dependency**
   - Status: intentional
   - Notes: webhook live tests require `MYOS_WEBHOOK_TEST_URL` and remain mocked-only otherwise.

5. **Story 16 blocker: Backward payment type alias unavailable in runtime package**
   - Status: blocked (live story gated)
   - Story: `story-16 backward payment / voucher request` in `src/live/stories/bootstrap-and-payments.live.spec.ts`
   - Repro DSL snippet:
     ```ts
     DocBuilder.doc()
       .channel('guarantorChannel', { type: 'MyOS/MyOS Timeline Channel' })
       .operation('issueVoucher', 'guarantorChannel', '...', (steps) =>
         steps.requestBackwardPayment((payload) =>
           payload
             .processor('guarantorChannel')
             .from('payeeChannel')
             .to('payerChannel')
             .attachPayNote(childPayNote),
         ),
       )
       .buildDocument();
     ```
   - Expected:
     - runtime supports event type alias `PayNote/Backward Payment Requested`
     - emitted event appears in feed/epoch after operation.
   - Actual blocker:
     - current runtime type registry does not expose alias
       `PayNote/Backward Payment Requested` (checked via
       `isRepositoryTypeAliasAvailable(...)` and existing `sdk-dsl` runtime guard).
   - Action:
     - keep story runtime-gated; enable once alias becomes available in installed
       `@blue-repository/types` package.

6. **Story 2 directChange runtime path**
   - Status: implemented
   - Story: `story-2 direct change operation applies incoming changeset` in
     `src/live/stories/basic-and-events.live.spec.ts`
   - Repro:
     1. Bootstrap DSL document built with:
        `DocBuilder.doc().field('/text','Initial').directChange('changeDocument','ownerChannel',...)`
     2. Run:
        ```json
        {
          "type": "Conversation/Change Request",
          "summary": "Update text",
          "changeset": [
            {
              "type": "Core/Json Patch Entry",
              "op": "replace",
              "path": "/text",
              "val": "Updated text"
            }
          ]
        }
        ```
        against operation `changeDocument`.
   - Runtime-confirmed behavior:
     - request applies successfully when the top-level change request includes
       `summary`
     - patch entries should carry explicit `type: "Core/Json Patch Entry"`
   - Notes:
     - the earlier blocker came from an underspecified request payload, not from
       the `directChange(...)` contract itself
   - Action:
     - keep Story 2 and similar change-request stories aligned to that runtime
       payload shape

7. **Story 6 mirror orchestration runtime path**
   - Status: implemented
   - Story: `story-6 subscribe + remote operation + mirror cross-document flow`
   - Runtime-confirmed behavior:
     - permission grant correlates by `inResponseTo.requestId`,
     - subscription initiation is consumed as a direct
       `MyOS/Subscription to Session Initiated` event,
     - epoch updates arrive through `MyOS/Subscription Update`,
     - mirror agent drives remote `increment(2)` and stores the reflected
       counter state.
   - Action:
     - keep Story 6 ungated; do not regress grant correlation or epoch-update
       handling back to stale direct-event assumptions.

8. **Story 7 initiated snapshot watcher**
   - Status: implemented
   - Story: `story-7 subscription-initiated snapshot reaction stores initial profile`
   - Runtime-confirmed behavior:
     - permission grant correlates by `inResponseTo.requestId`,
     - subscription initiation stores the current profile snapshot,
     - epoch updates flow through `MyOS/Subscription Update`,
     - watcher persists `/snapshot/*` and `/lastEpoch`.
   - Action:
     - keep Story 7 ungated; preserve the initiated-snapshot and
       subscription-update handlers.

9. **Story 8 filtered subscription updates**
   - Status: implemented
   - Story: `story-8 filtered subscriptions track request and event patterns`
   - Runtime-confirmed behavior:
     - permission grant correlates by `inResponseTo.requestId`,
     - readiness is driven by direct `MyOS/Subscription to Session Initiated`,
     - filtered updates arrive through `MyOS/Subscription Update`,
     - topic extraction must read the nested update payload safely.
   - Action:
     - keep Story 8 ungated; do not regress filtered-subscription consumers
       back to direct-event matching.

10. **Story 10 linked-doc watcher incremental grants**
    - Status: implemented
    - Story: `story-10 linked-doc permission watcher sees grants for linked sessions`
    - Runtime-confirmed behavior:
      - initial linked-doc permission grants are visible through the watcher's
        latest epoch `emitted` snapshot,
      - later linked document bootstrap produces a new correlated emitted grant
        event after the previous epoch boundary,
      - watcher state advances via `/grantSeenCount` and
        `/lastGrantedTargetSessionId`.
    - Action:
      - keep Story 10 on emitted-event polling; do not regress it back to
        feed-entry counting for grant detection.

11. **Story 13 direct child bootstrap flow**
    - Status: implemented
    - Story: `story-13 parent document bootstraps child voucher document`
    - Required runtime shape:
      - bootstrap request includes `bootstrapAssignee`, `onBehalfOf`, and
        correlated `requestId`
      - parent workflow matches `MyOS/Target Document Session Started` via
        `inResponseTo.requestId`
      - child session id is read from `event.initiatorSessionIds[0]`
    - Action:
      - keep this shape locked in docs and regression tests; do not fall back to
        `event.targetSessionId` for this flow

12. **Story 14 blocker: paynote emitted lock/unlock/capture events not visible through current live surfaces**
    - Status: blocked (live story gated)
    - Story: `story-14 paynote shipment escrow lock/unlock/request flow`
    - Observed:
      - event visibility checks against feed/epoch retrieval are inconclusive for expected paynote emissions.
    - Action:
      - keep story gated unless `MYOS_ENABLE_STORY_14=true`.

13. **Story 15 blocker: payment trigger events not surfaced for ACH/credit-line/ledger assertions**
    - Status: blocked (live story gated)
    - Story: `story-15 payment request emission supports ACH, credit line, and ledger rails`
    - Observed:
      - operation requests are present,
      - expected emitted payment event payloads are not surfaced in feed/epoch APIs used by tests.
    - Action:
      - keep story gated unless `MYOS_ENABLE_STORY_15=true`.

14. **Story 19 blocker: built-in change workflows still fail on live runtime path**
    - Status: blocked
    - Story: `story-19 propose/accept/reject change flow mapping coverage` in
      `src/live/stories/advanced-control.live.spec.ts`
    - Current state:
      - structural mapping assertions are active by default,
      - live execution still fails when the document uses the repository-backed
        `Conversation/Propose Change Workflow` path.
    - Action:
      - debug the runtime behavior of the built-in change workflows without
        replacing them with custom document-local workflows.

15. **Story 20 blocker: revoke flow is modeled from the wrong document**
    - Status: blocked
    - Story: `story-20 + story-21 permission revoke and subscription re-init flows`
      in `src/live/stories/advanced-control.live.spec.ts`
    - Current state:
      - the grant side works when the request asks for the real target
        operation (`tick`),
      - the revoke side assumes an arbitrary agent document can send revoke
        requests directly to MyOS Admin.
    - Action:
      - rework the story around the actual grant-document-centric revoke model:
        revoke should execute via the permission-grant document's `revoke`
        operation, not via a direct revoke request emitted from another
        document.

16. **Story 21 blocker: depends on the unresolved revoke model from Story 20**
    - Status: blocked
    - Story: `story-20 + story-21 permission revoke and subscription re-init flows`
      in `src/live/stories/advanced-control.live.spec.ts`
    - Current state:
      - subscription initiation counter wiring is present,
      - the behavioral re-init assertion depends on Story 20 completing revoke
        through the correct grant-document path.
    - Action:
      - revisit after Story 20 is rewritten around revoke on the permission
        grant document.

17. **Story 23 timeline permissions roundtrip**
    - Status: implemented
    - Story: `story-23 timeline permissions inspection roundtrip` in
      `src/live/stories/advanced-control.live.spec.ts`
    - Runtime-confirmed behavior:
      - document bootstrap and channel timeline-id extraction work,
      - `timelines.permissions.create/list/retrieve/delete` complete on an
        accountId-backed run.
    - Action:
      - keep the story enabled by default; only the `MYOS_ACCOUNT_ID`
        precondition remains.

18. **Story 24 stop/resume processing roundtrip**
    - Status: implemented
    - Story: `story-24 stop and resume processing roundtrip` in
      `src/live/stories/advanced-control.live.spec.ts`
    - Runtime-confirmed behavior:
      - `tick` executes before pause,
      - `documents.stop` drives `processingStatus=PAUSED`,
      - `documents.resume` clears the paused state again.
    - Action:
      - keep the story enabled by default.

19. **Story 25 MyOS events lifecycle observability**
    - Status: implemented
    - Story: `story-25 myos-events observability for document lifecycle` in
      `src/live/stories/advanced-control.live.spec.ts`
    - Runtime-confirmed behavior:
      - stop/resume lifecycle events become visible through `myOsEvents.list`,
      - the story keeps a debug-state fallback for future regressions.
    - Action:
      - keep the story enabled by default.

20. **Story 26 blocker: worker-agency revoke assumes the wrong runtime model**
    - Status: blocked
    - Story: `story-26 worker agency optional lifecycle coverage` in
      `src/live/stories/advanced-control.live.spec.ts`
    - Current state:
      - worker-agency marker and grant/revoke operation mappings are asserted
        structurally,
      - the current behavior path assumes revoke can be requested directly from
        the controller document.
    - Action:
      - rework the story around revoke executed on the worker-agency grant
        document, matching the current MyOS Admin revoke model.

21. **Story 9 divisible-by-3 watcher flow**
    - Status: implemented
    - Story: `story-9 counter watcher tracks divisible-by-3 epochs` in
      `src/live/stories/session-interaction.live.spec.ts`
    - Runtime-confirmed behavior:
      - access-builder grant correlation uses `inResponseTo.requestId` for
        MyOS responses,
      - subscription readiness is driven by direct
        `MyOS/Subscription to Session Initiated`,
      - divisible-by-3 watcher consumes epoch changes from
        `MyOS/Subscription Update`,
      - watcher updates `/lastKnownCounter`, `/divisibleBy3Count`, and
        `/lastDivisibleBy3Counter`.
    - Action:
      - keep Story 9 ungated; preserve the subscription-update envelope shape
        in docs and tests.
