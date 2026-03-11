# Version A mainline decisions log

Use this file to record:
- accepted runtime adaptations
- unsupported/deferred items
- decisions not to port certain Version B features wholesale
- decisions from the latest Version B commit audit

## Required decision entries
For each of these commits, add a short section:
- `de0dd4859075be3d0d3491f1d79898baa73fac55`
- `6d5c4644c3aa7036d31f124296487ebd3c69283e`
- `74a80ac33a8788319d81e811c80112bbe6d5167e`
- `2ee6a8ce306ba820693455811e5e2dfb83eee13a`

For each section state:
- what was inspected
- what was ported
- what was intentionally not ported
- why

## Stage 1 runtime alignment

### Subscribe to Session Requested
- Decision: low-level `steps.myOs().subscribeToSession(...)` and
  `subscribeToSessionWithMatchers(...)` no longer materialize `onBehalfOf`.
- Why: the public runtime shape is `targetSessionId + subscription`, so keeping
  `onBehalfOf` at that level was a Version A drift.

### grantSessionSubscriptionOnResult
- Decision: treat it as deferred/unsupported and stop materializing it.
- Why: silently emitting an unsupported runtime field is worse than requiring
  an explicit follow-up subscribe step. `access(...).subscribeToCreatedSessions(true)`
  now fails fast.

### Common/Named Event
- Decision: adopt the real public `Common/Named Event` type and remove the
  `Conversation/Event` fallback for named-event helpers.
- Why: Stage 1 requires runtime-correct named events with root-level fields,
  and the repo now targets `@blue-repository/types` `0.21.x`.

### MyOsPermissions
- Decision: `write(...)` now serializes to `share`, and explicit empty
  `singleOps()` calls are preserved.
- Why: this keeps the authoring surface close to demo-app while aligning the
  emitted permission payload to the runtime-confirmed shape.

### Start Worker Session Requested
- Decision: emit `onBehalfOf`, `document`, `channelBindings`,
  `initialMessages`, and `capabilities` at the root and reject legacy
  `bootstrapAssignee` worker-session options.
- Why: the old `agentChannelKey` + nested `options` envelope did not match the
  final runtime contract.

### Linked-doc helper semantics
- Decision: keep `onLinkedDocGranted(...)` as the concrete single linked-doc
  notification, but route `onLinkedDocRejected(...)` and
  `onLinkedDocRevoked(...)` through linked-documents lifecycle events.
- Why: this separates per-linked-document grant notifications from the linked
  permission request lifecycle without removing the existing convenience names.

### PayNote runtime semantics
- Decision: keep the existing participant-aware defaults and deferred runtime
  guards unchanged for Stage 1.
- Why: the current PayNote flows already matched the runtime-supported paths,
  so changing them here would add churn without improving correctness.
