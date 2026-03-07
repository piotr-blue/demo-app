# JS live story mapping reference

This document captures the practical JS mappings used by the live story suite.
It is intentionally runtime-first and reflects the combinations exercised in
`libs/myos-js/src/live/stories`.

## 1) Basic operation and workflow mappings used live

### Counter operation

```ts
DocBuilder.doc()
  .field('/counter', 0)
  .operation('increment', 'ownerChannel', BasicBlueTypes.Integer, '...', (steps) =>
    steps.replaceExpression('IncrementCounter', '/counter', "document('/counter') + event.message.request"),
  )
```

Maps to:

- `Conversation/Operation` contract (`increment`)
- `Conversation/Sequential Workflow Operation` contract (`incrementImpl`)
- `Conversation/Update Document` step with expression changeset.

### Direct change mapping

```ts
DocBuilder.doc().directChange('changeDocument', 'ownerChannel', '...')
```

Maps to:

- `changeDocument` (`Conversation/Change Operation`)
- `changeDocumentImpl` (`Conversation/Change Workflow`)
- `contractsPolicy` (`Conversation/Contracts Change Policy`).

## 2) Event/listener mappings used live

### Named event listener

`onNamedEvent(...)` maps to matcher:

```yaml
event:
  type: Conversation/Event
  name: <eventName>
```

### canEmit operation naming

`canEmit('ownerChannel')` generates operation key:

- `ownerUpdate` (JS runtime convention),
- not Java reference `ownerEmit`.

### Channel event listener

Live channel-ingestion story listens on:

```yaml
event.type: Conversation/Timeline Entry
channel: signalChannel
```

and consumes `event.message.*` payload from real timeline entries.

## 3) Session interaction mappings used live

### Permission and subscription

`steps.myOs().requestSingleDocPermission(...)` emits:

- `MyOS/Single Document Permission Grant Requested`

`steps.myOs().subscribeToSession(...)` emits:

- `MyOS/Subscribe to Session Requested`
- `subscription.id`
- `subscription.events` type list.

### Filtered subscriptions (new helper)

`steps.myOs().subscribeToSessionWithMatchers(...)` emits:

- `MyOS/Subscribe to Session Requested`
- `subscription.events` preserving matcher objects (for example `type + topic`).

## 4) Links + participants mappings used live

### Anchors and links

`documentAnchors([...])` + `sessionLink(...)` map to:

- `MyOS/Document Anchors`
- `MyOS/Document Links`.

### Participants orchestration marker

`participantsOrchestration()` maps to:

- `MyOS/MyOS Participants Orchestration` marker contract.

Participant add/remove flows are emitted via trigger-event steps:

- `MyOS/Adding Participant Requested`
- `MyOS/Removing Participant Requested`.

## 5) PayNote and payment mappings used live

### PayNote capture flows

`capture().lockOnInit()` / `unlockOnOperation(...)` / `requestOnOperation(...)`
emit:

- `PayNote/Card Transaction Capture Lock Requested`
- `PayNote/Card Transaction Capture Unlock Requested`
- `PayNote/Capture Funds Requested`.

### Generic payment requests

`steps.triggerPayment(...)` emits requested payment event type and rail payload
fields under a single trigger-event step, including tested variants:

- `viaAch`
- `viaCreditLine`
- `viaLedger`.

## 6) Runtime-gated mapping (blocked)

Backward payment flow (`steps.requestBackwardPayment`) depends on repository type
alias availability for:

- `PayNote/Backward Payment Requested`

In the current workspace runtime package this alias is unavailable, so live story
execution is gated and tracked in `libs/myos-js/issues.md`.

Additional live-runtime gated areas tracked in `libs/myos-js/issues.md`:

- deep session-interaction watcher updates (Stories 6-8),
- linked-doc incremental grant watcher updates (Story 10),
- parent-driven child bootstrap request validation (Story 13),
- paynote/payment emitted-event observability via live APIs (Stories 14-15).

