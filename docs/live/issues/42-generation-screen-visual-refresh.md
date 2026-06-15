---
title: Generation Screen Visual Refresh
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-14
---

# Generation screen visual refresh

## Parent

- [`issue-workspace-visual-refresh.md`](../prd/issue-workspace-visual-refresh.md)

## What to build

Restructure **Generation Screen** presentation per **Generation Screen Layout** and **Workspace Surface Language** while preserving existing generation, preview, and submit behavior.

This vertical slice delivers:

- **Desktop:** wider column for **Briefing Form** + narrower sticky **Generation Preview** glass panel (price, balance, recommendation, CTA always visible)
- **Mobile:** single column — form stack then preview below
- **Quality modes** via `AppSegmentedControl` (or equivalent) instead of ad-hoc buttons
- Briefing groups in `AppCard` with contained mount stagger on first load
- Imported context field styled with `AppField`; solid readable textarea
- Workspace sans titles and meta labels

No changes to SDK calls, preview debounce logic, or async execution registration.

## Acceptance criteria

- [ ] At `md+` breakpoint, preview panel is sticky while scrolling briefing content.
- [ ] Below `md`, layout stacks vertically without horizontal scroll.
- [ ] Quality mode selector uses segmented control with sliding pill and plan-blocked states preserved.
- [ ] All existing acceptance behaviors from issue 29/38 still pass (preview, blocked modes, generate).
- [ ] Screen uses workspace tokens only (no Playfair/Caveat).

## Blocked by

- [40-workspace-ui-primitives.md](./40-workspace-ui-primitives.md)
