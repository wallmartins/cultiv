---
title: Product-Oriented Public Generation Command
doc_type: issue
status: completed
domain: ai-implementation
last_updated: 2026-05-22
---

# Product-Oriented Public Generation Command

## Parent

- `docs/archive/prd/ai-policy-generation-preview.md`

## What to build

Build the slice that moves the public generation flow to a product-oriented
command centered on **Generation Request** semantics instead of explicit public
pipeline control.

This slice should prove the end-to-end behavior that:

- public generation can be triggered without exposing internal pipeline shape
- product orchestration owns entitlement checks and quote consistency
- execution is treated as an internal runtime boundary

Implementation guardrails:

- follow `software-engineering` and `effect-ts` guidelines
- keep public command shaping and execution runtime responsibilities separate

## Acceptance criteria

- [x] Public generation can be expressed as a product request without requiring explicit pipeline definitions from the client.
- [x] Product orchestration owns request normalization, entitlement checks, and quote consistency before calling execution.
- [x] The public contract no longer relies on arbitrary client-supplied pipeline structure for the main generation path.

## Blocked by

- `02-internal-pipeline-catalog-guard.md`
- `04-generation-preview-read-model.md`
- `06-pricing-snapshot-and-quote-consistency.md`
