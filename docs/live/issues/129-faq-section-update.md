---
title: "FAQ Section Update"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# FAQ Section Update

## Parent

- `docs/landing-page-redesign/03-copy-e-textos.md`

## User stories covered

- Visitante tira dúvidas sobre pricing, wizard, e privacidade
- Visitante entende que o wizard é grátis e a geração é paga

## What to build

Update the FAQ section with 6 new questions and answers that address the new pricing model and wizard flow.

This vertical slice proves end-to-end that:

- `faq.items` in message catalogs has exactly 6 items (up from 5)
- New FAQ items:
  1. "O Cultiv substitui meu estilo de escrita?" — preserves existing answer
  2. "Como a IA aprende minha voz?" — updated with wizard + 14 metrics explanation
  3. "Posso usar sem pagar?" — NEW: wizard is free, generation requires plan
  4. "E se eu precisar de mais gerações no mês?" — NEW: overage pricing
  5. "Meus dados estão seguros?" — preserves existing answer
  6. "Quanto tempo leva para criar o perfil?" — NEW: 10-15 minutes
- `FaqSection.tsx` renders all 6 items in accordion
- Accordion works correctly (expand/collapse)
- Section layout unchanged (centered, max-width 2xl)

## Acceptance criteria

- [ ] FAQ has exactly 6 items
- [ ] Each item has: id, question, answer
- [ ] Question 3 answers "Posso usar sem pagar?" with wizard-free explanation
- [ ] Question 4 answers overage pricing question with specific R$ amounts
- [ ] Question 6 answers time-to-profile question (10-15 min)
- [ ] Accordion expand/collapse works
- [ ] All text renders correctly on both locales
- [ ] No TypeScript errors

## Blocked by

- `117-landing-page-copy-pt-br.md`
