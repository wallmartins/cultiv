---
title: "Problem Section Rewrite"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# Problem Section Rewrite

## Parent

- `docs/landing-page-redesign/03-copy-e-textos.md`

## User stories covered

- Visitante se identifica com os problemas antes de ver a solução
- Visitante lê copy que soa como cliente real, não como SaaS

## What to build

Update the ProblemSection component to use the new copy from the message catalogs. The section title, eyebrow, and card content all change.

This vertical slice proves end-to-end that:

- Section eyebrow renders "O problema" (PT) / "The problem" (EN)
- Section title renders "Todo mundo está publicando o mesmo texto." (PT) / "Everyone is publishing the same text." (EN)
- Card 1: "Seu texto saiu do mesmo prompt" / "Your text came from the same prompt"
- Card 2: "Você copia e reescreve tudo" / "You copy and rewrite everything"
- Card 3: "Cada conversa, zero memória" / "Every conversation, zero memory"
- Card body text uses customer language, not corporate SaaS language
- Section layout remains 3-column grid on desktop, stacked on mobile
- Icons still render (UserRoundX, RefreshCwOff, Blend)
- Section reveal animation still works

## Acceptance criteria

- [ ] Eyebrow text is "O problema" (PT) / "The problem" (EN)
- [ ] Section title is "Todo mundo está publicando o mesmo texto." (PT equivalent)
- [ ] All 3 cards render with new titles and body text
- [ ] Card titles are ≤6 words
- [ ] Card body text is ≤30 words
- [ ] Icons render correctly for each card
- [ ] Section maintains existing layout (3-col desktop, stacked mobile)
- [ ] Section reveal animation works
- [ ] No TypeScript errors
- [ ] Copy sounds like a real customer complaint, not marketing fluff

## Blocked by

- `117-landing-page-copy-pt-br.md`
