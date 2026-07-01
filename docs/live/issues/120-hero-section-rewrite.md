---
title: "Hero Section Rewrite"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# Hero Section Rewrite

## Parent

- `docs/landing-page-redesign/01-hero-e-demo-interativo.md`

## User stories covered

- Visitante entende o produto em 5 segundos
- Visitante vê o CTA e sabe o que acontece ao clicar
- Visitante vê o preço antes de scrollar

## What to build

Rewrite the HeroSection component to use the new copy, remove the secondary CTA, remove the static HeroComparisonFrame, and add the pricing microcopy below the primary CTA.

This vertical slice proves end-to-end that:

- `HeroSection.tsx` renders the new headline from `hero.headline` in the message catalog
- `HeroComparisonFrame` is removed from the hero (moved to demo section or removed entirely)
- Only ONE CTA renders: the primary CTA from `hero.ctaPrimary`
- The secondary CTA button (`hero.ctaSecondary` / "Ver planos") is removed
- Microcopy text renders below the CTA (new field or inline)
- Hero maintains full-viewport height on desktop
- Hero maintains readable layout on mobile
- Word-by-word headline animation still works with new headline
- Section reveal animations still fire on scroll
- `prefers-reduced-motion` still disables animations

## Acceptance criteria

- [ ] Hero headline renders from message catalog, not hardcoded
- [ ] Only one CTA button is visible (primary)
- [ ] No secondary CTA button or "Ver planos" link
- [ ] Microcopy with pricing info renders below CTA
- [ ] HeroComparisonFrame is not rendered in hero
- [ ] Hero is full-viewport height on desktop (min-h-hero-viewport)
- [ ] Hero is readable on mobile (no horizontal overflow)
- [ ] Word-by-word animation works with new headline text
- [ ] Reduced motion preference is respected
- [ ] No visual regression to header spacing

## Blocked by

- `117-landing-page-copy-pt-br.md`
- `119-navigation-rename.md`
