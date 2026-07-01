---
title: "Interactive Demo: Section Integration"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# Interactive Demo: Section Integration

## Parent

- `docs/landing-page-redesign/01-hero-e-demo-interativo.md`

## User stories covered

- Visitante cola texto na landing page e vê métricas sem criar conta
- Visitante vê comparação entre seu texto e texto genérico do ChatGPT
- Visitante é direcionado para CTA após ver o demo

## What to build

Create the InteractiveDemoSection that combines the textarea, text analyzer, MetricsDisplay, and comparison into a full section. Integrate it into the page below the hero.

This vertical slice proves end-to-end that:

- `apps/web/src/marketing/sections/InteractiveDemoSection.tsx` renders:
  - Section title from message catalog: "Veja como você escreve" (or similar)
  - Textarea with localized placeholder
  - "Analisar meu texto" button
  - Loading state (300ms simulated delay)
  - MetricsDisplay with extracted metrics
  - Comparison block: user's text vs generic ChatGPT text
  - Final CTA: "Começar grátis"
- `BelowFoldSections.tsx` includes InteractiveDemoSection as the FIRST section after hero
- Section uses `CartographySurface` with proper background
- Textarea is accessible (label, aria-describedby for instructions)
- Comparison shows side-by-side on desktop, stacked on mobile
- Generic ChatGPT text is hardcoded: "Em um mundo cada vez mais acelerado, a produtividade é sobre trabalhar mais inteligente."
- Section is reachable from hero CTA via smooth scroll

## Acceptance criteria

- [ ] InteractiveDemoSection renders on both `/` and `/en`
- [ ] Textarea accepts multi-line text input
- [ ] Button is disabled when textarea is empty
- [ ] Clicking "Analisar" shows loading state for ~300ms
- [ ] After analysis, 6 metrics appear with stagger animation
- [ ] Comparison block shows user's text vs generic ChatGPT text
- [ ] Comparison shows metric differences (sentence length, formality, vocabulary)
- [ ] Final CTA "Começar grátis" links to signup
- [ ] Section is first below hero in BelowFoldSections
- [ ] Section has proper spacing from hero and next section
- [ ] Mobile layout is usable (textarea full-width, metrics 2-col, comparison stacked)
- [ ] No console errors
- [ ] Lighthouse accessibility score >90

## Blocked by

- `120-hero-section-rewrite.md`
- `122-interactive-demo-metrics-display.md`
- `117-landing-page-copy-pt-br.md`
