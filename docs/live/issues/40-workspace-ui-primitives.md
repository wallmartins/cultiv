---
title: Workspace UI Primitives
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-14
---

# Workspace UI primitives

## Parent

- [`issue-workspace-visual-refresh.md`](../prd/issue-workspace-visual-refresh.md)

## What to build

Introduce app-scoped UI primitives under `apps/web` that embody **Workspace Surface Language** — soft glass cards, solid readable fields, segmented controls with sliding pill, and warm skeleton loaders.

This vertical slice delivers reusable components:

- **AppCard** — glass panel with warm shadow, medium radius, optional hover lift
- **AppField** — label, control slot, hint/error; solid field background (not glass-on-glass)
- **AppSegmentedControl** — single-select options with animated pill (pattern aligned with nav dock)
- **AppSkeleton** — warm shimmer placeholder for loading states

Primitives compose from `@my-ai-orchestrator/ui` where possible (`cn`, `Text`) and consume workspace tokens from issue 39.

A minimal internal usage proof (e.g. story-style demo route or temporary dev section) demonstrates all four components in one workspace page without wiring full product flows.

## Acceptance criteria

- [ ] `AppCard`, `AppField`, `AppSegmentedControl`, and `AppSkeleton` exported from `apps/web/src/components/ui/`.
- [ ] `AppField` supports text input and textarea variants with accessible labels.
- [ ] `AppSegmentedControl` moves pill on selection change with workspace easing; respects reduced motion.
- [ ] Components use moss focus rings and golden only where semantically appropriate (not decorative).
- [ ] No Playfair/Caveat classes in primitive source.

## Blocked by

- [39-workspace-tokens-and-motion-foundation.md](./39-workspace-tokens-and-motion-foundation.md)
