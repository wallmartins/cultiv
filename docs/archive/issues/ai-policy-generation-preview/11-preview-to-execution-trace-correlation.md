---
title: Preview To Execution Trace Correlation
doc_type: issue
status: completed
domain: ai-implementation
last_updated: 2026-05-16
---

# Preview To Execution Trace Correlation

## Parent

- `docs/archive/prd/ai-policy-generation-preview.md`

## What to build

Build the slice that correlates preview recommendation, `quoteId`, chosen
`qualityMode`, provider/model selection, and observed internal cost across
trace and telemetry.

This slice should prove the end-to-end behavior that:

- preview and execution decisions can be audited together
- recommendation divergence can be measured
- observed runtime cost can be compared with planned policy shape

Implementation guardrails:

- follow `software-engineering` and `effect-ts` guidelines
- treat trace and telemetry as external behavior, not incidental logging

## Acceptance criteria

- [x] Trace and telemetry can correlate preview recommendation, `quoteId`, and final chosen `qualityMode`.
- [x] Execution metadata records provider/model selection and observed internal cost in a way that supports tuning.
- [x] Recommendation divergence is captured analytically without changing user freedom of choice.

## Blocked by

- `05-quality-mode-recommendation-heuristics.md`
- `06-pricing-snapshot-and-quote-consistency.md`
- `08-execution-snapshot-contract-and-defensive-validation.md`
- `09-real-provider-transport-for-llm-steps.md`
