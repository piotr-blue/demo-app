# MyOS Visual Port Report

Date: 2026-03-21  
Branch: `cursor/myos-visual-system-port-77a3`

## Scope

Visual-language port of the demo app (`apps/blue-studio-web`) to match MyOS product family styling while preserving:

- routes
- state model (Blink / workspaces / threads / documents)
- existing behavior and app architecture
- collapsible global rail behavior

No architecture migration or routing/state rewrites were performed.

## Token + typography system

Updated in `app/layout.tsx` and `app/globals.css`.

- Body/UI typography direction: IBM Plex Sans
- Strong heading direction (Gilroy-like fallback): Manrope + heading utility tuning
- Core visual tokens shifted to MyOS-like enterprise palette:
  - `--bg-app: #f3f5f8`
  - `--bg-panel: #ffffff`
  - `--bg-subtle: #f7f9fc`
  - `--text-primary: #121b2f`
  - `--text-secondary: #5d6678`
  - `--text-muted: #8f9aae`
  - `--border-soft: #e7ecf3`
  - `--border-default: #d9e0ea`
  - `--accent-base: #0b6bff`
  - `--accent-soft: #e9f2ff`
  - `--accent-strong: #0659d8`
- Radius and elevation flattened:
  - tighter global radius
  - lighter card/subtle shadows
  - stronger elevation reserved for floating overlays

## Copied/added asset list

Added under `public/myos/`:

### Brand
- `brand/myos-logo.svg`
- `brand/blue-logo.svg`

### Avatars
- `avatars/blink.svg`
- `avatars/alice.svg`
- `avatars/piotr.svg`
- `avatars/workspace-shop.svg`
- `avatars/workspace-restaurant.svg`
- `avatars/workspace-business.svg`
- `avatars/workspace-generic.svg`

Visual mapping module:
- `lib/demo/visuals.ts`

## What was directly ported vs recreated

### Directly ported (pattern-level)

From screenshot/source-style references:
- top chrome composition (brand + search + user dropdown)
- slim white left rail with strong collapsed mode treatment
- contextual profile side panel pattern for scopes
- recap-first assistant view
- flatter list/table surfaces for tasks/documents/activity
- thin underline tabs on detail pages
- restrained borders/shadows/radii

### Recreated in-place

- SVG logos/avatars and component styling were recreated within this repository.
- Reason: reference repo access was unavailable in this environment, so exact file-level import from MyOS source could not be performed.

## Framework constraints (non-1:1 areas)

- Could not import MyOS component code directly (reference repository inaccessible).
- Current app remains on existing Next.js + base-ui/shadcn primitives.
- Gilroy local font file was not available; heading face was approximated with a compatible high-weight fallback stack.

## Primary changed files (high-level)

- Theme/foundation:
  - `app/layout.tsx`
  - `app/globals.css`
- Shared primitives:
  - `components/ui/{button,input,textarea,tabs,card,badge,tooltip,dropdown-menu,dialog,select}.tsx`
- Demo shell:
  - `components/demo/app-frame.tsx`
  - `components/demo/global-left-rail.tsx`
  - `components/demo/top-header.tsx`
  - `components/demo/user-account-dropdown.tsx`
  - `components/demo/workspace-template-dialog.tsx`
- Scope/pages:
  - `components/demo/scope-shell.tsx`
  - `components/demo/scope-assistant-tab.tsx`
  - `components/demo/scope-threads-tab.tsx`
  - `components/demo/scope-documents-tab.tsx`
  - `components/demo/scope-activity-tab.tsx`
  - `components/demo/attention-list.tsx`
  - `components/demo/blue-document-shell.tsx`
  - `app/(demo)/documents/page.tsx`
- Visual data:
  - `lib/demo/seed.ts`
  - `lib/demo/workspace-templates.ts`
  - `lib/demo/visuals.ts`

## Validation evidence

Executed successfully:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e -- myos-demo.spec.ts`
- `npm run test:e2e -- myos-visual-port.spec.ts`

Captured screenshots:

- `test-screenshots/myos-port/01-blink-home.png`
- `test-screenshots/myos-port/02-rail-collapsed.png`
- `test-screenshots/myos-port/03-rail-expanded.png`
- `test-screenshots/myos-port/04-workspace-dialog.png`
- `test-screenshots/myos-port/05-workspace-assistant.png`
- `test-screenshots/myos-port/06-threads-list.png`
- `test-screenshots/myos-port/07-thread-details.png`
- `test-screenshots/myos-port/08-documents-list.png`
- `test-screenshots/myos-port/09-document-details.png`
- `test-screenshots/myos-port/10-account-dropdown.png`
