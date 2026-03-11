# JS live story mapping reference (MyOS baseline)

This document is the practical mapping baseline for the MyOS live story track in:

- `libs/myos-js/src/live/stories/*`

It is intentionally runtime-first and reflects what we want to converge to in
live MyOS integration stories. AI mappings are out of scope for this track.

## 1) Participant channels baseline for live MyOS stories

For live stories, externally bound participant channels are modeled as:

```yaml
contracts:
  ownerChannel:
    type: MyOS/MyOS Timeline Channel
```

The same baseline applies to participant channels such as:

- `aliceChannel`, `bobChannel`
- `payerChannel`, `payeeChannel`, `guarantorChannel`
- `shipmentCompanyChannel`
- any additional externally bound participant channel.

Notes:

- The historical generic `Core/Channel` notion remains a conceptual abstraction.
- For live MyOS stories, `MyOS/MyOS Timeline Channel` is the practical mapping.

## 2) myOsAdmin(...) canonical mapping

`myOsAdmin('myOsAdminChannel')` should map to the standard admin-update pattern:

```yaml
contracts:
  myOsAdminChannel:
    type: MyOS/MyOS Timeline Channel

  myOsAdminUpdate:
    type: Conversation/Operation
    channel: myOsAdminChannel
    request:
      type: List

  myOsAdminUpdateImpl:
    type: Conversation/Sequential Workflow Operation
    operation: myOsAdminUpdate
    steps:
      - name: EmitAdminEvents
        type: Conversation/JavaScript Code
        code: |
          return { events: event.message.request };
```

Canonical corrections:

- operation key is `...Update` (not `...Emit` for this baseline),
- event pass-through uses `event.message.request` (not raw `event`).

## 3) canEmit(...) naming convention

For live stories:

```ts
canEmit('ownerChannel')
```

maps to:

```yaml
contracts:
  ownerUpdate:
    type: Conversation/Operation
    channel: ownerChannel
    request:
      type: List

  ownerUpdateImpl:
    type: Conversation/Sequential Workflow Operation
    operation: ownerUpdate
    steps:
      - name: EmitEvents
        type: Conversation/JavaScript Code
        code: |
          return { events: event.message.request };
```

Examples:

- `canEmit('aliceChannel')` -> `aliceUpdate`
- `canEmit('bobChannel', ...)` -> `bobUpdate` with typed list request items.

## 4) directChange(...) mapping

`directChange(...)` maps to contracts-based change lifecycle:

```yaml
contracts:
  contractsPolicy:
    type: Conversation/Contracts Change Policy
    requireSectionChanges: true # when configured

  changeDocument:
    type: Conversation/Change Operation
    channel: ownerChannel

  changeDocumentImpl:
    type: Conversation/Change Workflow
    operation: changeDocument
```

Important:

- `contractsPolicy` belongs under `/contracts`.
- This baseline does not use a `/policies/contractsChangePolicy` path.
- For the current MyOS runtime path, live callers should send
  `Conversation/Change Request` with a top-level `summary` and explicit
  `Core/Json Patch Entry`-typed changeset items.

## 5) Capability/helper mappings used in live stories

### 5.1 Session interaction marker

```yaml
contracts:
  sessionInteraction:
    type: MyOS/MyOS Session Interaction
```

### 5.2 Participants orchestration marker

```yaml
contracts:
  participantsOrchestration:
    type: MyOS/MyOS Participants Orchestration
```

### 5.3 Anchors and links

```yaml
contracts:
  anchors:
    type: MyOS/Document Anchors
    anchorA:
      type: MyOS/Document Anchor

  links:
    type: MyOS/Document Links
    link1:
      type: MyOS/MyOS Session Link
      anchor: anchorA
      sessionId: <sessionId>
```

Sister link forms in this baseline:

- `documentLink(...)` -> `MyOS/Document Link`
- `documentTypeLink(...)` -> `MyOS/Document Type Link`

## 6) Participant add/remove payload mapping

Canonical add payload:

```yaml
event:
  type: MyOS/Adding Participant Requested
  channelName: reviewerChannel
  participantBinding:
    email: someone@example.com
```

Canonical remove payload:

```yaml
event:
  type: MyOS/Removing Participant Requested
  channelName: reviewerChannel
```

