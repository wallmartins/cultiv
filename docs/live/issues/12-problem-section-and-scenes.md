---
title: Problem Section and Typographic Scenes
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-11
---

# Problem Section and Typographic Scenes

## Parent

- `docs/live/prd/cultiv-product-showcase-restructure.md`
- `docs/live/prd/issue-product-showcase-restructure.md`

## User stories covered

5, 6, 7, 38, 40

## What to build

Ship the **Problem Perspectives** section with two editorial rows and typographic visual scenes—no stock photography.

This vertical slice proves end-to-end that:

- two **Problem Perspectives** render with titles and short bodies reinforcing the **Marketing Problem Angle** (generic AI tone; fragile voice prompts)
- desktop layout alternates text and visual columns per row
- mobile layout stacks **Problem Perspective Visual** above copy
- `GenericOutputStack` and `FragilePromptCollage` are **React scene components** (inline SVG + tokens), not static images — design refs in `visual-assets/svg/a01–a02`
- section uses warm paper surface, `editorial-frame` material, and sparse `FallingLeavesLayer` background only
- section is reachable from hero secondary CTA and primary nav (`#problema`)

## Acceptance criteria

- [ ] `#problema` section renders on both locales with catalog copy.
- [ ] Visual scenes are decorative (`aria-hidden`) with meaningful text in the copy column.
- [ ] Alternating layout inverts correctly on the second row for desktop.
- [ ] Mobile order is visual-first, then text, for both perspectives.
- [ ] Section reveal animation runs unless reduced motion is requested.

## Blocked by

- `10-message-catalogs-seo-geo.md`
- `11-hero-and-page-shell.md`
- Visual assets A01–A02 approved — [`visual-assets/product-showcase-asset-bible.md`](../web-structure/visual-assets/product-showcase-asset-bible.md)
