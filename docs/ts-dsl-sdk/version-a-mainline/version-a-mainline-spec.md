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
