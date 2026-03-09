# Prompt sources

These prompt files are synced into this app at build time and are **not** fetched from GitHub at runtime.

## Upstream repositories

- `blueprint-architect-prompt.md`
  - source repo: `piotr-blue/prompt-optimizer`
  - source branch: `cursor/blue-dsl-prompt-optimizer-500f`
  - source commit: `b2db09bd0147fd672d383496ccde73c8c7587651`
  - source path: `prompt-optimizer/src/main/resources/blueprint-architect-prompt.md`

- `blueprint-to-js-dsl-prompt.md`
  - local rewrite based on upstream Java-oriented prompt:
    - source repo: `piotr-blue/prompt-optimizer`
    - source branch: `cursor/blue-dsl-prompt-optimizer-500f`
    - source commit: `b2db09bd0147fd672d383496ccde73c8c7587651`
    - source path: `prompt-optimizer/src/main/resources/blueprint-to-dsl-prompt.md`
  - adapted for `@blue-labs/sdk-dsl` JavaScript/TypeScript API

- `document-status-templates-prompt.md`
  - local prompt for generating viewer-specific status templates from blueprint

- `document-qa-prompt.md`
  - local prompt for document assistant Q&A over blueprint + optional live state

- `document-reference-renderer-prompt.md`
  - local prompt for converting blueprint/schema/live-json sources into canonical text attachments

## Runtime note

Prompt files are read from this directory during API route execution and shipped with the deployed artifact.
