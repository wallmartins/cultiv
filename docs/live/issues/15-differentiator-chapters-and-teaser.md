---
title: Differentiator Chapters and LinkedIn Showcase Teaser
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-11
---

# Differentiator Chapters and LinkedIn Showcase Teaser

## Parent

- `docs/live/prd/cultiv-product-showcase-restructure.md`
- `docs/live/prd/issue-product-showcase-restructure.md`

## User stories covered

11, 12, 13, 14, 15, 16, 31, 32, 35

## What to build

Implement scroll-pinned **Differentiator Chapters** on desktop and the LinkedIn **Showcase Teaser** as chapter 1, with lighter chapters for teach-voice, guided briefing, and **Generation Preview** confidence.

This vertical slice proves end-to-end that:

- `useDifferentiatorChapters` pins a vertical stack on desktop with hierarchical scrub durations (long showcase chapter; shorter chapters 2–4)
- chapter 1 uses the showcase palette, waveform accent, and a compact generic-vs-voice LinkedIn comparison with short previews
- full **Showcase Sample** opens in the existing detail modal
- chapters 2–4 use lighter scale motion and **React scene components** (`TeachVoiceScene`, `BriefingScene`, `PreviewConfidenceScene`) — design refs in `visual-assets/svg/a04–a06`
- mobile degrades to stacked chapters with section reveal only—no pin
- `prefers-reduced-motion` disables pin, scale, and draw-driven chapter motion
- LinkedIn showcase content is shortened for teaser display while modal retains full sample

## Acceptance criteria

- [ ] `#diferenciais` section is reachable from primary nav.
- [ ] Desktop scroll focuses one chapter at a time without breaking Lenis or header sticky behavior.
- [ ] Teaser shows 2–3 sentences per column maximum on the home scroll.
- [ ] Modal opens/closes with keyboard support and focus management.
- [ ] Blog/thread samples are not required on the main horizontal scroll (may remain catalog-only).

## Blocked by

- `10-message-catalogs-seo-geo.md`
- `11-hero-and-page-shell.md`
- Visual assets A04–A06 approved — [`visual-assets/product-showcase-asset-bible.md`](../web-structure/visual-assets/product-showcase-asset-bible.md)
