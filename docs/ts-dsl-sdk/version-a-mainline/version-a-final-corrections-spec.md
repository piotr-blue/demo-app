# Version A — final corrections spec

## Goal
Bring Version A to a clean pre-migration state by closing the last three identified issues.

## Point 1 — `onChannelEvent(...)`
### Final semantic rule
- timeline-like channels -> matcher under `event.message`
- triggered/lifecycle/document-update channels -> direct `event`

### Required outcome
- implementation remains correct
- tests make this distinction explicit
- docs reflect this distinction

## Point 2 — Stage-6 operation-triggered PayNote branches
### Final semantic rule
Where the intended semantics are “requestless / any payload / empty payload allowed”, do not emit artificial request schemas.

### Required outcome
- remove synthetic `Boolean` / `Integer` / `Text` request schema emission
- update parity/integration/canonical PayNote tests
- if proof relies on resolved-content operation contracts, document that precisely

## Point 3 — stale docs
### Required outcome
Update or replace stale status docs so they match:
- current supported features
- current deferred items
- current test/coverage state
- current runtime-correct semantics
