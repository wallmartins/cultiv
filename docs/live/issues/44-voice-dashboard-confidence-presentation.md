---
title: Voice Dashboard Confidence Presentation
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-14
---

# Voice dashboard confidence presentation

## Parent

- [`issue-workspace-visual-refresh.md`](../prd/issue-workspace-visual-refresh.md)

## What to build

Implement **Voice Confidence Presentation** on **Voice Dashboard**: a circular growth ring with moss-to-golden fill by confidence level, paired with the existing textual label and description.

This vertical slice delivers:

- reusable `VoiceConfidenceRing` (or equivalent) mapping `none` / `low` / `medium` / `high` to ring progress and gradient
- one-time load animation (~600ms stroke fill) unless `prefers-reduced-motion`
- diagnostics and format coverage cards restyled with `AppCard` glass grid
- pending rebuild / error banners aligned to workspace alert styling (golden warm / red semantic)
- empty and error states use workspace sans typography

No changes to voice SDK calls or profile data shape.

## Acceptance criteria

- [ ] **Voice Confidence** shows ring + label for ready profiles; empty state unchanged functionally.
- [ ] Ring fill reflects confidence tier; golden emphasis increases with higher confidence.
- [ ] Dashboard cards use workspace glass styling consistently.
- [ ] No Playfair/Caveat on `/app/voice`.
- [ ] Reduced motion: ring renders final state without stroke animation.

## Blocked by

- [40-workspace-ui-primitives.md](./40-workspace-ui-primitives.md)
