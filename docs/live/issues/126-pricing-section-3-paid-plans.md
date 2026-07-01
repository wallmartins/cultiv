---
title: "Pricing Section (3 Paid Plans)"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# Pricing Section (3 Paid Plans)

## Parent

- `docs/landing-page-redesign/02-pricing.md`

## User stories covered

- Visitante vê 3 planos pagos e escolhe o que melhor se encaixa
- Visitante entende que o wizard é grátis e a geração é paga
- Visitante vê o preço sem procurar

## What to build

Rewrite the PricingSection to remove the free tier and display 3 paid plans: Explorador (R$49), Criador (R$99), Profissional (R$199). Update the pricing catalog and component.

This vertical slice proves end-to-end that:

- `marketing-plan-catalog.ts` has updated prices:
  - explorador: BRL monthly=49, annual=470; USD monthly=9, annual=86
  - criador: BRL monthly=99, annual=950; USD monthly=19, annual=182
  - profissional: BRL monthly=199, annual=1910; USD monthly=39, annual=374
- `PricingSection.tsx` renders exactly 3 plan cards (no free tier)
- Section title: "Crie seu perfil grátis. Pague quando quiser gerar."
- Explorador card: "Para começar" badge, R$49/mês, features list
- Criador card: "Mais popular" badge (terracotta highlight), R$99/mês, recommended=true
- Profissional card: "Para profissionais" badge, R$199/mês
- Currency toggle (BRL/USD) works with new prices
- Period toggle (Mensal/Anual) works with new prices
- Annual savings badge calculates correctly (~20%)
- CTA for each plan: "Assinar"
- No "Começar grátis" or "Start free" CTA in pricing section

## Acceptance criteria

- [ ] Exactly 3 plan cards render (no free tier)
- [ ] Explorador price is R$49/mês (BRL) or $9/mo (USD)
- [ ] Criador price is R$99/mês (BRL) or $19/mo (USD)
- [ ] Profissional price is R$199/mês (BRL) or $39/mo (USD)
- [ ] Criador card has "Mais popular" badge and visual emphasis
- [ ] Annual pricing shows ~20% savings badge
- [ ] Currency toggle switches between BRL and USD correctly
- [ ] Period toggle switches between monthly and annual correctly
- [ ] Each plan has ≥4 features listed
- [ ] CTA button says "Assinar" for all plans
- [ ] No "Start free" or "Começar grátis" CTA in this section
- [ ] Section title includes "grátis" (referring to wizard, not plan)
- [ ] No TypeScript errors

## Blocked by

- `117-landing-page-copy-pt-br.md`
