---
title: Experimental Catalog And Guarded Debug Flow
doc_type: issue
status: completed
domain: ai-implementation
last_updated: 2026-05-24
---

# Experimental Catalog And Guarded Debug Flow

## Parent

- `docs/archive/prd/ai-policy-generation-preview.md`

## What to build

Build the slice that supports a separate experimental AI policy catalog and a
guarded internal debug flow for explicit pipeline experimentation with simulated
credits by default.

This slice should prove the end-to-end behavior that:

- experimental policy/catalog is separate from official policy
- internal explicit pipeline experimentation is not public
- access is gated by role, environment, and feature flag
- experimental runs still capture normal provider and cost telemetry

Implementation guardrails:

- follow `software-engineering` and `effect-ts` guidelines
- keep experimental and official policy boundaries explicit and hard to bypass

## Acceptance criteria

- [x] Experimental policy and pipeline definitions are separated from official policy loading and public product flow.
- [x] Internal experimental execution is guarded by role, environment, and feature flag rather than public access.
- [x] Experimental runs use simulated credits by default while still recording normal provider and internal cost telemetry.

## Blocked by

- `01-ai-policy-boot-loader-and-validation.md`
- `02-internal-pipeline-catalog-guard.md`
- `08-execution-snapshot-contract-and-defensive-validation.md`
- `09-real-provider-transport-for-llm-steps.md`
