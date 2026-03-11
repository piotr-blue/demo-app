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

## Stage 2 hardening import

### Public serialization helpers
- Decision: `toOfficialJson(...)` and `toOfficialYaml(...)` now accept both
  `BlueNode` and builder-like inputs exposing `buildDocument()`.
- Why: Version B’s public export tests caught real integration friction in
  demo-app/compile-harness style code, and the additive overload keeps Version A
  modular while removing the need for downstream try/catch fallbacks.

### DocStructure public API
- Decision: `DocStructure.from(...)` now accepts an existing `DocStructure`
  instance or a serialized `DocStructureSummary`, and the class exposes
  `getContract(...)`, `getSection(...)`, and `unknownContracts`.
- Why: this ports the useful inspection ergonomics from Version B without
  replacing Version A’s structure model, and it makes summary roundtrips stable
  for downstream tools.

### Editing pipeline hardening
- Decision: `DocPatch` gained `diff(...)`, `apply(...)`, and `toTargetJson()`,
  while `BlueChangeCompiler.compile(...)` now returns a plan object with
  deterministic summaries, prompt text, grouped contract changes, and
  add/replace/remove buckets.
- Why: these were the highest-value editing helpers from Version B. They fit
  Version A’s existing JSON-based patching model and improve reviewability
  without importing Version B’s monolithic builder layout.

### Collision-safe behavior
- Decision: reserve-key payloads are now covered by dedicated editing-pipeline
  tests at the public API level.
- Why: the runtime-safe behavior already existed in Version A’s JSON pipeline,
  but Stage 2 required explicit proof that root and contract payloads containing
  `$sdkDsl...` keys survive patch and change-plan roundtrips.

### Canonical/public scenario discipline
- Decision: add a root-level public test suite for exported compatibility
  helpers, editing pipeline helpers, and canonical sample blueprints.
- Why: Version B’s strongest contribution here was not its file layout but its
  discipline around public API and scenario coverage. Version A keeps its own
  modules and imports that testing discipline directly.

## Stage 3 ergonomics and compatibility

### Generic contract helpers
- Decision: add `DocBuilder.contract(...)` and `DocBuilder.contracts(...)` as
  additive convenience helpers.
- Why: demo-app compatibility needs explicit contract insertion without falling
  back to internal state APIs, and this ports one of Version B’s most useful
  ergonomics without changing Version A’s builder layout.

### Link helper accumulation
- Decision: `documentAnchors(...)` and `documentLinks(...)` now merge into the
  existing helper contracts instead of overwriting previous entries.
- Why: low-diff migration requires cumulative `sessionLink(...)`,
  `documentLink(...)`, and `documentTypeLink(...)` calls to behave like the old
  authoring surface. Replacing the whole contract on every call was a real
  compatibility bug.

### Serialization helper tolerance
- Decision: `toOfficialJson(...)` and `toOfficialYaml(...)` now also accept
  plain `JsonObject` inputs in addition to `BlueNode` and builder-like inputs.
- Why: demo-app and test helpers sometimes pass already-materialized step or
  document JSON through the same public serialization path. Returning a cloned
  JSON object is the clean, runtime-safe behavior.

### AI and permissions overload polish
- Decision: fix the 4-argument `onAIResponseForTask(...)` overload and relax
  `MyOsPermissions.singleOps(...)` to ignore `null`/`undefined`/blank entries.
- Why: both behaviors showed up as real compatibility drifts under the new
  public test corpus. The fixes keep the intended public syntax working without
  reintroducing unsupported runtime fields.
