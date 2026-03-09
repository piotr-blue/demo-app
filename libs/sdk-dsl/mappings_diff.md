# Mapping Differences vs Java SDK DSL Reference

This document records current differences between TypeScript SDK output behavior and Java SDK reference, split by category.

## 1) Construct parity differences (DSL surface/semantics)

### 1.1 Interaction DSL canonical surface drift (in progress)

- **Java reference (canonical)**:
  - `access(...)`, `accessLinked(...)`, `agency(...)` expose builder semantics for:
    - `onBehalfOf`, permission timing, lifecycle/status wiring configuration,
    - access/link/agency permission shape configuration,
    - config-driven step helper behavior.
- **Current TypeScript state**:
  - Legacy JS-first interaction semantics are still partially present.
  - Some helper flows currently favor low-level or extension-style signatures as primary path.
- **Planned resolution**:
  - Align canonical builder + step semantics to Java.
  - Keep JS-only extensions only as compatibility aliases/extensions.

### 1.2 Java sample representation coverage (in progress)

- **Java reference**:
  - DSL-focused samples under `blue.language.samples` (`sdk`, `paynote`, `voucher`, bootstrap examples).
- **Current TypeScript state**:
  - No dedicated parity representation suite covering all DSL-focused samples.
- **Planned resolution**:
  - Add JS representations and tests for all DSL-focused samples (IPFS excluded).

## 2) Runtime/type-availability differences (non-construct)

### 2.1 PayNote default participant channels

- **Java reference**:
  ```yaml
  contracts:
    payerChannel: { type: Core/Channel }
    payeeChannel: { type: Core/Channel }
    guarantorChannel: { type: Core/Channel }
  ```
- **TypeScript runtime mapping**:
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
  - Runtime execution compatibility with current document-processor registry.

### 2.2 Named-event helper emitted type

- **Java reference**: `Common/Named Event`
- **TypeScript runtime mapping**: `Conversation/Event` + `name` (+ optional payload)
- **Reason**:
  - `Common/Named Event` alias unavailable in current installed repository package.

### 2.3 Backward-payment requested type availability

- **Java reference**: `PayNote/Backward Payment Requested` available/executable.
- **TypeScript runtime behavior**:
  - Fail-fast guard when alias is unavailable.
- **Reason**:
  - Alias availability differences across `@blue-repository/types` versions.

### 2.4 Reserve/release lock/unlock type availability

- **Java reference** includes:
  - `PayNote/Reserve Lock Requested`
  - `PayNote/Reserve Unlock Requested`
  - `PayNote/Reservation Release Lock Requested`
  - `PayNote/Reservation Release Unlock Requested`
- **TypeScript runtime behavior**:
  - Helpers exist; unavailable aliases fail fast explicitly.
- **Reason**:
  - Alias coverage differs in installed repository package version.

