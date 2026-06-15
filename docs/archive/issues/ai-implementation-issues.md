---
title: AI Implementation Issues
doc_type: issue-backlog
status: active
domain: ai-implementation
last_updated: 2026-05-16
---

# AI Implementation Issues

## Purpose

This is the master backlog for the remaining AI implementation work.

Billing/model routing already has its own dedicated issue list:

- [billing-model-issues.md](./billing-model-issues.md)

This file covers the rest of the AI implementation and connects it to the
already agreed billing work.

## Issue group A: Billing and model routing

Source of truth:
- [billing-model-issues.md](./billing-model-issues.md)
- [ADR 0004: AI Provider Routing and Transport](../adr/0004-ai-provider-routing-transport.md)

These are already decomposed and should be implemented first:

- billing policy versioned contract
- plan policy bootstrap and retirement
- runtime policy resolution for generation
- real LLM transport for sync and async
- execution policy metadata and traceability
- routing and billing regression coverage

## Issue group B: AI policy and public generation surface

### 1. AI policy capability and versioned file loading

- **Goal:** add a first-class `AIPolicyService` in the backend product layer,
  backed by versioned declarative policy files and boot-time validation.

### 2. Internal pipeline policy and explicit step execution

- **Blocked by:** AI policy capability and versioned file loading
- **Goal:** make `step.config.execution` explicit, keep pipelines internal, and
  reject unknown steps against policy catalog.

### 3. Generation preview and pricing snapshot flow

- **Blocked by:** AI policy capability and versioned file loading
- **Goal:** expose product-facing preview/quote semantics with deterministic
  `quoteId`, allowed options, recommendation, and projected balance impact.

### 4. Public generation orchestration in product layer

- **Blocked by:** Generation preview and pricing snapshot flow
- **Goal:** move public generation orchestration into product, with execution
  consuming a resolved immutable snapshot instead of recomputing policy.

## Issue group C: Provider transport and runtime integration

### 5. Runtime provider routing contract

- **Blocked by:** Public generation orchestration in product layer
- **Goal:** resolve provider/model before generation starts and carry the
  resolved snapshot through sync and async execution.

### 6. Real provider transport implementation

- **Blocked by:** Runtime provider routing contract
- **Goal:** replace synthetic transport with real provider calls for at least
  one OpenAI-compatible provider first.

### 7. Multi-provider envelope and fallback

- **Blocked by:** Real provider transport implementation
- **Goal:** add additional providers behind the same policy envelope without
  leaking provider branching into routes.

## Issue group D: Traceability and auditability

### 8. Execution metadata snapshot

- **Blocked by:** Runtime provider routing contract
- **Goal:** persist `policyVersion`, provider, model, and selection reason in
  execution metadata and job payloads, including quote correlation where
  relevant.

### 9. Trace and telemetry coverage

- **Blocked by:** Execution metadata snapshot
- **Goal:** make traces and telemetry show the same policy snapshot used during
  execution, plus preview recommendation and divergence signals where available.

## Issue group E: Regression and smoke testing

### 10. End-to-end provider smoke test

- **Blocked by:** Real provider transport implementation
- **Goal:** validate a real generation path that reaches the provider and
  returns debuggable output.

### 11. Billing and routing regression suite

- **Blocked by:** Execution metadata snapshot
- **Goal:** cover policy resolution, credit reservation/capture, provider
  selection, quote consistency, and sync/async parity.

## Recommended implementation order

1. Finish the billing/model routing issues.
2. Add the AI policy capability and policy-governed pipeline surface.
3. Add the generation preview / pricing snapshot flow.
4. Add the runtime provider routing contract.
5. Add the real provider transport implementation.
6. Add multi-provider envelope and fallback.
7. Persist execution metadata snapshots.
8. Add trace/telemetry coverage.
9. Add provider smoke tests and regression coverage.
