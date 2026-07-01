---
title: "Pricing Catalog Backend Update"
doc_type: issue
status: ready-for-agent
domain: payments
slice_type: AFK
last_updated: 2026-06-30
---

# Pricing Catalog Backend Update

## Parent

- `docs/landing-page-redesign/02-pricing.md`

## User stories covered

- Usuário vê preços corretos ao assinar
- Sistema cobra o valor correto por plano

## What to build

Update the backend payment/billing plan catalog to match the new pricing structure. This ensures the checkout flow charges the correct amounts.

This vertical slice proves end-to-end that:

- `packages/payments/src/` plan definitions match:
  - Free tier is REMOVED (or converted to "wizard only" with 0 generations)
  - Explorador: R$49/month, 10 generations, R$5.00 overage
  - Criador: R$99/month, 40 generations, R$3.50 overage
  - Profissional: R$199/month, 120 generations, R$2.50 overage
- Plan IDs are consistent between frontend catalog and backend
- Checkout flow charges correct amount per plan
- Generation quota limits are enforced per plan
- Overage pricing is correct per plan

## Acceptance criteria

- [ ] Backend plan definitions match frontend `marketing-plan-catalog.ts`
- [ ] Free plan removed or converted to wizard-only (0 generation quota)
- [ ] Explorador: R$49/month, 10 generations/month
- [ ] Criador: R$99/month, 40 generations/month
- [ ] Profissional: R$199/month, 120 generations/month
- [ ] Overage prices: R$5.00 / R$3.50 / R$2.50 respectively
- [ ] Checkout creates subscription with correct price
- [ ] Generation quota is enforced (blocks generation at limit)
- [ ] Annual pricing works correctly
- [ ] USD pricing works correctly
- [ ] No existing tests break

## Blocked by

- `117-landing-page-copy-pt-br.md` (copy defines the pricing decisions)
