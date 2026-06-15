---
title: Active Execution Drawer Reading Surface
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-14
---

# Active execution drawer reading surface

## Parent

- [`issue-workspace-visual-refresh.md`](../prd/issue-workspace-visual-refresh.md)

## What to build

Upgrade **Active Execution Drawer** to the workspace reading spec: ~520px right slide-over on desktop, full-screen sheet on mobile, optimized for **Execution Result View** long-form text.

This vertical slice delivers:

- drawer width and full-height glass panel on desktop with dimmed backdrop
- mobile presentation as full-screen sheet (not partial 85vh)
- relaxed reading typography for generated output (`leading-relaxed`, comfortable size)
- fixed top toolbar: close, copy, link to **Execution History Detail**
- drawer open/close animation per **Workspace Motion Language** (~320ms ease, no bounce)
- `prefers-reduced-motion` uses opacity-only open/close

Watch, list, and notification behavior unchanged.

## Acceptance criteria

- [ ] Desktop drawer width ~520px (±40px documented in code comment or token).
- [ ] Mobile drawer covers full viewport height for reading.
- [ ] Completed execution text is readable without cramped line length on common laptop widths.
- [ ] Toolbar actions remain reachable while scrolling long output.
- [ ] Reduced motion: no slide animation; content still accessible.

## Blocked by

- [40-workspace-ui-primitives.md](./40-workspace-ui-primitives.md)
