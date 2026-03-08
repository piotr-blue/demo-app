# SDK DSL Known Gaps and Follow-ups

This file tracks currently known parity gaps between the TypeScript SDK DSL and the Java POC DSL.

## 1) Named event type alias divergence

- **Status**: Isolated (runtime-first, deterministic)
- **Repro**:
  ```ts
  DocBuilder.doc()
    .onNamedEvent('onReady', 'ready', (steps) =>
      steps.replaceValue('SetReady', '/status', 'ready'),
    )
    .buildDocument();
  ```
- **Expected (Java parity)**:
  - `type: Common/Named Event`
- **Actual**:
  - Runtime SDK emits/listens using `type: Conversation/Event` with `name` matcher.
- **Likely cause**:
  - `Common/Named Event` alias is unavailable in `@blue-repository/types@0.9.0`.
- **Next actions**:
  - Keep runtime-default behavior until repository alias becomes available.
  - Re-evaluate parity mode only after runtime package exposes `Common/Named Event`.

## 2) PayNote default channels adjusted for processor compatibility

- **Status**: Intentional runtime default
- **Repro**:
  ```ts
  PayNotes.payNote('Armchair').buildJson();
  ```
- **Expected (Java mapping reference)**:
  - `payerChannel`, `payeeChannel`, `guarantorChannel` typed as `Core/Channel`.
- **Actual**:
  - These channels are emitted as `Conversation/Timeline Channel` with deterministic timeline ids.
- **Likely cause**:
  - `Core/Channel` is not executable in `document-processor` default registry for runtime tests.
- **Next actions**:
  - Keep timeline-channel defaults as processor-safe runtime behavior.
  - Revisit only if processor execution support changes.

## 3) Backward payment requested type availability

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
  - SDK now fails fast at DSL call-site with explicit message:
    - `steps.requestBackwardPayment(...) requires repository type alias 'PayNote/Backward Payment Requested' ...`
- **Likely cause**:
  - Alias availability differs across `@blue-repository/types` versions.
- **Next actions**:
  - Validate against target repository version used in CI/runtime.
  - Re-enable runtime path once alias is available.

## 4) Reserve/release lock/unlock event type availability

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
  - SDK now fails fast in reserve/release lock-unlock helper calls with explicit messages naming the missing alias.
- **Likely cause**:
  - Alias/type coverage differs across `@blue-repository/types` versions.
- **Next actions**:
  - Revalidate release lock/unlock aliases against the target repository model version and re-enable full runtime coverage once available.

