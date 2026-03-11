# Runtime-Correct Mapping Notes vs Java Reference

This file captures the small set of runtime-confirmed mapping differences that
still matter after the Version-A mainline uplift. Resolved pre-mainline drifts
are intentionally not repeated here.

## Runtime-confirmed differences

### PayNote participant channels

- Java-oriented examples often show generic channel contracts
- the TypeScript SDK emits timeline-based participant channels by default:
  `Conversation/Timeline Channel` with deterministic timeline ids
- reason: this is the runtime-confirmed executable path for the current public
  processor/runtime

### `onChannelEvent(...)` on timeline-like channels

- direct-event channels use direct `event` matchers
- timeline-like channels match message types under `event.message`
- explicit timeline-entry event types remain direct, because the outer event is
  already the timeline-entry envelope
- reason: timeline workflows react to the entry payload, not to a synthetic
  flattened event

### `Conversation/Document Bootstrap Requested`

- bootstrap helpers can now emit `onBehalfOf` alongside `document`,
  `channelBindings`, and optional `bootstrapAssignee`
- reason: the real MyOS Admin direct-bootstrap path validates the requester
  channel from `onBehalfOf`; this is a runtime field on the event type, not a
  subscription-helper concern

### Stage-6 operation-triggered PayNote branches

- operation-triggered request/unlock/full-request branches do not declare a
  `request` schema on the `Conversation/Operation` contract
- partial-request branches also omit synthetic `Text` schemas even when the
  workflow reads `event.message.request`
- reason: the runtime-confirmed path is the resolved-content MyOS-style
  operation request entry, where payload may be absent or arbitrary without the
  SDK forcing fake scalar schemas

## Deferred / guarded differences

### Backward payment helper

- Java reference may expose a fuller backward-payment path
- the TypeScript SDK keeps `requestBackwardPayment(...)` deferred/runtime-guarded

### Lock/unlock alias availability

- Java reference includes reserve/release lock-unlock aliases
- the TypeScript SDK exposes the helpers but fails fast when the installed
  runtime type package does not provide the required public aliases

## Resolved items not to treat as current diffs

- named-event fallback/wrapper assumptions
- old interaction-builder drift notes from the pre-mainline state
- stale coverage-count based status claims
