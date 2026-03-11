# Version A mainline uplift spec (updated)

## Objective

Make Version A of `libs/sdk-dsl` the production mainline by:
- fixing its concrete runtime-shape drifts
- preserving its stronger modular architecture and better natural fit with `libs/myos-js`
- importing the strongest hardening and testing practices from Version B
- selectively porting relevant fixes from the latest Version B commits
- reaching 9+/10 in:
  - Java parity
  - API ergonomics
  - runtime correctness
  - functional completeness
  - implementation/test quality

## Non-goals
- replacing Version A wholesale with Version B
- expanding transport/API concerns from `myos-js`
- adding support for currently deferred runtime features unless now truly supported
- blindly replaying the latest Version B commits

## Success criteria
- green verification after every stage
- no regression in existing behavior
- modular structure preserved
- compatibility surface good enough for low-diff demo-app migration
- no private provenance in committed tests/docs
- explicit decision record for the audited Version B commits

## Final correction notes

- `onChannelEvent(...)` on timeline-like channels matches message types under
  `event.message`; direct-event channels remain direct matchers
- Stage-6 operation-triggered PayNote branches omit synthetic request schemas;
  the current runtime proof is on the resolved-content MyOS-style operation
  request path exercised in `sdk-dsl` test support
- `bootstrapDocument(...)` now requires `onBehalfOf` for
  `Conversation/Document Bootstrap Requested`; this is required by the real
  MyOS Admin bootstrap path and is intentionally separate from the runtime-
  correct subscribe helpers, which still do not accept `onBehalfOf`
