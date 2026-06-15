---
title: Workspace Visual QA Gate
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: HITL
last_updated: 2026-06-14
---

# Workspace visual QA gate

## Parent

- [`issue-workspace-visual-refresh.md`](../prd/issue-workspace-visual-refresh.md)

## What to build

Run a structured visual and accessibility QA pass for the **Workspace Visual Refresh** program before marking the parent issue complete.

This vertical slice produces:

- a checklist document or section in [`web-v2-qa-checklist.md`](../plan/web-v2-qa-checklist.md) covering workspace visual criteria
- manual verification on desktop (1280px+) and mobile (375px) for all refreshed routes
- marketing smoke test confirming no regression on `/` and `/en`
- `prefers-reduced-motion` verification on Generation, Drawer, Voice ring
- font audit: no Playfair/Caveat under `/app/*` in computed styles for titles

Sign-off recorded in issue checklist (human reviewer).

## Acceptance criteria

- [ ] Checklist covers issues 39–46 acceptance themes.
- [ ] `/app/generate`, `/app/history`, `/app/voice`, `/app/onboarding`, `/app/settings` pass visual review.
- [ ] Marketing homepage hero unchanged (screenshot or reviewer note).
- [ ] Reduced motion path documented and verified.
- [ ] Parent program acceptance criteria in [`issue-workspace-visual-refresh.md`](../prd/issue-workspace-visual-refresh.md) ticked.

## Blocked by

- [41-app-shell-chrome-refresh.md](./41-app-shell-chrome-refresh.md)
- [42-generation-screen-visual-refresh.md](./42-generation-screen-visual-refresh.md)
- [43-active-execution-drawer-reading-surface.md](./43-active-execution-drawer-reading-surface.md)
- [44-voice-dashboard-confidence-presentation.md](./44-voice-dashboard-confidence-presentation.md)
- [45-execution-history-and-result-reading-polish.md](./45-execution-history-and-result-reading-polish.md)
- [46-onboarding-and-settings-visual-pass.md](./46-onboarding-and-settings-visual-pass.md)
