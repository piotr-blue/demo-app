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

6. **Story 2 blocker: directChange request accepted but not applied at runtime**
   - Status: blocked (live assertion gated)
   - Story: `story-2 direct change operation applies incoming changeset` in
     `src/live/stories/basic-and-events.live.spec.ts`
   - Repro:
     1. Bootstrap DSL document built with:
        `DocBuilder.doc().field('/text','Initial').directChange('changeDocument','ownerChannel',...)`
     2. Run:
        ```json
        {
          "type": "Conversation/Change Request",
          "changeset": [
            { "op": "replace", "path": "/text", "val": "Updated text" }
          ]
        }
        ```
        against operation `changeDocument`.
   - Observed runtime behavior:
     - operation request appears in feed entries,
     - `/text` remains `"Initial"` and no mutation is applied.
   - Notes:
     - both payload variants (with and without explicit `type`) were tested.
   - Action:
     - keep structural assertions for generated direct-change contracts,
       but gate live state-change assertion until runtime applies change requests.

7. **Story 6 blocker: permission/subscription orchestration not reflected into mirror agent**
   - Status: blocked (live assertion gated)
   - Story: `story-6 subscribe + remote operation + mirror cross-document flow`
   - Observed:
     - permission grant side-document is created,
     - mirror agent remains with `/subscriptionState = idle`,
     - source counter never receives remote increment call.
   - Action:
     - keep source-document bootstrap+operation assertions active;
     - gate cross-session mirror assertions unless `MYOS_ENABLE_STORY_6=true`.

8. **Story 7 blocker: initiated snapshot update not applied in watcher**
   - Status: blocked (live assertion gated)
   - Story: `story-7 subscription-initiated snapshot reaction stores initial profile`
   - Observed:
     - source profile operation works,
     - watcher bootstrap succeeds,
     - watcher `/snapshot/*` fields remain unchanged (`displayName` empty, score unchanged).
   - Action:
     - keep source update assertions active;
     - gate watcher snapshot assertions unless `MYOS_ENABLE_STORY_7=true`.

9. **Story 8 blocker: filtered subscription updates not delivered to subscriber fields**
   - Status: blocked (live assertion gated)
   - Story: `story-8 filtered subscriptions track request and event patterns`
   - Observed:
     - source emits patterned events and `/emitted` increments,
     - subscriber bootstrap succeeds,
     - `/subscriptionsReady`, `/eventPatternMatchCount`, `/requestPatternMatchCount` remain unchanged.
   - Action:
     - keep source emission assertions active;
     - gate subscriber filtered-subscription assertions unless `MYOS_ENABLE_STORY_8=true`.

10. **Story 10 blocker: watcher does not receive incremental grant updates for later linked docs**
    - Status: blocked (partial)
    - Story: `story-10 linked-doc permission watcher sees grants for linked sessions`
    - Observed:
      - initial linked-doc grant events appear in watcher feed,
      - later linked document bootstrap does not increase grant-update signal in watcher.
    - Action:
      - keep initial grant feed assertions active;
      - gate incremental "later linked doc" assertion unless `MYOS_ENABLE_STORY_10=true`.

11. **Story 13 blocker: child bootstrap request rejected by runtime validation**
    - Status: blocked (live story gated)
    - Story: `story-13 parent document bootstraps child voucher document`
    - Observed API error:
      - `400` validation failure during parent bootstrap/child-bootstrap flow.
    - Action:
      - keep story gated unless `MYOS_ENABLE_STORY_13=true`.

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
