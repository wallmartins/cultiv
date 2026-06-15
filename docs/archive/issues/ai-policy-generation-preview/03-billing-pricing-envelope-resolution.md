---
title: Billing Pricing Envelope Resolution
doc_type: issue
status: completed
domain: billing
last_updated: 2026-05-21
---

# Billing Pricing Envelope Resolution

## Parent

- `docs/archive/prd/ai-policy-generation-preview.md`

## What to build

Build the slice that resolves a fixed commercial **Pricing Envelope** by
`planTier + qualityMode + contentType/pipeline`, honors frozen policy versions,
and supports `legacy-supported` behavior for customers already attached to an
older commercial contract.

This slice should prove the end-to-end behavior that:

- pricing is fixed per generation
- historical customer attachment to a versioned policy is respected
- the billing side can resolve the commercial price used by preview and
  execution later

Implementation guardrails:

- follow `software-engineering` and `effect-ts` guidelines
- keep pricing resolution small, explicit, and isolated from transport logic

## Acceptance criteria

- [x] The billing layer can resolve fixed commercial price by `planTier + qualityMode + contentType/pipeline`.
- [x] Frozen policy versions remain honored for existing customers, including `legacy-supported` behavior.
- [x] The resolved pricing contract is consumable by later preview and execution flows without duplicating billing logic.

## Blocked by

- `01-ai-policy-boot-loader-and-validation.md`
