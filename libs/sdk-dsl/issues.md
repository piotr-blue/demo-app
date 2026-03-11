# SDK DSL Known Gaps and Follow-ups

This file tracks known gaps between the TypeScript SDK DSL and Java SDK reference.

## A) Construct parity gaps (DSL surface/semantics)

### A1) Interaction DSL drift (`access` / `accessLinked` / `agency`)

- **Status**: In progress (high priority)
- **Scope**:
  - Builder method parity gaps (`onBehalfOf`, permission timing APIs, status path wiring, operation/type allow-lists, link builder semantics).
  - Auto-wiring parity gaps in `done()` (permission lifecycle handlers, status updates, subscribe-after-granted behavior).
  - Step helper semantic drift (`subscribe(...)` arg interpretation, config-driven request/subscribe behavior, canonical agency start session flow).
- **Target behavior**:
  - Java construct naming/signatures and high-level semantics are canonical.
  - JS-only extensions may remain as compatibility aliases/extensions, but not as canonical path.
- **Next actions**:
  - Complete builder + steps parity implementation.
  - Replace tests currently codifying non-parity semantics with canonical parity assertions.

### A2) Java sample representation coverage in TS

- **Status**: In progress
- **Scope**:
  - Add JS representations and tests for DSL-focused Java samples under:
    - `samples/sdk/*`
    - `samples/paynote/*`
    - voucher templates/bootstrap scenarios
  - Exclude IPFS console samples (not DSL construct surface parity target).
- **Next actions**:
  - Add sample builders + parity intent tests (normalized construct-level assertions).

## B) Runtime alias/type availability gaps (non-construct)

### B1) Named event type alias divergence

- **Status**: Isolated runtime/type-availability gap
- **Repro**:
  ```ts
  DocBuilder.doc()
    .onNamedEvent('onReady', 'ready', (steps) =>
      steps.replaceValue('SetReady', '/status', 'ready'),
    )
    .buildDocument();
  ```
- **Expected (Java mapping reference)**:
  - `type: Common/Named Event`
- **Actual**:
  - Resolved in the Stage 1 mainline uplift: runtime SDK emits/listens using
    `type: Common/Named Event` with root-level event fields.
- **Likely cause**:
  - Version A was still pinned to an older `@blue-repository/types` range.
- **Next actions**:
  - Keep tests/docs aligned to the public named-event type.

### B2) PayNote default channels adjusted for processor compatibility

- **Status**: Runtime compatibility behavior
- **Repro**:
  ```ts
  PayNotes.payNote('Armchair').buildJson();
  ```
- **Expected (Java mapping reference)**:
  - `payerChannel`, `payeeChannel`, `guarantorChannel` as `Core/Channel`.
- **Actual**:
  - Emitted as `Conversation/Timeline Channel` with deterministic timeline ids.
- **Likely cause**:
  - `Core/Channel` is not executable in current document-processor default registry path.
- **Next actions**:
  - Keep runtime-safe defaults unless runtime support changes.

### B3) Backward payment requested type availability

- **Status**: Isolated with fail-fast guard
- **Repro**:
  ```ts
  new StepsBuilder().requestBackwardPayment((payload) =>
    payload.processor('voucher'),
  );
  ```
- **Expected (Java mapping reference)**:
  - `type: PayNote/Backward Payment Requested`
- **Actual**:
  - Explicit fail-fast when alias is unavailable.
- **Likely cause**:
  - Alias availability differs across `@blue-repository/types` versions.
- **Next actions**:
  - Re-enable runtime path once alias is available in target runtime package.

### B4) Reserve/release lock/unlock event type availability

- **Status**: Isolated with fail-fast guards
- **Repro**:
  ```ts
  PayNotes.payNote('Release Lock Unsupported')
    .release()
      .lockOnInit()
      .done()
    .buildDocument();
  ```
- **Expected (Java mapping reference)**:
  - `PayNote/Reserve Lock Requested`
  - `PayNote/Reserve Unlock Requested`
  - `PayNote/Reservation Release Lock Requested`
  - `PayNote/Reservation Release Unlock Requested`
- **Actual**:
  - Explicit fail-fast when aliases are unavailable.
- **Likely cause**:
  - Alias/type coverage differences in installed repository package.
- **Next actions**:
  - Revalidate alias availability against target runtime version and re-enable once supported.
