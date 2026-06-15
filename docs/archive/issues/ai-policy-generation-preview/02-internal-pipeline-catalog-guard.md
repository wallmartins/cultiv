---
title: Internal Pipeline Catalog Guard
doc_type: issue
status: completed
domain: ai-implementation
last_updated: 2026-05-21
---

# Internal Pipeline Catalog Guard

## Parent

- `docs/archive/prd/ai-policy-generation-preview.md`

## What to build

Build the slice that keeps **Pipelines** internal and policy-governed by making
internal pipeline resolution validate against the active AI policy catalog,
declaring **Step Execution** explicitly, and supporting structured local-to-LLM
override rules for allowed exceptions.

This slice should prove the end-to-end behavior that:

- unknown steps are rejected before execution
- internal pipeline definitions can declare `local` versus `llm` step behavior
- local-to-LLM exceptions can be described with structured override metadata
- the system keeps public clients away from arbitrary pipeline shape

Implementation guardrails:

- follow `software-engineering` and `effect-ts` guidelines
- keep policy resolution and execution concerns separate
- avoid large god-files by extracting focused policy and pipeline modules

## Acceptance criteria

- [x] Internal pipeline resolution rejects steps that are not compatible with the active policy catalog.
- [x] Step definitions can express explicit `Step Execution` semantics for `local` and `llm`.
- [x] Structured local-to-LLM overrides are supported for allowed exceptions without reopening public pipeline control.

## Blocked by

- `01-ai-policy-boot-loader-and-validation.md`
