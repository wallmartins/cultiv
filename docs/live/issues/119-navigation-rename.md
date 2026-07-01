---
title: "Navigation Rename"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# Navigation Rename

## Parent

- `docs/landing-page-redesign/03-copy-e-textos.md`

## User stories covered

- Visitante navega na landing page sem confusão
- Nav items descrevem o que o visitante encontra, não metáforas

## What to build

Rename the marketing navigation items from cartography metaphors to plain language, and update the nav component to match.

This vertical slice proves end-to-end that:

- `apps/web/src/marketing/navigation/marketing-nav-items.ts` has updated href anchors matching new section IDs
- Header nav renders: "Como funciona" | "Preços" | "Perguntas" | "Diário de bordo" (PT) / "How it works" | "Pricing" | "Questions" | "Logbook" (EN)
- Footer nav groups use updated labels
- Hash navigation links (`#territorio`, `#rota`, etc.) are updated to new section IDs
- No broken anchor links

## Acceptance criteria

- [ ] Nav items use plain language, no metaphors
- [ ] All hash links point to valid section IDs
- [ ] Footer nav matches header nav items
- [ ] Both PT and EN locales render correct nav labels
- [ ] Mobile menu renders correct items
- [ ] No 404 or broken scroll targets

## Blocked by

- `117-landing-page-copy-pt-br.md`
