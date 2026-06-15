---
title: Design System and Web Scaffold
doc_type: issue
status: done
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-09
---

# Design System and Web Scaffold

## Parent

- `docs/live/prd/cultiv-marketing-surface-phase-1.md`

## User stories covered

22, 23

## What to build

Establish the shared **Design System** package and a runnable Cultiv web app scaffold so subsequent slices compose on a single visual and runtime foundation.

This vertical slice proves end-to-end that:

- the **Design System** exports semantic tokens (color, typography, spacing, motion), a Tailwind preset, and reusable primitives (Button, Text, Container, Input, Grid)
- pattern components needed by later slices exist: SectionHeader, Label, ComparisonCard, Accordion
- light theme ships with dark CSS variables prepared but not consumed in UI
- typography uses Fraunces (display) and Plus Jakarta Sans (body) aligned with **Brand Tone**
- palette uses editorial neutrals (off-white, warm gray, charcoal) — no legacy violet accent
- `apps/web` runs on TanStack Start with Tailwind wired to the **Design System** preset
- core dependencies are installed: Effect, GSAP, Lenis, Tailwind
- a minimal proof page renders **Design System** primitives so `pnpm dev` demonstrates the token stack visually

## Acceptance criteria

- [ ] The **Design System** package builds and exports tokens, primitives, and patterns from a single entry point.
- [ ] The web app scaffold starts in development and renders at least one page using **Design System** components and semantic colors.
- [ ] Dark theme CSS variables exist under a prepared class but no dark UI is productized.
- [ ] No inline CSS; styling flows through Tailwind and the shared preset.
- [ ] Workspace scripts allow developing the web app from the monorepo root.

## Blocked by

None — can start immediately.
