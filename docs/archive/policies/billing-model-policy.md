---
title: Billing Model Policy
doc_type: policy
status: active
domain: billing
last_updated: 2026-05-16
---

# Billing Model Policy

## Goal

Define how billing credits, plan versions, and model/provider routing work together in the backend.

The intent is:
- keep the product model-agnostic
- preserve cost control by plan tier and quality mode
- make billing auditable and legally safe
- allow provider/model swaps without changing product behavior

## Decisions already agreed

- Billing is credit-based.
- Credits are reserved before a generation starts.
- Credits are captured or released after the generation ends.
- Billing policy lives in `packages/payments`.
- Billing policy is persisted in the database.
- Default policy values bootstrap the database through seed/migration.
- Billing policy has an explicit `policyVersion`.
- A new plan record is created when policy changes.
- The previous plan is retired, but remains available for historical billing and audits.
- In-flight executions stay bound to the policy version that was active when they started.
- Credit pricing is defined by `planTier + qualityMode + contentType/pipeline`.
- Customer pricing is fixed per generation and does not partially refund unused
  early-exit headroom in this cycle.
- Public clients do not send pipelines; pipeline resolution is internal to the
  backend product layer.

## Current state

The backend already has:
- a shared sync execution runtime
- async worker execution that reuses the same runtime
- credit reservation and capture/release primitives
- plan/tier information in `packages/payments`
- quality mode selection in the orchestration path

What is still missing is the explicit routing layer that chooses provider/model from the billing policy and quality policy together.

## Proposed shape

### 1. Billing policy as source of truth

`packages/payments` should own:
- plan tier definitions
- credit cost per `qualityMode + contentType/pipeline`
- policy version
- allowed provider/model envelope per plan
- plan retirement metadata

The backend should consume that policy, not recreate it.

### 2. Policy persistence

The database should store:
- `billing_plan` records
- `billing_plan_policy_versions`
- `billing_plan_entitlements`
- execution references to the policy version that was active at creation time
- credit reservations and captures

The initial dataset should be seeded from code so a fresh environment boots with sane defaults.

### 3. Versioning rules

When a billing policy changes:
- create a new plan record or a new plan policy version
- retire the previous plan for new signups
- keep the old plan available for existing executions and audit replay
- never reprice already-started executions
- allow legacy-supported versions for customers already frozen to that contract

### 4. Runtime resolution

At generation time, the backend should resolve:
- active `planTier`
- active `policyVersion`
- `qualityMode`
- `contentType` / internal pipeline
- allowed provider/model set
- selected provider/model for the current run

That resolution should happen before the LLM call, and the chosen provider/model should be written into trace and telemetry.

### 5. Credit flow

The runtime should:
1. estimate credits from `planTier + qualityMode + contentType/pipeline`
2. reserve that amount on entry
3. execute the generation
4. capture the fixed commercial amount on success
5. release the reservation on failure

This keeps the commercial billing model stable even when the runtime uses retries or multiple candidate lanes.

## Implementation path

### Phase 1

- Add explicit billing policy types to `packages/payments`
- Add a policy resolver that maps `planTier + qualityMode + contentType/pipeline` to credit cost
- Add `policyVersion` to plan definitions
- Seed default plans and policy versions in the database

### Phase 2

- Add backend policy resolution before execution
- Attach resolved provider/model to execution metadata
- Use the resolved policy in both sync and async paths

### Phase 3

- Replace the synthetic adapter transport with real provider transports
- Add provider fallback / selection logic under the same policy
- Extend observability with provider/model selection and billing version snapshots

## Operational rules

- Do not hardcode price tables in routes.
- Do not mutate existing policy versions.
- Do not retroactively reprice old executions.
- Do not use secrets for billing policy tables.
- Do not let transport selection leak into the HTTP route layer.
- Do not expose internal pipeline structure in the public client contract.

## Tracking note

This document is the working proposal for the billing/model routing design and should be updated as implementation decisions land.

Related ADR: [0002-billing-model-routing-policy.md](../adr/0028-billing-model-routing-policy.md)

Implementation plan: [billing-model-implementation-plan.md](../plans/billing-model-implementation-plan.md)
Operational AI policy: [ai-policy-operational.md](./ai-policy-operational.md)
