---
title: AI Roadmap
doc_type: plan
status: active
domain: ai-implementation
last_updated: 2026-05-16
---

# AI Roadmap

## Purpose

This is the short execution roadmap for the current AI implementation.
It is derived from the implementation index and keeps the next steps visible
without rereading the longer planning docs.

## Status summary

- Voice, content types, sync/async execution, quality lanes, and the backend product surface are in place.
- Billing policy versioning and credit reservation are defined and tracked.
- The remaining work is AI policy resolution, public preview/quote flow,
  provider/model routing, and real LLM transport.

## Checkpoints

### Checkpoint 1: Commercial policy contract

Goal:
- make `packages/payments` the explicit source of truth for credit policy
- keep `planTier + qualityMode + contentType/pipeline` as the billing axis
- preserve `policyVersion` and auditability

Dependencies:
- none

Success criteria:
- plan policy types are explicit
- versioned plans are seeded and persisted
- old policy versions remain queryable

Related docs:
- `docs/archive/plans/billing-model-implementation-plan.md`
- `docs/archive/issues/billing-model-issues.md`

### Checkpoint 2: AI policy and product-facing preview

Goal:
- resolve versioned AI policy in the product layer
- keep pipelines internal to the backend
- expose a public generation preview / pricing snapshot flow

Dependencies:
- Checkpoint 1

Success criteria:
- `AIPolicyService` resolves versioned policy files at boot
- public clients do not send pipelines or arbitrary steps
- preview returns allowed options, credit price, projected balance, and `quoteId`

Related docs:
- `docs/archive/policies/ai-policy-operational.md`
- `docs/archive/issues/ai-implementation-issues.md`

### Checkpoint 3: Runtime policy resolution

Goal:
- resolve the active policy before generation starts
- select provider/model from the plan envelope
- attach the resolved snapshot to the execution flow

Dependencies:
- Checkpoint 1
- Checkpoint 2

Success criteria:
- sync and async share the same policy resolution path
- execution metadata includes the resolved provider/model
- routes do not decide provider/model selection
- execution consumes an immutable resolved snapshot from product

Related docs:
- `docs/archive/adr/0004-ai-provider-routing-transport.md`
- `docs/archive/policies/ai-policy-operational.md`
- `docs/archive/issues/ai-implementation-issues.md`

### Checkpoint 4: Real provider transport

Goal:
- replace synthetic transport with a real provider call
- keep the transport isolated from orchestration
- support at least one provider end to end first

Dependencies:
- Checkpoint 3

Success criteria:
- sync execution reaches a real LLM
- async execution reaches the same transport path
- outputs can be debugged against provider responses

Related docs:
- `docs/archive/adr/0004-ai-provider-routing-transport.md`
- `docs/archive/issues/ai-implementation-issues.md`

### Checkpoint 5: Multi-provider routing

Goal:
- make provider/model swaps possible under the same policy
- vary model choice by plan tier and quality lane
- keep the runtime model-agnostic

Dependencies:
- Checkpoint 4

Success criteria:
- multiple providers can be added without route changes
- lower tiers can be limited to cheaper models
- higher tiers can use stronger models

Related docs:
- `docs/archive/adr/0004-ai-provider-routing-transport.md`
- `docs/archive/issues/ai-implementation-issues.md`

### Checkpoint 6: Traceability and regression coverage

Goal:
- preserve policy version, provider, and model in traces and metadata
- validate the routing and billing behavior with tests

Dependencies:
- Checkpoints 2-5

Success criteria:
- traces show the policy snapshot used for execution
- traces correlate preview recommendation, quote, and execution when applicable
- billing reservations and captures are test-covered
- routing regressions are caught before release

Related docs:
- `docs/archive/issues/ai-implementation-issues.md`

## Execution order

1. Commercial policy contract
2. AI policy and product-facing preview
3. Runtime policy resolution
4. Real provider transport
5. Multi-provider routing
6. Traceability and regression coverage
