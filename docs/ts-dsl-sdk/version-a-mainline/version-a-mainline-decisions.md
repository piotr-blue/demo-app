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
- Decision: `MyOsPermissions` now uses the runtime-correct `share(...)` surface,
  and explicit empty `singleOps()` calls are preserved.
- Why: the MyOS permission model is `read` / `share` / `singleOps` / `allOps`;
  keeping `write(...)` in the public helper surface would preserve an invalid
  alias instead of the actual runtime shape.

### Start Worker Session Requested
- Decision: emit `onBehalfOf`, `document`, `channelBindings`,
  `initialMessages`, and `capabilities` at the root and reject legacy
  `bootstrapAssignee` worker-session options.
- Why: the old `agentChannelKey` + nested `options` envelope did not match the
  final runtime contract.

### Linked-doc helper semantics
- Decision: keep `onLinkedDocGranted(...)` and `onLinkedDocRevoked(...)` as the
  concrete single linked-doc notifications, and use
  `onLinkedAccessRejected(...)` for linked-documents permission-request
  lifecycle rejection.
- Why: runtime emits per-document grant and revoke notifications, but linked
  permission rejection is modeled as an aggregate linked-documents lifecycle
  response. Keeping `onLinkedDocRejected(...)` would blur those two surfaces.

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

## Stage 4 reference-b tail-commit audit

### `de0dd4859075be3d0d3491f1d79898baa73fac55`
- Inspected: `libs/myos-js/src/lib/core/http-client.ts`,
  `libs/myos-js/src/lib/core/__tests__/http-client.spec.ts`, plus associated
  docs clarifications.
- Ported: richer HTTP error messages that include request method/path/status and
  summarized response body details (`type`, `reason`, `message`, `error`), plus
  unit coverage.
- Not ported: the reference docs wording changes.
- Why: the runtime/client bug still existed, but the docs part was secondary and
  can be covered in the final Stage 5 docs pass without mixing release-quality
  copy edits into the transport fix.

### `6d5c4644c3aa7036d31f124296487ebd3c69283e`
- Inspected: `libs/myos-js/src/live/helpers/live-document.ts`,
  `libs/myos-js/src/live/helpers/live-document.spec.ts`, and the live payment
  stories using emitted-event assertions.
- Ported: `latestEpochNumber(...)`, epoch-backed `latestEmittedEvents(...)`,
  `waitForLatestEmittedEvent(...)`, `findEmittedEventBySchema(...)`,
  `waitForLatestEmittedEventBySchema(...)`, helper unit tests, and the live
  payment-story assertions that should key off emitted epoch events.
- Not ported: removal of the older feed-entry-based `waitForEmittedEvent(...)`
  helper.
- Why: bootstrap/payment stories were still asserting against the wrong surface,
  but some advanced-control stories intentionally inspect feed entries, so the
  old helper remains as a separate tool instead of being deleted wholesale.

### `74a80ac33a8788319d81e811c80112bbe6d5167e`
- Inspected: `libs/myos-js/src/live/helpers/live-client.ts`.
- Ported: `defaultBootstrapBinding(...)` now returns both `email` and
  `accountId` when both are available, plus direct unit coverage.
- Not ported: no additional bootstrap-binding API expansion beyond that helper.
- Why: the binding bug still existed in Version A’s live helper, and returning
  both identifiers is runtime-safe. The rest of the bootstrap API surface was
  already aligned enough for this stage.

### `2ee6a8ce306ba820693455811e5e2dfb83eee13a`
- Inspected: live spec fixes in `myos.live.spec.ts`,
  `recruitment-classifier.live.spec.ts`,
  `basic-and-events.live.spec.ts`,
  `bootstrap-and-payments.live.spec.ts`, and
  `bootstrap-payments.docs.ts`.
- Ported: `BasicBlueTypes.Integer` in the live counter story, migration from
  manual email-only bindings to `defaultBootstrapBinding(...)`, and the
  bootstrap/payment live assertions that now use the new emitted-event polling
  helpers.
