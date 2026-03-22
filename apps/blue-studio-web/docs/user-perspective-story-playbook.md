# Blue Studio User Playbook: Threads, Prompts, and Story Scenarios

This guide is written from a user perspective so another tool can generate and run multiple usage stories.

## Core Mental Model

- `Thread` = one workspace conversation where you build one document flow.
- In each thread you:
  1. type a command (goal)
  2. optionally attach files (context)
  3. get a blueprint (`STATE: questions` then `STATE: ready`)
  4. generate DSL
  5. compile
  6. fill channel bindings
  7. bootstrap to MyOS
  8. capture `sessionId` for follow-up stories

## Prompt Placeholders (for your tool)

Replace these placeholders at runtime with the actual prompt content.

## Placeholder: content -> blueprint

```text
{{CONTENT_TO_BLUEPRINT_PROMPT}}
```

## Placeholder: blueprint -> dsl

```text
{{BLUEPRINT_TO_DSL_PROMPT}}
```

Recommended mapping in this repo:

- `{{CONTENT_TO_BLUEPRINT_PROMPT}}` -> `lib/prompts/blueprint-architect-prompt.md`
- `{{BLUEPRINT_TO_DSL_PROMPT}}` -> `lib/prompts/blueprint-to-js-dsl-prompt.md`

## Standard Per-Thread Flow (User Actions)

1. Start a thread for one business intent.
2. Enter a clear command in plain English.
3. Attach files if needed (policies, examples, existing doc exports).
4. Answer clarification questions until blueprint reaches `STATE: ready`.
5. Click `Generate DSL`.
6. Click `Compile DSL`.
7. In `Review channel bindings`, provide required account/email values.
8. Click `OK — bootstrap`.
9. In `Overview`, record the resulting `sessionId`.
10. Reuse that `sessionId` in later stories (same thread or another thread).

## Story Template (for automated story generation)

Use this structure for each story:

```yaml
story_id: S1
thread_name: <short name>
goal: <what user is trying to achieve>
user_command: <exact text user types>
attachments:
  - <file or context block>
expected_questions:
  - <optional expected clarifications>
success_signals:
  - blueprint_state_ready
  - dsl_compiled
  - bootstrap_session_created
carry_forward:
  - sessionId
  - anchors
  - key_operations
```

## Sample Story Set

## Story 1: Create a Base Document

Goal: create the first runnable document and capture its `sessionId`.

User command:

```text
Create a vendor profile document. Keep vendor status, contact info, and onboarding notes. Owner can update fields, reviewer can approve or reject onboarding.
```

Attachments: none.

Done when:

- blueprint is `STATE: ready`
- compile succeeds
- bootstrap succeeds
- `sessionId` is visible in Overview

Carry forward:

- `sessionId` (call it `vendorProfileSessionId`)
- any anchor names defined in blueprint

## Story 2: Create a Second Document from Attached Content

Goal: generate a second document from a real file.

User command:

```text
Create a purchase request document from the attached policy. Track requester, amount, justification, approval status, and final decision.
```

Attachments:

- upload `purchase-policy.md` (or equivalent policy text)

Done when:

- blueprint references required policy rules
- compile succeeds
- bootstrap succeeds

Carry forward:

- `sessionId` (call it `purchaseRequestSessionId`)
- operations list (for example: `submit`, `approve`, `reject`)

## Story 3: Connect Two Existing Documents

Goal: create a coordinator document that links Story 1 and Story 2 concepts.

User command:

```text
Create a coordination document that links vendor onboarding and purchase requests. When vendor is approved, allow purchase requests for that vendor; otherwise block them.
```

Attachments (as context files):

- summary/export of Story 1 document (include `vendorProfileSessionId`)
- summary/export of Story 2 document (include `purchaseRequestSessionId`)

Done when:

- blueprint explicitly describes link behavior between the two documents
- generated DSL compiles
- document bootstraps successfully

Carry forward:

- `sessionId` (call it `coordinatorSessionId`)
- link/anchor fields used for cross-document references

## Story 4: Use MyOS SessionId + Anchors

Goal: build a document that reacts to an existing MyOS document that has anchors.

Precondition:

- you have a known MyOS `sessionId` for a document with anchors

User command:

```text
Create an agent document that watches the anchored linked documents from this session and raises a review-needed flag when a linked document enters an error state.
Use sessionId: <existing_session_id_here>
```

Attachments:

- a context file listing:
  - `sessionId`
  - anchor names
  - any relevant operations or fields

Done when:

- blueprint includes anchor-aware monitoring behavior
- compiled DSL includes reaction flows for linked updates
- bootstrap returns a new agent `sessionId`

Carry forward:

- agent `sessionId`
- alert/status paths and operations

## Story 5: “Create This, Then That, Then Connect” (explicit chain)

Goal: run a multi-step chain exactly as requested.

Step A command:

```text
Create a project brief document with goals, owner, due date, and status transitions.
```

Step B command (new thread or same thread):

```text
Create an implementation task document that tracks tasks, assignees, dependencies, and completion.
```

Step C command (connection story):

```text
Create a linking document that connects project briefs to implementation tasks. When a brief is approved, task execution can start; when a brief is paused, task execution is blocked.
```

Attachments for Step C:

- context export from Step A (with `sessionId`)
- context export from Step B (with `sessionId`)

Done when:

- all three documents are bootstrapped
- Step C blueprint clearly defines relationship and gating logic
- you have 3 session IDs and an explicit connection model

## Story 6: Cross-Thread Continuation with Existing Session

Goal: in a fresh thread, continue work using an existing MyOS `sessionId`.

User command:

```text
Using existing sessionId <session_id>, create a support operations document that can escalate, resolve, and annotate incidents linked to that source document.
```

Attachments:

- session context file with fields/operations/anchors from the source document

Done when:

- new document bootstraps successfully
- operations are callable and relevant to source session context

## Practical Notes for Story-Generator Tools

- Keep one business objective per thread to reduce noisy clarifications.
- Always store artifacts after each story:
  - final blueprint text
  - generated DSL
  - compile status
  - bootstrap `sessionId`
  - anchor names
- If model asks clarifying questions, answer directly and minimally so it reaches `STATE: ready` quickly.
- For connection stories, always provide both source session IDs in either prompt text or attachment context.

## Suggested Output Bundle Per Story

```json
{
  "storyId": "S1",
  "threadName": "Vendor Profile",
  "prompt": "...",
  "attachments": ["..."],
  "blueprintState": "ready",
  "dslCompiled": true,
  "bootstrapSessionId": "...",
  "sessionId": "...",
  "anchors": ["..."],
  "nextStoryInputs": {
    "sessionIds": ["..."],
    "contextFiles": ["..."]
  }
}
```

This format makes it easy to chain `create -> create -> connect -> anchor/session-based follow-up` stories.
