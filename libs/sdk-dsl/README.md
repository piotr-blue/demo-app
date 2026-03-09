# @blue-labs/sdk-dsl

TypeScript DSL for composing Blue documents (`BlueNode`) with fluent builders, Java-parity constructs, structure extraction, and edit/patch tooling.

## Construct source-of-truth policy

This SDK follows a **Java-authoring-surface-first** policy for DSL constructs:

- The Java SDK fluent DSL surface is the source of truth for public construct names, signatures, and high-level semantics.
- Runtime/document-processor compatibility differences belong in serializers, mappers, and emitted-node shape handling — not in canonical DSL construct naming.
- Where installed `@blue-repository/types` aliases are unavailable, the SDK fails fast with explicit diagnostics and tracks those as runtime/type-availability gaps.

## Install in workspace

This package is part of the monorepo under `libs/sdk-dsl`.

## Quick start

```ts
import { DocBuilder, BasicBlueTypes } from '@blue-labs/sdk-dsl';

const doc = DocBuilder.doc()
  .name('Counter')
  .field('/counter', 0)
  .channel('ownerChannel', {
    type: 'Conversation/Timeline Channel',
    timelineId: 'owner-timeline',
  })
  .operation('increment', 'ownerChannel', BasicBlueTypes.Integer, 'Increment', (steps) =>
    steps.replaceExpression(
      'IncrementCounter',
      '/counter',
      "document('/counter') + event.message.request",
    ),
  )
  .buildDocument();
```

## Features

- `DocBuilder` / `SimpleDocBuilder` fluent authoring API
- step composition (`StepsBuilder`) including MyOS and payment helpers
- high-level interaction builders (`access`, `accessLinked`, `agency`) aligned to Java construct semantics
- AI integration builder + response workflows
- PayNote builder (`PayNotes.payNote(...)`)
- `DocStructure.from(...)` for stable structure extraction + prompt summaries
- `DocPatch.from(...)` for generic RFC-6902 style patch generation
- `BlueChangeCompiler` for Blue-aware change planning

## Editing and patch model

The SDK provides two patch/editing layers:

1. **Generic patching** (`DocPatch`)
   - JSON/Node diff + apply utility
   - RFC-6902-like operations

2. **Blue-aware compilation** (`BlueChangeCompiler`)
   - separates root changes from contract changes
   - treats contract edits as atomic add/replace/remove units
   - groups contract changes by section/inferred bucket

See:
- `docs/sdk-dsl-editing-and-patch-model.md`

## Testing locally

- Type check:
  - `npx tsc -p libs/sdk-dsl/tsconfig.lib.json --noEmit`
- Lint:
  - `npx eslint libs/sdk-dsl`
- Tests:
  - `NX_DAEMON=false npx nx test sdk-dsl --skip-nx-cache`

## Current status

See:
- `docs/sdk-dsl-js-port-checklist.md`
- `docs/coverage-matrix.md`
- `issues.md`
- `mappings_diff.md`
