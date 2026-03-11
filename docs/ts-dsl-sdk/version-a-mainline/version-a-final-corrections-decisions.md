# Version A — final corrections decisions

## Confirmed semantics
- `onChannelEvent(...)` on timeline-like channels must match under `event.message`
- triggered/lifecycle/document-update channels use direct `event`
- subscribe helpers remain without `onBehalfOf`

## Correction target
- operation-triggered PayNote macro branches should not emit artificial request schemas when the intended semantics are requestless

## Deferred / untouched
- `requestBackwardPayment(...)`
- `document-processor` behavior
- demo-app migration
- `lcloud` migration
