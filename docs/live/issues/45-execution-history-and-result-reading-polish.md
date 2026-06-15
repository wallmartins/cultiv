---
title: Execution History and Result Reading Polish
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-14
---

# Execution history and result reading polish

## Parent

- [`issue-workspace-visual-refresh.md`](../prd/issue-workspace-visual-refresh.md)

## What to build

Apply **Workspace Surface Language** to **Execution History**, **Execution History Detail**, and shared **Execution Result View** reading patterns — aligned with drawer typography from issue 43 but for routed history flows.

This vertical slice delivers:

- history list rows with subtle hover lift, semantic status dot, and glass row or card treatment
- pagination / empty / loading states via `AppSkeleton` and workspace copy styles
- **Execution History Detail** and **Execution Result View** with relaxed reading typography and compact meta toolbar (copy, regenerate)
- consistent spacing with `AppPage` or workspace page header sans titles

No changes to list query, pagination API, or regenerate logic.

## Acceptance criteria

- [ ] History list readable at a glance: status, content type, date, credits with workspace styling.
- [ ] Detail route presents output with comfortable line length and relaxed leading.
- [ ] Loading and empty states match workspace skeleton/chip patterns.
- [ ] Visual consistency with **Active Execution Drawer** reading styles where output is shown.
- [ ] No Playfair/Caveat on history routes.

## Blocked by

- [40-workspace-ui-primitives.md](./40-workspace-ui-primitives.md)
