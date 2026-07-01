---
title: "OG Image Creation"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# OG Image Creation

## Parent

- `docs/landing-page-redesign/04-seo-e-og-image.md`

## User stories covered

- Visitante vê uma preview atraente quando compartilha o link em redes sociais
- Visitante clica no link depois de ver a OG image

## What to build

Create a new OG image that works as a YouTube thumbnail: high contrast, readable on mobile, shows the product outcome, and generates curiosity.

This vertical slice proves end-to-end that:

- New OG image file created at `apps/web/public/og-cartography.png`
- Image dimensions: 1200×630px
- Image contains:
  - Split-screen: generic AI output (left) vs Cultiv output (right)
  - Headline text: "Seu texto ainda soa como ChatGPT?"
  - Subtext: "Cole 5 textos. Veja suas métricas. Gere como você."
  - Cultiv logo (bottom-left, 40px)
- Image uses Cultiv Cartography colors:
  - Background: #FFFBF5 (cream)
  - Text: #1A2E3C (deep-blue)
  - Accent: #C75B39 (terracotta)
- `og-image.ts` updated to reference new image path
- `brand/assets.ts` updated if path changes
- Image is legible at 300×157px (mobile preview size)

## Acceptance criteria

- [ ] OG image file exists at expected path
- [ ] Image is 1200×630px
- [ ] Image contains split-screen comparison
- [ ] Headline text is readable at small sizes
- [ ] Cultiv logo is visible
- [ ] Colors match Cultiv Cartography palette
- [ ] `og-image.ts` references correct file
- [ ] Facebook OG test shows correct image
- [ ] Twitter Card test shows correct image
- [ ] WhatsApp preview shows correct image
- [ ] Image file size is <500KB

## Blocked by

- `117-landing-page-copy-pt-br.md` (copy decisions inform the image text)
