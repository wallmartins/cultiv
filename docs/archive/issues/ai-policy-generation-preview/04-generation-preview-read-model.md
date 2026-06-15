---
title: Generation Preview Read Model
doc_type: issue
status: completed
domain: ai-implementation
last_updated: 2026-05-21
---

# Generation Preview Read Model

## Parent

- `docs/archive/prd/ai-policy-generation-preview.md`

## What to build

Build the first product-facing **Generation Preview** slice that returns the
allowed **Content Type** and **quality mode** options for the current user,
along with fixed credit price, current balance, and projected balance impact.

This slice should prove the end-to-end behavior that:

- preview is a product-layer read model
- preview is informative only and does not reserve credits
- pricing and balance impact can be shown before generation

Implementation guardrails:

- follow `software-engineering` and `effect-ts` guidelines
- keep preview orchestration in product, not in execution
- prefer small composing modules over a monolithic preview service

## Acceptance criteria

- [x] The backend can return a product-facing preview containing allowed options, fixed credit price, current balance, and projected balance after generation.
- [x] Preview stays informative only and does not create a reservation side effect.
- [x] The preview flow composes entitlement, balance, and pricing resolution without exposing internal pipeline structure.

## Blocked by

- `01-ai-policy-boot-loader-and-validation.md`
- `03-billing-pricing-envelope-resolution.md`
