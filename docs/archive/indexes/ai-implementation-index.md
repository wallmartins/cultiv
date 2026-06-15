---
title: AI Implementation Index
doc_type: index
status: active
domain: ai-implementation
last_updated: 2026-05-16
---

# AI Implementation Index

## Purpose

This document is the entry point for the current AI implementation in the repo.
It consolidates the active planning, ADRs, and issue breakdowns so the next work
does not depend on session memory.

## Current source of truth

- `packages/payments` owns billing policy, credit reservation, and policy versioning.
- `apps/backend/src/execution` owns sync/async execution and runtime selection.
- `apps/backend/src/product` owns voice, billing bootstrap, usage policy, and related product rules.
- `packages/contracts` owns request and response contracts.
- `packages/orchestrator` owns pipeline orchestration and runtime composition.
- `packages/text-quality` owns quality/candidate selection logic.
- `packages/database` owns persistence and repository primitives.
- `tests/backend` owns integration coverage for the public backend surface.

## AI capability map

### 1. Voice and memory

Status: implemented on the backend side, with voice profile resolution, examples, batches, effective voice, and snapshot persistence.

Relevant docs:
- `docs/archive/reference/examples.md`
- `docs/archive/api/backend-api.md`

### 2. Content types and catalog

Status: implemented on the backend side, with content-type discovery exposed through the API.

Relevant docs:
- `docs/archive/api/backend-api.md`

### 3. Execution runtime

Status: implemented for sync and async on a shared runtime. The remaining work here is provider/model routing and real transport wiring.

Relevant docs:
- `docs/archive/api/backend-api.md`
- `docs/archive/plans/billing-model-implementation-plan.md`
- `docs/archive/policies/ai-policy-operational.md`

### 4. Quality lanes

Status: implemented as execution policy, with fast, balanced, and strict lanes and their selection rules.

Relevant docs:
- `docs/archive/policies/quality-billing-policy.md`

### 5. Billing and credits

Status: the commercial model is now defined as credit-based billing with policy versioning, reservation on entry, and capture/release on exit.

Relevant docs:
- `docs/archive/policies/billing-model-policy.md`
- `docs/archive/plans/billing-model-implementation-plan.md`
- `docs/archive/issues/billing-model-issues.md`
- `docs/archive/adr/0003-billing-model-routing-policy.md`

### 6. Observability and traceability

Status: implemented at the backend level, with execution metadata and traces carrying the key selection data.

Relevant docs:
- `docs/archive/api/backend-api.md`
- `docs/archive/adr/effect-ts-hardening.md`

## Operational tree

### Layer 1: Commercial policy

This is the top-level policy layer that constrains everything else.

- `docs/archive/policies/billing-model-policy.md`
- `docs/archive/adr/0003-billing-model-routing-policy.md`
- `docs/archive/plans/billing-model-implementation-plan.md`
- `docs/archive/issues/billing-model-issues.md`

Scope:
- credit budget by `planTier + qualityMode + contentType/pipeline`
- `policyVersion`
- reserve on entry
- capture/release on exit
- plan retirement and audit replay

### Layer 2: Runtime selection

This is the backend decision layer that resolves what will actually run.

- `apps/backend/src/execution`
- `apps/backend/src/product/usage-policy.ts`
- `apps/backend/src/product/usage-policy-context.ts`
- `apps/backend/src/product/billing-bootstrap.ts`

Scope:
- resolve provider/model from the commercial envelope
- keep pipeline and step policy internal to the backend product layer
- keep sync and async on the same runtime path
- attach the resolved policy snapshot to execution metadata

### Layer 3: LLM transport

This is the edge layer that talks to provider APIs.

- `apps/backend/src/execution/pipeline-execution-adapter.ts`
- `packages/ai-adapters`

Scope:
- replace synthetic transport with real provider calls
- keep provider normalization isolated from orchestration
- support multiple providers without route-level branching

### Layer 4: Product surfaces

These are the user-facing product capabilities already exposed by the backend.

- `apps/backend/src/voice-routes.ts`
- `apps/backend/src/content-type-routes.ts`
- `apps/backend/src/routes.ts`
- `docs/archive/api/backend-api.md`
- `docs/archive/reference/examples.md`

Scope:
- voice profile lifecycle
- content type discovery
- execution endpoints
- backend API contracts

### Layer 5: Contracts and orchestration

These are the reusable foundations that the backend composes.

- `packages/contracts`
- `packages/orchestrator`
- `packages/text-quality`
- `packages/database`

Scope:
- request/response contracts
- execution orchestration
- quality lane selection
- persistence primitives

## Planning and ADR map

### Active planning docs

- `docs/archive/policies/quality-billing-policy.md`
- `docs/archive/policies/billing-model-policy.md`
- `docs/archive/plans/billing-model-implementation-plan.md`
- `docs/archive/issues/billing-model-issues.md`
- `docs/archive/plans/ai-roadmap.md`
- `docs/archive/policies/ai-policy-operational.md`

### Active ADRs

- `docs/archive/adr/0003-billing-model-routing-policy.md`
- `docs/archive/adr/0004-ai-provider-routing-transport.md`
- `docs/archive/adr/effect-ts-hardening.md`

### Active issue breakdowns

- `docs/archive/issues/billing-model-issues.md`
- `docs/archive/issues/ai-implementation-issues.md`

## What is still pending for the full AI implementation

### Highest priority

- Real provider transport for sync and async execution.
- Multi-provider routing behind the billing/model policy.
- Execution metadata that stores the resolved provider, model, and policy version everywhere.
- Public generation preview / pricing snapshot flow with quote consistency.
- Internal-only pipeline governance with explicit step execution policy.

### Medium priority

- Persistent billing policy bootstrap and retirement flow in the database.
- Regression coverage for the routing and billing rules.

### Lower priority / follow-on

- Broader observability around provider selection and credit capture.
- Further tightening of quality-lane selection against plan envelopes.
- Documentation parity across the AI planning docs and backend API reference.

## Explicitly out of scope for now

- Declarative skills.
- Legacy Fastify surface.
- Legacy root `src/` tree.
- Historical benchmark and migration docs outside the active AI surface.

## Recommended execution order

1. Finish the billing policy contract in `packages/payments`.
2. Persist the policy bootstrap and retirement flow in the database.
3. Introduce AI policy resolution and generation preview in the product layer.
4. Resolve provider/model from the policy in the backend runtime.
5. Replace the synthetic transport with real provider transport.
6. Propagate `policyVersion`, provider, model, and quote correlation into execution metadata.
7. Add regression tests for policy, routing, preview, and provider calls.
8. Keep the index, roadmap, ADRs, and issue docs in sync as decisions land.

## Working rule

Whenever a new AI workstream starts, it should produce:

- one planning doc
- one ADR if the decision is architectural
- one issue breakdown doc
- tests that match the public backend surface

This keeps the implementation trackable beyond the current session.
