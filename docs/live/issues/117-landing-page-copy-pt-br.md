---
title: "Landing Page Copy Rewrite (pt-BR)"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: HITL
last_updated: 2026-06-30
---

# Landing Page Copy Rewrite (pt-BR)

## Parent

- `docs/landing-page-redesign/00-visao-geral.md`
- `docs/landing-page-redesign/03-copy-e-textos.md`

## User stories covered

- Visitante entende o produto em segundos
- Visitante vê o preço sem procurar
- Visitante lê copy que soa como fundador, não como SaaS genérico

## What to build

Rewrite ALL Portuguese copy in the marketing message catalogs. This is the foundation for every subsequent landing page issue — components read from these catalogs.

This vertical slice proves end-to-end that:

- `apps/web/src/i18n/marketing/locales/pt.ts` contains updated copy for every section: header, hero, territory, route, tools, comparison, testimonial, pricing, faq, launchCta, footer, seo
- Navigation items renamed: "O território" → "Como funciona", "A rota" → removed (merged into "Como funciona"), "Ferramentas" → removed (merged), "Planos" → "Preços", "Perguntas" stays
- Hero copy updated: headline "Cole 5 textos seus. Veja como você realmente escreve.", subheadline with metrics mention, CTA "Começar grátis", microcopy with pricing
- Territory/problem section: title "Todo mundo está publicando o mesmo texto." with 3 cards using customer language
- Route/how-it-works section: title "Em 5 passos, sua escrita vira perfil de voz" with concrete steps
- Comparison section: 3-column table (ChatGPT / Cultiv / Trabalho manual)
- Pricing section: title "Crie seu perfil grátis. Pague quando quiser gerar." with 3 paid plans (Explorador R$49, Criador R$99, Profissional R$199)
- Testimonial section: 3 placeholder testimonials with structure for name, role, quote
- FAQ section: 6 questions with concrete answers including pricing and wizard details
- Launch CTA: "Cole seus textos. Veja como você escreve. Gere com sua assinatura."
- Footer: "Seu texto deveria ter suas coordenadas, não as do ChatGPT." + share prompt
- SEO: homeTitle and homeDescription updated with metrics-focused copy

## Acceptance criteria

- [ ] Every section in `pt.ts` has updated copy matching the specs in `03-copy-e-textos.md`
- [ ] Navigation items are renamed to plain language (no metaphors in nav)
- [ ] Hero headline is ≤10 words and contains a number
- [ ] Hero has no secondary CTA (single CTA only)
- [ ] Pricing section title includes the word "grátis" to communicate free wizard
- [ ] All 3 pricing plan objects have: name, badge, description, features array, footer text
- [ ] FAQ has exactly 6 items with question + answer
- [ ] Footer has description + sharePrompt field
- [ ] SEO section has homeTitle and homeDescription ≤160 chars
- [ ] No TypeScript errors in the locale file
- [ ] Copy uses customer language, not corporate SaaS language

## Blocked by

None — can start immediately.
