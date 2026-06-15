---
title: Workspace Visual Refresh
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: HITL
last_updated: 2026-06-14
---

# Workspace Visual Refresh

## Parent

- PRD: [`workspace-visual-refresh.md`](./workspace-visual-refresh.md)
- ADR: [`0003-workspace-visual-refresh.md`](../../adr/0003-workspace-visual-refresh.md)
- Plan: [`../plan/workspace-visual-refresh-implementation-plan.md`](../plan/workspace-visual-refresh-implementation-plan.md)
- Domain: [`CONTEXT.md`](../../../CONTEXT.md)

## What to build

Deliver the **Workspace Visual Refresh** program: premium **Jardim de Vidro** aesthetics for `/app/*` while the **Marketing Surface** remains unchanged.

This parent tracks end-to-end visual consistency across:

- workspace token overrides and motion foundation
- app-scoped UI primitives
- **App Shell** chrome
- **Generation Screen** split layout
- **Active Execution Drawer** reading surface
- **Voice Dashboard** confidence ring
- history, onboarding, and settings polish
- visual QA gate

**Out of program scope:** marketing redesign, backend/SDK changes, **Billing Surface**, dark theme.

## Child issues

| # | Issue | Type | Blocked by |
|---|-------|------|------------|
| 39 | [Workspace tokens and motion foundation](../issues/39-workspace-tokens-and-motion-foundation.md) | AFK | — |
| 40 | [Workspace UI primitives](../issues/40-workspace-ui-primitives.md) | AFK | 39 |
| 41 | [App shell chrome refresh](../issues/41-app-shell-chrome-refresh.md) | AFK | 39 |
| 42 | [Generation screen visual refresh](../issues/42-generation-screen-visual-refresh.md) | AFK | 40 |
| 43 | [Active execution drawer reading surface](../issues/43-active-execution-drawer-reading-surface.md) | AFK | 40 |
| 44 | [Voice dashboard confidence presentation](../issues/44-voice-dashboard-confidence-presentation.md) | AFK | 40 |
| 45 | [Execution history and result reading polish](../issues/45-execution-history-and-result-reading-polish.md) | AFK | 40 |
| 46 | [Onboarding and settings visual pass](../issues/46-onboarding-and-settings-visual-pass.md) | AFK | 40 |
| 47 | [Workspace visual QA gate](../issues/47-workspace-visual-qa-gate.md) | HITL | 41–46 |

**Suggested order:** 39 → (40 ∥ 41) → (42, 43, 44, 45 in parallel) → 46 → 47

## Acceptance criteria (program)

- [ ] All `/app/*` routes render under workspace surface tokens; marketing routes unchanged.
- [ ] No Playfair or Caveat in workspace chrome or screen titles.
- [ ] Moss + golden are the only chromatic accents in workspace UI.
- [ ] **Generation Screen** matches split desktop / stacked mobile layout spec.
- [ ] **Active Execution Drawer** matches reading-surface spec on desktop and mobile.
- [ ] **Voice Confidence** uses growth ring presentation.
- [ ] `prefers-reduced-motion` verified across refreshed screens.
- [ ] Issue 47 QA checklist signed off.

## Blocked by

- Functional web v2 baseline (issues 27–38) for meaningful visual integration on real screens.
