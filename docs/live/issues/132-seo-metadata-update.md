---
title: "SEO Metadata Update"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# SEO Metadata Update

## Parent

- `docs/landing-page-redesign/04-seo-e-og-image.md`

## User stories covered

- Visitante encontra a landing page via busca orgânica
- Visitante vê título e descrição relevantes nos resultados de busca

## What to build

Update all SEO metadata to reflect the new positioning: metrics-focused, specific, and action-oriented.

This vertical slice proves end-to-end that:

- `resolve-page-head.ts` returns updated title and description
- `resolve-page-seo.ts` returns updated meta tags
- `json-ld.ts` returns updated structured data with new pricing
- PT title: "Cultiv — Cole seus textos. Veja como você escreve. Gere com sua assinatura."
- PT description: "Cultiv extrai 14 métricas da sua escrita e gera textos com sua assinatura..."
- EN title: "Cultiv — Paste your texts. See how you write. Generate with your signature."
- EN description: "Cultiv extracts 14 metrics from your writing and generates text with your signature..."
- JSON-LD offers updated with new prices (49/99/199 BRL)
- hreflang tags correctly link PT and EN versions
- Meta descriptions ≤160 characters
- OG image meta tag points to new image

## Acceptance criteria

- [ ] Page title ≤60 characters
- [ ] Meta description ≤160 characters
- [ ] PT and EN titles are localized, not translated
- [ ] JSON-LD includes 3 offers with correct prices
- [ ] hreflang links are bidirectional (PT→EN, EN→PT)
- [ ] OG image meta tag references new image
- [ ] Google Rich Results test passes
- [ ] `robots.txt` allows crawling
- [ ] Sitemap includes both locales

## Blocked by

- `117-landing-page-copy-pt-br.md`
- `131-og-image-creation.md`
