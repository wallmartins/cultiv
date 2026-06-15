---
title: Marketing Hero and Page Shell Reorder
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-11
---

# Marketing Hero and Page Shell Reorder

## Parent

- `docs/live/prd/cultiv-product-showcase-restructure.md`
- `docs/live/prd/issue-product-showcase-restructure.md`

## User stories covered

1, 3, 4, 16, 34

## What to build

Replace the brand-first **Marketing Hero** with the value-forward hero and reorder the below-fold shell for the new **Product Showcase** narrative.

This vertical slice proves end-to-end that:

- the hero H1 is *Textos que soam como você.* (locale equivalent), not the Cultiv wordmark
- a fixed subheadline replaces the rotating slogan and tech chip
- primary `ButtonLink` joins the **Waitlist**; secondary editorial link targets `#problema`
- the handwritten note is removed from the hero (reserved for **Solution Breath**)
- H1 uses word-by-word reveal; subheadline and CTAs stagger on mount; botanical tree and falling leaves remain
- `prefers-reduced-motion` disables hero motion while keeping readable static content
- `BelowFoldSections` reserves placeholders or stubs for new section IDs in final order

## Acceptance criteria

- [ ] Hero renders new copy from message catalogs on `/` and `/en`.
- [ ] Scroll cue and `HeroRotatingSlogan` are not used in the hero.
- [ ] Both CTAs work with Lenis/hash navigation to `#waitlist` and `#problema`.
- [ ] Below-fold order matches: problem → solution breath → differentiators → use cases → flow → social proof → waitlist → FAQ (sections may stub until later issues).
- [ ] No visual regression to header height or full-viewport hero layout.

## Blocked by

- `09-buttonlink-and-header-cta.md`
- `10-message-catalogs-seo-geo.md`