- Not ported: `ownerUpdate` -> `ownerEmit` renames, paynote channel additions in
  `bootstrap-payments.docs.ts`, the bootstrap-doc binding object change inside
  `steps.myOs().bootstrapDocument(...)`, and the recruitment bootstrap error
  wrapper.
- Why: the rename changes compensate for Version B naming differences that
  Version A intentionally does not adopt; the paynote channels already exist in
  current Version A output; the bootstrap-doc object-binding change would
  require expanding a currently string-only SDK step API outside this stage’s
  scope; and the richer `http-client` error messages from `de0dd48...` already
  address the underlying bootstrap-debug problem with less churn.

## Stage 5 release quality and publish surface

### Package entrypoints and runtime dependencies
- Decision: both public package manifests now target `dist` JS/DTS entrypoints,
  `@blue-repository/types` is a regular `sdk-dsl` runtime dependency, and
  `myos-js` depends on the published `@blue-labs/sdk-dsl` semver instead of a
  local `file:` link.
- Why: Stage 5 requires publish-ready packages. Source entrypoints and local
  file dependencies are acceptable in workspace-only development, but they are
  not valid release artifacts for the production mainline SDK.

### Build workflow hardening
- Decision: both libraries now build through package-level `node
  scripts/build.mjs` entrypoints that generate Vite JS output, declarations,
  and a coherent `dist/package.json`; `blue-studio-web` prebuild/typecheck/test
  hooks now prepare both libraries before consuming them.
- Why: once package manifests point at `dist`, local consumer workflows must
  remain zero-friction. The app should not depend on stale artifacts or manual
  build ordering.

### Public tarball discipline
- Decision: package `files` now whitelist release artifacts (`dist`, plus
  `docs`/`openapi` for `myos-js`) and exclude nested `dist/package.json`; Stage
  5 verification includes `npm pack --dry-run` for both packages.
- Why: public tarballs should not ship `src/`, specs, or other workspace-only
  implementation files. `npm pack --dry-run` is the cleanest verification that
  the release surface matches the intended public contract.

## Post-mainline bootstrap correction

### `Conversation/Document Bootstrap Requested`
- Decision: `steps.bootstrapDocument(...)`,
  `steps.bootstrapDocumentExpr(...)`, and `steps.myOs().bootstrapDocument(...)`
  now require an explicit `onBehalfOf` argument; the legacy bootstrap form
  without requester-channel input is no longer supported. Low-level bootstrap
  helpers also require explicit channel binding objects instead of string
  shorthand.
- Why: the real MyOS Admin direct-bootstrap path validates `onBehalfOf` on
  `Conversation/Document Bootstrap Requested`. Supporting it as first-class SDK
  input closes the runtime gap and avoids authoring request shapes that would be
  rejected at runtime. Removing string shorthand avoids ambiguous guessing
  between account/email/timeline references. This stays separate from the
  runtime-correct subscribe helper semantics, which still do not accept
  `onBehalfOf`.

## Post-mainline correction pass

### `onChannelEvent(...)` channel semantics
- Decision: `onChannelEvent(...)` now treats timeline-like channels as
  message-payload matchers (`event.message`) while keeping direct-event channels
  on direct `event` matching; explicit timeline-entry event types remain direct.
- Why: this is the final runtime-confirmed behavior. Flattening timeline entry
  payloads into direct event matchers would be incorrect for the current public
  runtime.

### Stage-6 operation-triggered PayNote branches
- Decision: `unlockOnOperation(...)`, `requestOnOperation(...)`, and
  `requestPartialOnOperation(...)` no longer synthesize `Boolean`, `Integer`,
  or `Text` request schemas on the operation contract.
- Why: these helpers target requestless or wildcard operation semantics. The
  runtime proof is the resolved-content MyOS-style operation request path in
  sdk-dsl test support. It is not a broader raw-node processor-schema claim.

### Package status docs refresh
- Decision: replace stale package-level status docs with final runtime-correct
  coverage, deferred-item, and mapping-note documents.
- Why: the old files still described pre-mainline drift, outdated coverage
  counts, and fallback assumptions that no longer reflect the production
  Version-A SDK.
