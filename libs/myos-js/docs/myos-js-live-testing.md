# myos-js live testing

## Environment contract

Required for core live tests:

- `MYOS_API_KEY`
- `MYOS_BOOTSTRAP_EMAIL`

Required for accountId-driven live bootstrap flows:

- `MYOS_ACCOUNT_ID`

Optional:

- `MYOS_BASE_URL` (default: `https://api.dev.myos.blue`)
- `MYOS_ACCOUNT_ID` (used as fallback bootstrap binding when email is unavailable)
- `MYOS_SYSTEM_API_KEY` (maintenance live tests)
- `MYOS_WEBHOOK_TEST_URL` (webhook live tests)
- `MYOS_DASHBOARD_URL` (debug metadata only; never used as API base)

If required vars are missing, live tests are skipped with explicit reasons.

## Run live suites

```bash
NX_DAEMON=false npx nx test myos-js --skip-nx-cache
```

Live files:

- `src/live/myos.live.spec.ts`
- `src/live/recruitment-classifier.live.spec.ts`
- `src/live/myos.gated.live.spec.ts`
- `src/live/stories/basic-and-events.live.spec.ts`
- `src/live/stories/session-interaction.live.spec.ts`
- `src/live/stories/links-and-participants.live.spec.ts`
- `src/live/stories/bootstrap-and-payments.live.spec.ts`
- `src/live/stories/advanced-control.live.spec.ts`

## Live scenarios covered

Core suite:

1. Auth + current user smoke (`user.get`, `users.getByIds`)
2. Counter document bootstrap via `DocBuilder` + `runOperation('increment')`
3. Same-email multi-channel bootstrap timeline separation
4. Timeline create/retrieve/entry/list flow
5. `/me/documents` visibility after bootstrap + events list probe
6. Stop/resume document lifecycle
7. Recruitment-classifier bootstrap chain:
   - bootstrap llm-provider + recruitment-source dependency documents
   - bootstrap classifier DSL document with dependency session IDs
   - resolve target session via bootstrap events -> documentId search -> retrieve
   - assert provider subscription readiness and persisted classification output

Story suite:

1. Basic docs + composite channels + direct change + named/doc/channel triggered event reactions
2. Session interaction orchestration:
   - permission request,
   - auto-granted response handling,
   - subscription initiated/epoch updates,
   - remote call-operation mirror behavior
3. Filtered subscriptions with multiple subscription IDs and matcher payloads
4. Anchors + links API visibility and linked-doc permission watcher
5. Participants orchestration add/remove flows with dynamic contract/group updates
6. Parent bootstrap of child DSL document and child operation execution
7. PayNote shipment escrow lock/unlock/request flows
8. Payment request emission variants (ACH, credit-line, ledger)
9. Triggered matcher correlation flow
10. Propose/accept/reject change mapping coverage
11. Permission revoke + subscription re-init lifecycle coverage
12. Document/document-type link mapping coverage
13. Timeline permissions inspection roundtrip
14. Stop/resume processing roundtrip
15. MyOS events observability probe
16. Optional worker agency lifecycle coverage

Coverage matrix:

- `docs/live-story-matrix.md`
- `docs/live-story-js-mappings.md`
- `docs/live-story-complete-walkthrough.md`

Runtime-gated stories:

- Some live stories are intentionally gated due current runtime behavior.
- See `libs/myos-js/issues.md` for exact blockers.
- To force-run a gated story while validating a runtime fix, set:
  - `MYOS_ENABLE_STORY_14=true`
  - `MYOS_ENABLE_STORY_15=true`
  - `MYOS_ENABLE_STORY_19=true`
  - `MYOS_ENABLE_STORY_20=true`
  - `MYOS_ENABLE_STORY_21=true`
  - `MYOS_ENABLE_STORY_26=true`

Gated suite:

- Maintenance endpoints (`MYOS_SYSTEM_API_KEY` required)
- Webhook create/list/update/delete flow (`MYOS_WEBHOOK_TEST_URL` required)

## Security notes

- Never print API keys.
- Never check in `.env.local` values.
- Use `.env.local.example` as variable-name-only template.
