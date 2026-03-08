# Mapping Differences vs Java SDK DSL Audit Reference

This document records intentional or currently unresolved differences between this TypeScript port and the Java mapping audit.

## PayNote default participant channels

- **Java audit reference**:
  ```yaml
  contracts:
    payerChannel:
      type: Core/Channel
    payeeChannel:
      type: Core/Channel
    guarantorChannel:
      type: Core/Channel
  ```
- **TypeScript port**:
  ```yaml
  contracts:
    payerChannel:
      type: Conversation/Timeline Channel
      timelineId: payer-timeline
    payeeChannel:
      type: Conversation/Timeline Channel
      timelineId: payee-timeline
    guarantorChannel:
      type: Conversation/Timeline Channel
      timelineId: guarantor-timeline
  ```
- **Reason**:
  - Runtime execution tests against `@blue-labs/document-processor` failed with `Core/Channel`.
  - Timeline channel variants are executable with current registry support.

## Named-event helper emitted type

- **Java audit reference**:
  - `type: Common/Named Event`
- **TypeScript port**:
  - `type: Conversation/Event` + `name` + optional `payload`.
  - `DocBuilder.onNamedEvent(...)` also matches `Conversation/Event` + `name`.
- **Reason**:
  - `Common/Named Event` alias is not present in the currently installed repository package.
  - Runtime behavior is intentionally pinned to processor-compatible event aliases.

## Backward-payment requested type availability

- **Java audit reference**:
  - `type: PayNote/Backward Payment Requested` is available and executable.
- **TypeScript port**:
  - SDK helper now fails fast before build with explicit runtime message when this alias is unavailable in installed repository types.
- **Reason**:
  - Alias availability differs across `@blue-repository/types` versions; current workspace version does not expose this type mapping.

## Reserve/release lock/unlock type availability

- **Java audit reference**:
  - `type: PayNote/Reserve Lock Requested`
  - `type: PayNote/Reserve Unlock Requested`
  - `type: PayNote/Reservation Release Lock Requested`
  - `type: PayNote/Reservation Release Unlock Requested`
- **TypeScript port**:
  - API surface keeps reserve/release lock + unlock helper variants.
  - Unsupported aliases are guarded with explicit fail-fast errors at helper call-time.
- **Reason**:
  - Alias availability differs across `@blue-repository/types` versions in this workspace.

