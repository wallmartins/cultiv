---
title: App Shell Chrome Refresh
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-14
---

# App shell chrome refresh

## Parent

- [`issue-workspace-visual-refresh.md`](../prd/issue-workspace-visual-refresh.md)

## What to build

Refine **App Shell** chrome to match **Jardim de Vidro** and **Workspace Navigation Chrome**: floating expandable glass dock (desktop), labeled bottom bar (mobile), and elevated header — without replacing the dock with a fixed sidebar.

This vertical slice updates:

- **AppHeader** — stronger glass treatment, subtle border, workspace spacing
- **CreditDisplay** — compact chip with mono numerals
- **AppSidebar** / **AppBottomNav** — dock shadow, moss active pill, icon consistency
- **AppAvatarMenu** — align with glass/chrome tokens
- page background organic glow on workspace main area

Behavior and nav items remain unchanged (Generate, History, Voice; Settings from avatar).

## Acceptance criteria

- [ ] Desktop dock retains expandable hover/focus behavior with refined glass and shadow.
- [ ] Mobile bottom nav matches workspace tokens; safe-area padding preserved.
- [ ] Header credit balance renders as a compact chip; loading skeleton uses workspace style.
- [ ] Active nav pill uses moss accent within **Workspace Accent Palette** rules.
- [ ] Marketing routes unaffected when visiting from same build.

## Blocked by

- [39-workspace-tokens-and-motion-foundation.md](./39-workspace-tokens-and-motion-foundation.md)
