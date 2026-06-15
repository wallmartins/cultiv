---
title: Motion System and Accessibility
doc_type: issue
status: done
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-09
---

# Motion System and Accessibility

## Parent

- `docs/live/prd/cultiv-marketing-surface-phase-1.md`

## User stories covered

4, 16, 28

## What to build

Add the **Motion System** to the **Product Showcase** with premium but discrete animation and mandatory reduced-motion support.

This vertical slice proves end-to-end that:

- Lenis provides smooth scrolling integrated with GSAP ScrollTrigger via scroller proxy
- global motion defaults follow **Brand Tone** (no bounce, elastic, or aggressive parallax)
- section fade-up runs on viewport entry for editorial sections
- stagger animates **Showcase Sample** cards sequentially
- hover microinteractions apply to buttons and text links
- `prefers-reduced-motion: reduce` disables Lenis and kills active GSAP tweens
- ScrollTrigger refreshes after font load

Motion defaults:

```typescript
const MOTION = {
  reveal: { duration: 0.8, y: 40, ease: "power2.out" },
  hover: { duration: 0.2, y: -2, ease: "power2.out" },
  stagger: 0.15,
} as const
```

## Acceptance criteria

- [x] Smooth scroll is active on the showcase page when reduced motion is not requested.
- [x] Editorial sections reveal on scroll; showcase cards stagger into view.
- [x] With `prefers-reduced-motion: reduce`, Lenis is off and no scroll-driven animation runs.
- [x] Hover states on **Design System** buttons and footer/header links feel subtle and fast.
- [x] No bounce, elastic, or parallax effects ship in this slice.
- [x] Waitlist form fields are not animated (stable focus for accessibility).

## Blocked by

- `03-editorial-sections-and-i18n.md`
- `04-showcase-samples-catalog.md`
