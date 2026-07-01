---
title: "Interactive Demo: Metrics Display Component"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# Interactive Demo: Metrics Display Component

## Parent

- `docs/landing-page-redesign/01-hero-e-demo-interativo.md`

## User stories covered

- Visitante vê suas métricas de escrita de forma visual e compreensível
- Visitante entende o que cada métrica significa sem jargão técnico

## What to build

Create the MetricsDisplay React component that renders 6 writing metrics in a grid layout with stagger animations. This component receives metrics data from the text analyzer and presents it visually.

This vertical slice proves end-to-end that:

- `apps/web/src/marketing/components/MetricsDisplay.tsx` accepts `{ metrics: DeterministicMetrics, animated?: boolean }` props
- Renders 6 metric cards in a responsive grid:
  - Desktop: 3×2 grid
  - Mobile: 2×3 grid
- Each card shows:
  - Metric name (localized: "Ritmo", "Formalidade", etc.)
  - Numeric value (formatted: "18.3" for sentence length, "0.62" for 0-1 scores)
  - Qualitative label (localized: "palavras por frase", "moderado", "rico", "leve", "profunda", "moderada")
- Stagger animation: cards appear with 100ms delay between each (fade + slide-up)
- Animation respects `prefers-reduced-motion`
- Uses Cultiv Cartography tokens (cream background, dotted borders, terracotta accents)
- Cards use `border-dotted-cartography` and `shadow-cartography`

## Acceptance criteria

- [ ] Component renders 6 metric cards
- [ ] Desktop layout is 3-column grid
- [ ] Mobile layout is 2-column grid
- [ ] Each card has: label, value, qualitative description
- [ ] Stagger animation fires on mount (100ms delay between cards)
- [ ] `prefers-reduced-motion` disables animation (opacity-only transition)
- [ ] Cards use Cartography design tokens (cream, dotted borders, terracotta)
- [ ] Metric values are formatted correctly (1 decimal for numbers, text for certainty)
- [ ] Component is accessible (aria-label on each card)
- [ ] Storybook story renders component with sample data

## Blocked by

- `121-interactive-demo-text-analyzer.md`
