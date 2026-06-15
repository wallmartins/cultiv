---
title: Workspace Visual Refresh
doc_type: prd
status: ready-for-agent
domain: authenticated-workspace
last_updated: 2026-06-14
---

# Workspace Visual Refresh — PRD

## Summary

Premium, fluid, contemporary visual evolution for the **Authenticated Workspace** (`/app/*`) only. The **Marketing Surface** keeps its editorial language (Playfair, Caveat, scroll chapters, botanical scenes). The workspace adopts **Jardim de Vidro** — soft glass, warm shadows, sans-only typography, moss + golden accents, and contained fluid motion.

**Governance:** [ADR 0003](../../adr/0003-workspace-visual-refresh.md) · [CONTEXT.md](../../../CONTEXT.md) (Workspace Visual Refresh glossary) · [plan](../plan/workspace-visual-refresh-implementation-plan.md) · [issues 39–47](../issues/README.md#workspace-visual-refresh)

## Problem

Web v2 shipped functional screens with layout and flows that work, but the workspace still reads as an editorial marketing prototype: serif titles, hard borders, form-first stacks, and inconsistent depth. Daily-use screens need a product-grade feel — premium, warm, organic — without reworking the public showcase.

## Goals

1. **Premium product feel** in `/app/*` without touching marketing routes or `packages/ui` marketing tokens.
2. **Brand continuity** via **Brand Tone** (organic warmth) — not cold corporate SaaS.
3. **Readable, efficient workflows** — split **Generation Screen**, reading-first **Active Execution Drawer**, scannable history.
4. **Contained fluid motion** — route fades, mount staggers, drawer springs; `prefers-reduced-motion` respected.
5. **Implementable in vertical slices** — each issue demoable on its own.

## Non-goals

- Marketing Surface redesign or token changes that affect showcase pages.
- Dark theme productization for workspace.
- Violet or third chromatic accent in app chrome.
- New backend APIs or SDK contract changes.
- Billing Surface UI.

## Design decisions (locked)

| Area | Decision |
|------|----------|
| Scope | `/app/*` only |
| Direction | Jardim de Vidro (soft glass, subtle organic glow, medium radius) |
| Typography | Sans-only in workspace; no Playfair/Caveat in app chrome |
| Accents | Moss (interactive) + golden (growth/progress) only |
| Generation Screen | Desktop split with sticky **Generation Preview**; mobile single column |
| Navigation | Floating expandable glass dock (desktop) + bottom bar (mobile) |
| Voice Confidence | Moss-to-golden growth ring on **Voice Dashboard** |
| Motion | Fluid contained — no bounce, elastic, or scroll chapters |
| Active Execution Drawer | ~520px right slide-over (desktop); full-screen sheet (mobile) |

## User-facing outcomes

1. User opens **Generation Screen** and sees a calm split layout with preview always visible on desktop.
2. User navigates with a refined glass dock that feels premium but stays out of the way.
3. User reads completed text in a drawer optimized for long-form output.
4. User understands **Voice Confidence** at a glance via the growth ring.
5. User with `prefers-reduced-motion` gets the same flows without stagger or slide.

## Technical constraints

- Workspace overrides live in `apps/web` (e.g. `data-surface="workspace"` on **App Shell**).
- Do not change `packages/ui/styles/theme.css` in ways that alter **Marketing Surface** rendering.
- Reuse `packages/ui` primitives where possible; add app-scoped components under `apps/web/src/components/ui/`.
- Motion: extend existing GSAP/CSS patterns; honor workspace motion tokens from ADR.

## Success metrics (qualitative)

- Workspace screens no longer use display serif or handwritten fonts.
- Generation, drawer, and voice dashboard are visually consistent (glass cards, moss/golden accents).
- Marketing pages pixel-unchanged aside from shared bundle size.
- QA checklist (issue 47) passes on desktop and mobile breakpoints.

## Dependencies

- Web v2 functional baseline (issues 27–38) shipped or in progress.
- ADR 0003 accepted.

## Out of scope / follow-ups

- Dark mode for workspace.
- Advanced shared-element transitions between routes.
- Illustration system for app empty states beyond minimal line SVG.
