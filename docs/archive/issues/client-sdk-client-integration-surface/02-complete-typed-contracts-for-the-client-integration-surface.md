---
title: Complete Typed Contracts For The Client Integration Surface
doc_type: issue
status: ready-for-agent
domain: client-integration-surface
last_updated: 2026-06-03-refined
---

# Complete Typed Contracts For The Client Integration Surface

## Parent

- `docs/archive/prd/client-sdk-client-integration-surface.md`

## What to build

Complete the shared client-facing contracts so the **Client Integration
Surface** has explicit typed request, response, and execution observation
payloads for every product capability it owns.

This slice should prove end-to-end that:

- preview, content types, executions, execution events, and voice workflows
  all have explicit shared schemas and decoders
- invalid payloads fail with typed contract errors instead of being tolerated
  silently
- execution watch semantics are represented by explicit client contracts rather
  than inferred from backend internals
- `ExecutionTransition` union discriminated (`started`, `progressed`, `completed`,
  `failed`) with optional snapshot is added to shared contracts
- `idempotencyKey` is generated automatically by the SDK and included in mutating
  request contracts

## Acceptance criteria

- [ ] Shared contracts cover every product-facing SDK capability with typed schemas and decoders.
- [ ] Invalid request or response payloads fail through typed decode behavior.
- [ ] Execution observation event shapes are explicitly modeled in the shared contract layer.

## Blocked by

- `01-canonical-public-surface-and-legacy-contract-removal.md`