`channelKey`/flat-email legacy payloads are not the preferred mapping baseline.

## 7) Subscription request mappings

### 7.1 subscribeToSession(...)

```yaml
event:
  type: MyOS/Subscribe to Session Requested
  targetSessionId: <targetSessionId>
  subscription:
    id: <subscriptionId>
    events: []
```

### 7.2 subscribeToSessionWithMatchers(...)

```yaml
event:
  type: MyOS/Subscribe to Session Requested
  targetSessionId: <targetSessionId>
  subscription:
    id: <subscriptionId>
    events:
      - <matcher1>
      - <matcher2>
```

This matcher-capable form is required for filtered subscription stories.

## 8) onChannelEvent(...) preferred mapping

Preferred live target:

```yaml
contracts:
  onShipmentConfirmed:
    type: Conversation/Sequential Workflow
    channel: shipmentCompanyChannel
    event:
      type: Shipping/Shipment Confirmed
```

Fallback pattern (timeline-entry + `event.message.*`) may still be used where
runtime type coverage forces it, but it is not the preferred baseline.

## 9) Child bootstrap request mapping

`steps.myOs().bootstrapDocument(...)` should align to public bootstrap body
shape:

```yaml
event:
  type: Conversation/Document Bootstrap Requested
  document: <childDoc>
  channelBindings: <bindings>
  onBehalfOf: <requester channel>
  bootstrapAssignee: <myOs admin channel>
  requestId: <correlation id, recommended for direct bootstrap flows>
  capabilities: <optional>
  initialMessages: <optional>
```

For the direct MyOS Admin requester flow used by Story 13, the parent workflow
should then match:

```yaml
event:
  type: MyOS/Target Document Session Started
  inResponseTo:
    requestId: <same correlation id>
```

and store the child session id from:

```yaml
${event.initiatorSessionIds[0]}
```

## 10) Payment mapping updates

### 10.1 triggerPayment(...)

Canonical intent is to emit an actual payment request type (not a stand-in
reserve event alias):

```yaml
event:
  type: <payment-request-type>
  processor: ...
  from: ...
  to: ...
  currency: ...
  amountMinor: ...
```

### 10.2 requestBackwardPayment(...)

Canonical mapping remains:

```yaml
event:
  type: PayNote/Backward Payment Requested
  processor: ...
  from: ...
  to: ...
  amountMinor: ...
  attachedPayNote: ...
```

If runtime type availability blocks execution, keep story gated without
rewriting canonical mapping.

## 11) PayNote live baseline notes

- Additional participant channels should be explicit `MyOS/MyOS Timeline Channel`.
- `capture().lockOnInit()`, `unlockOnOperation(...)`, and
  `requestOnOperation(...)` remain the primary live capture-path target.
- Reserve/release mappings remain part of DSL mapping surface even when live
  observability is currently gated.

## 12) Additional advanced-control mappings

### 12.1 Propose/accept/reject change lifecycle

Canonical contracts:

```yaml
contracts:
  contractsPolicy:
    type: Conversation/Contracts Change Policy

  proposeChange:
    type: Conversation/Propose Change Operation
  proposeChangeImpl:
    type: Conversation/Propose Change Workflow

  acceptChange:
    type: Conversation/Accept Change Operation
  acceptChangeImpl:
    type: Conversation/Accept Change Workflow

  rejectChange:
    type: Conversation/Reject Change Operation
  rejectChangeImpl:
    type: Conversation/Reject Change Workflow
```

### 12.2 Timeline permissions + processing controls + MyOS events

Live story track also covers API-level roundtrips that complement DSL mapping:

- `timelines.permissions.create/list/retrieve/delete`
- `documents.stop` + `documents.resume`
- `myOsEvents.list` lifecycle observability

These are runtime API mappings rather than contract-generation mappings.

## 13) Runtime-gated areas

Known runtime-gated stories remain tracked in:

- `libs/myos-js/issues.md`

Current gated areas include:

- deeper session-interaction orchestration (Stories 6-8),
- linked-doc incremental grant updates (Story 10),
- paynote/payment emitted-event observability (Stories 14-15),
- backward payment alias availability (Story 16),
- advanced control behavior verification (Stories 19-21, 23-25),
- optional worker-agency behavior verification (Story 26).
