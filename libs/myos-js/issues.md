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

14. **Story 19 gating: propose/accept/reject lifecycle behavior not yet baseline-verified**
    - Status: gated (verification pending)
    - Story: `story-19 propose/accept/reject change flow mapping coverage` in
      `src/live/stories/advanced-control.live.spec.ts`
    - Current state:
      - structural mapping assertions are active by default,
      - behavioral lifecycle assertions are behind `MYOS_ENABLE_STORY_19=true`.
    - Action:
      - capture live request/response event shapes for propose/accept/reject and
        remove gate after behavior is proven.

15. **Story 20 gating: full single+linked permission revoke lifecycle pending runtime verification**
    - Status: gated (verification pending)
    - Story: `story-20 + story-21 permission revoke and subscription re-init flows`
      in `src/live/stories/advanced-control.live.spec.ts`
    - Current state:
      - agent DSL and correlated response-matchers are asserted structurally,
      - end-to-end permission grant/revoke counters are behind
        `MYOS_ENABLE_STORY_20=true`.
    - Action:
      - capture runtime event correlation payloads for revoke responses and
        remove gate once counter assertions are stable.

16. **Story 21 gating: subscription re-init behavior pending runtime verification**
    - Status: gated (verification pending)
    - Story: `story-20 + story-21 permission revoke and subscription re-init flows`
      in `src/live/stories/advanced-control.live.spec.ts`
    - Current state:
      - subscription initiation counter wiring is present,
      - re-init behavior assertion is behind `MYOS_ENABLE_STORY_21=true`.
    - Action:
      - verify subscription lifecycle event shape after revoke/re-request and
        un-gate once repeat-init signal is confirmed.

17. **Story 23 gating: timeline permissions roundtrip requires accountId-backed run**
    - Status: gated (environment precondition)
    - Story: `story-23 timeline permissions inspection roundtrip` in
      `src/live/stories/advanced-control.live.spec.ts`
    - Current state:
      - timeline extraction is asserted structurally,
      - permissions create/list/retrieve/delete flow runs only when
        `MYOS_ACCOUNT_ID` is present and `MYOS_ENABLE_STORY_23=true`.
    - Action:
      - execute on accountId-configured environment and remove gate if stable.

18. **Story 24 gating: stop/resume behavior path pending dedicated live verification**
    - Status: gated (verification pending)
    - Story: `story-24 stop and resume processing roundtrip` in
      `src/live/stories/advanced-control.live.spec.ts`
    - Current state:
      - operation and lifecycle structure checks are active,
      - stop/resume behavior assertions are behind `MYOS_ENABLE_STORY_24=true`.
    - Action:
      - verify processing status transitions in live environment and remove gate.

19. **Story 25 gating: MyOS events lifecycle observability pending live verification**
    - Status: gated (verification pending)
    - Story: `story-25 myos-events observability for document lifecycle` in
      `src/live/stories/advanced-control.live.spec.ts`
    - Current state:
      - events API probe and debug-state capture path are implemented,
      - lifecycle event assertions are behind `MYOS_ENABLE_STORY_25=true`.
    - Action:
      - validate paused/resumed event visibility in `myOsEvents.list` and
        remove gate when stable.

20. **Story 26 gating: optional worker-agency lifecycle verification pending**
    - Status: gated (optional verification pending)
    - Story: `story-26 worker agency optional lifecycle coverage` in
      `src/live/stories/advanced-control.live.spec.ts`
    - Current state:
      - worker-agency marker and grant/revoke operation mappings are asserted
        structurally,
      - end-to-end worker-agency behavior assertions are behind
        `MYOS_ENABLE_STORY_26=true`.
    - Action:
      - validate worker agency grant/revoke response correlation and remove
        optional gate when runtime/type behavior is stable.

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
