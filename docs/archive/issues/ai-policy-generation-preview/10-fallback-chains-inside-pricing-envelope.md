---
title: Fallback Chains Inside Pricing Envelope
doc_type: issue
status: completed
domain: ai-implementation
last_updated: 2026-05-16
---

# Fallback Chains Inside Pricing Envelope

## Parent

- `docs/archive/prd/ai-policy-generation-preview.md`

## What to build

Build the slice that adds ordered provider/model fallback chains for `llm`
steps, including controlled downgrade behavior that remains inside the same
commercial **Pricing Envelope**.

This slice should prove the end-to-end behavior that:

- fallback is automatic when the preferred provider/model fails
- fallback stays inside the same commercial promise
- the chosen fallback path is observable for audit and tuning

Implementation guardrails:

- follow `software-engineering` and `effect-ts` guidelines
- keep fallback policy explicit and isolated from route logic

## Acceptance criteria

- [x] LLM steps can follow an ordered fallback chain when the preferred attempt fails.
- [x] Fallback behavior stays inside the same commercial pricing envelope, including controlled downgrade rules.
- [x] Execution traces can show which preferred attempt or fallback path was actually used.

## Blocked by

- `08-execution-snapshot-contract-and-defensive-validation.md`
- `09-real-provider-transport-for-llm-steps.md`
