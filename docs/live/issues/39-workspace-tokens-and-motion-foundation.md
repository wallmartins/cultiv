---
title: Workspace Tokens and Motion Foundation
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-14
---

# Workspace tokens and motion foundation

## Parent

- [`issue-workspace-visual-refresh.md`](../prd/issue-workspace-visual-refresh.md)

## What to build

Establish the **Workspace Visual Refresh** token layer scoped to `/app/*` without altering **Marketing Surface** rendering.

This vertical slice proves end-to-end that:

- **App Shell** root carries a workspace surface attribute (e.g. `data-surface="workspace"`)
- workspace CSS overrides set sans display typography, medium radius, warm card shadows, and moss/golden accent usage variables
- a subtler workspace organic glow utility exists for page backgrounds
- motion CSS variables (`duration`, `ease`) are defined for shared workspace animations
- `prefers-reduced-motion` collapses workspace transitions at the token/hook layer
- marketing routes (`/`, `/en`, legal) render with unchanged editorial typography and radius

## Acceptance criteria

- [ ] Logged-in `/app/*` routes inherit workspace tokens; `/` hero still uses Playfair.
- [ ] Screen titles under workspace use sans via `--font-display` override (no Playfair computed on `h1` in app).
- [ ] Radius tokens apply to a smoke-test element or documented utility class in workspace only.
- [ ] `prefers-reduced-motion: reduce` disables pill/dock transition durations defined in workspace CSS.
- [ ] No breaking changes to `packages/ui/styles/theme.css` that affect marketing pages.

## Blocked by

None — can start immediately.
