---
title: "Footer Rewrite"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# Footer Rewrite

## Parent

- `docs/landing-page-redesign/03-copy-e-textos.md`

## User stories covered

- Visitante vê uma frase memorável antes de sair da página
- Visitante tem incentivo para compartilhar a página

## What to build

Update the footer with a memorable closing line and share prompt. Replace generic description with a bold belief statement.

This vertical slice proves end-to-end that:

- Footer description text is: "Seu texto deveria ter suas coordenadas, não as do ChatGPT." (PT) / "Your text should have your coordinates, not ChatGPT's." (EN)
- Footer signature text is: "Cultiv" (simplified from "Feito à mão com IA, Cultiv")
- Footer seal text is: "Feito com métricas e IA" (PT) / "Built with metrics and AI" (EN)
- Share prompt renders: "Compartilhe com o criador que ainda copia e cola do ChatGPT." (PT) / "Share with the creator still copying and pasting from ChatGPT." (EN)
- Footer layout remains unchanged (3-column grid)
- All footer links still work (privacy, terms, nav items, blog)
- Locale toggle still works

## Acceptance criteria

- [ ] Footer description is the bold belief statement
- [ ] Footer signature is simplified to brand name only
- [ ] Footer seal mentions "métricas" (not just "IA")
- [ ] Share prompt renders below the description
- [ ] Share prompt uses customer language ("criador que ainda copia e cola")
- [ ] All footer links work (privacy, terms, nav, blog)
- [ ] Locale toggle works in footer
- [ ] Footer is accessible (proper nav, link labels)
- [ ] Both PT and EN render correctly

## Blocked by

- `117-landing-page-copy-pt-br.md`
