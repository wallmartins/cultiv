---
title: Billing Model Implementation Plan
doc_type: plan
status: active
domain: billing
last_updated: 2026-05-16
---

# Billing Model Implementation Plan

## Goal

Implement model/provider routing and billing policy versioning without breaking the current execution contract.

This plan follows the agreed decisions:
- billing is credit-based
- credits are reserved before generation and captured/released after execution
- billing policy lives in `packages/payments`
- billing policy is persisted in the database
- billing policy has an explicit `policyVersion`
- a new plan record is created when policy changes
- executions already started stay bound to the version that was active when they began
- credit pricing is driven by `planTier + qualityMode + contentType/pipeline`

## Current gap

Today the backend already has:
- sync and async execution sharing the same runtime
- credit reservation/capture/release plumbing
- plan/tier data in `packages/payments`
- usage authorization that already checks plan/model constraints

What is missing:
- a first-class billing policy contract in `packages/payments`
- policy persistence/versioning in the database
- backend resolution of provider/model from policy + quality mode
- a real provider transport in the execution adapter

## Implementation phases

### Phase 1: Make billing policy explicit in `packages/payments`

Files to change:
- `packages/payments/src/index.ts`
- `packages/payments/src/errors.ts` if new policy validation errors are needed

What to add:
- a policy type that resolves credits from
  `BillingPlanTier + QualityMode + ContentType/Pipeline`
- a `policyVersion` field on plan definitions
- an explicit plan policy envelope for allowed providers/models
- helpers to register and resolve the current policy version

Why:
- keeps pricing logic in the commercial package
- makes policy changes auditable
- avoids duplicating pricing rules in the backend

### Phase 2: Persist versioned plans and bootstrap defaults

Files to change:
- `packages/payments/src/index.ts`
- `apps/backend/src/product/billing-bootstrap.ts`
- `apps/backend/src/product/service-dependencies.ts`
- `apps/backend/src/config.ts` only if a bootstrap switch is needed

What to add:
- seed default plans with `policyVersion`
- register plan revisions as new records instead of mutating existing ones
- keep retired plans available for historical billing

Why:
- fresh environments start with a valid policy set
- audits can replay old executions against the policy that was active then

### Phase 3: Resolve model/provider from policy in the backend

Files to change:
- `apps/backend/src/execution/index.ts`
- `apps/backend/src/execution/runtime-selection.ts`
- `apps/backend/src/execution/runtime-types.ts`
- `apps/backend/src/product/usage-policy-context.ts`
- `apps/backend/src/product/usage-policy-types.ts`
- `apps/backend/src/product/usage-policy.ts`
- `apps/backend/src/product/usage-policy-guards.ts`

What to add:
- a policy resolution step before execution starts
- selection of provider/model by `planTier + qualityMode + contentType/pipeline`
- explicit recording of the resolved provider/model in authorization and telemetry

Why:
- the route stops deciding anything about models
- provider choice becomes traceable and testable
- plan tier can cap the allowed model envelope

### Phase 4: Replace synthetic LLM transport with a real provider transport

Files to change:
- `apps/backend/src/execution/pipeline-execution-adapter.ts`
- `packages/ai-adapters/src/index.ts`
- provider-specific adapters inside `packages/ai-adapters/src`
- tests under `apps/backend/tests` and `tests/backend`

What to add:
- a real transport implementation for at least one OpenAI-compatible provider first
- provider-specific request building and response normalization
- observability around request, response, and provider selection

Why:
- sync and async finally exercise a real LLM call
- output debugging becomes meaningful
- retry and quality-lane behavior can be validated end to end

### Phase 5: Surface policy versioning in execution metadata

Files to change:
- `apps/backend/src/execution/runtime-attempt-loop.ts`
- `apps/backend/src/execution/runtime-selection.ts`
- `apps/backend/src/execution/queued-run.ts`
- `apps/backend/src/worker-job.ts`
- `packages/contracts/src/execution.ts`

What to add:
- carry `policyVersion` into execution metadata
- store the resolved provider/model used for the generation
- ensure queued and sync runs report the same policy snapshot
- correlate execution with preview quote/pricing snapshot when present

Why:
- historical replay becomes possible
- pricing disputes can be audited
- sync and async remain consistent

### Phase 6: Add tests for policy and routing

Files to change:
- `tests/backend/backend-product.test.ts`
- `tests/backend/backend-app-execution.test.ts`
- `tests/backend/backend-app-voice.test.ts`
- `apps/backend/tests/parity.test.ts`
- `packages/payments` tests if added later

What to cover:
- plan tier resolves to the expected credit budget
- quality mode maps to the expected reservation amount
- content type / pipeline changes can alter the fixed commercial price
- policy changes create a new version instead of mutating the old one
- sync execution and async execution both carry the same policy snapshot
- a real provider call is made through the adapter

## Recommended implementation order

1. `packages/payments`
2. `apps/backend/src/product/billing-bootstrap.ts`
3. `apps/backend/src/execution/index.ts`
4. `apps/backend/src/execution/pipeline-execution-adapter.ts`
5. `apps/backend/src/execution/runtime-*`
6. tests

## Non-goals

- Do not move billing policy into secrets.
- Do not price by tokens at the commercial layer.
- Do not let routes decide provider/model selection.
- Do not reprice already-started executions.
- Do not mutate existing plan records in place.
- Do not expose explicit pipeline control in the public client surface.

## Tracking note

This plan is meant to be updated as implementation lands, so it should remain the working reference for the billing/model routing rollout.

Issue breakdown: [billing-model-issues.md](../issues/billing-model-issues.md)
Operational AI policy: [ai-policy-operational.md](../policies/ai-policy-operational.md)
