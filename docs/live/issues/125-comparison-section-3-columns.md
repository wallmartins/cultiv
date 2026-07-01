---
title: "Comparison Section (3 Columns)"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# Comparison Section (3 Columns)

## Parent

- `docs/landing-page-redesign/03-copy-e-textos.md`

## User stories covered

- Visitante compara Cultiv com alternativas e entende a diferença
- Visitante vê que trabalho manual é lento e ChatGPT é genérico

## What to build

Expand the ComparisonSection from 2 columns (ChatGPT vs Cultiv) to 3 columns (ChatGPT vs Cultiv vs Trabalho manual). Update the comparison data structure and component layout.

This vertical slice proves end-to-end that:

- `ComparisonSection.tsx` renders a 3-column comparison table
- Columns: "ChatGPT (seu prompt)" | "Cultiv (sua voz)" | "Trabalho manual"
- 6 rows of comparison data from message catalog:
  1. "Aprende como você escreve" — Não | Sim, com métricas | Sim, mas lento
  2. "Gera texto em 30 segundos" — Sim | Sim | Não
  3. "Memoriza sua voz entre sessões" — Não | Sim | Sim
  4. "Mostra como você escreve" — Não | Sim (14 métricas) | Não
  5. "Custo por geração" — Grátis | R$2,48 (Criador) | Horas do seu tempo
  6. "Texto é seu ou genérico?" — Genérico | Seu | Seu
- Verdict text renders below table
- "Tecnologia de ponta, feita com alma de artesão" signature is REMOVED
- Table is responsive: 3 columns on desktop, card layout on mobile
- Cultiv column is visually highlighted (slightly different background or border)

## Acceptance criteria

- [ ] Comparison table has 3 columns, not 2
- [ ] All 6 rows render with correct data
- [ ] Column headers match message catalog
- [ ] Cultiv column has visual emphasis (background, border, or highlight)
- [ ] Verdict text renders below table
- [ ] Signature line ("Tecnologia de ponta...") is not rendered
- [ ] Desktop: table layout with 3 equal columns
- [ ] Mobile: cards or stacked layout (not overflowing)
- [ ] Table is accessible (proper th/td or role attributes)
- [ ] Section reveal animation works

## Blocked by

- `117-landing-page-copy-pt-br.md`
