---
title: Real Provider Transport For LLM Steps
doc_type: issue
status: completed
domain: ai-implementation
last_updated: 2026-05-16
---

# Real Provider Transport For LLM Steps

## Parent

- `docs/archive/prd/ai-policy-generation-preview.md`

## What to build

Build the slice that replaces the synthetic transport in the shared runtime
with real provider transport for steps whose **Step Execution** is `llm`.

This slice should prove the end-to-end behavior that:

- `llm` steps actually reach a provider
- `local` steps do not call providers
- both **Sync Run** and **Async Run** reuse the same real transport path

Implementation guardrails:

- follow `software-engineering` and `effect-ts` guidelines
- keep transport and provider normalization isolated from product orchestration

## Acceptance criteria

- [x] Steps marked as `llm` reach a real provider transport instead of synthetic output.
- [x] Steps marked as `local` remain provider-free while still participating in the shared runtime.
- [x] Sync and async generation paths both exercise the same real transport behavior.

## Blocked by

- `08-execution-snapshot-contract-and-defensive-validation.md`
