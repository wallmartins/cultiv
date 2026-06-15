---
title: Shared Safety Taxonomy Schemas And Module Boundary Hardening
doc_type: issue
status: completed
domain: safety-and-compliance
last_updated: 2026-06-02
---

# Shared Safety Taxonomy Schemas And Module Boundary Hardening

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the architectural clean-up slice that removes known route-level taxonomy
duplication and finishes single-responsibility hardening in the remaining
Safety Domain modules, so future policy evolution is less likely to drift
between route contracts, service boundaries, and evidence semantics.

This slice should prove the end-to-end behavior that:

- route-level validation reuses canonical Safety Domain taxonomy instead of
  maintaining local literal copies
- remaining large or mixed-responsibility modules are split along cohesive
  boundaries
- future policy expansion does not require editing the same vocabulary in
  multiple layers
- Safety Domain modules stay deep and stable without turning into god files

Implementation scope:

- extract shared schemas or schema builders for canonical safety taxonomy used
  by route-level validation, starting with operational override routes
- continue splitting mixed-responsibility Safety Domain modules where the
  boundary is already clear, such as evidence builders versus read-model
  mapping or scope enforcement versus scope-evidence emission
- keep public and operational route behavior unchanged while reducing drift risk
- add focused regression tests or governance tests where useful to lock the new
  boundaries

## User stories covered

- 30, 32, 37, 40, 45, 48, 55

## Acceptance criteria

- [x] Known route-level safety taxonomy duplication is replaced with canonical shared schemas or schema builders.
- [x] Remaining mixed-responsibility Safety Domain modules are split along stable cohesive boundaries where that boundary is already explicit.
- [x] Behavior remains unchanged at route and service surfaces while drift risk is reduced.
- [x] Focused tests or governance checks protect the extracted boundaries from regression.

## Blocked by

- `17-durable-operational-override-grants-and-restart-safe-lifecycle.md`

## Delivered

- canonical safety taxonomy schemas now live in a dedicated module and are reused by route-level validation instead of being re-declared inline on the operational override surface
- the safety policy document schema now consumes the same shared taxonomy vocabulary, reducing future drift between policy boot validation and HTTP request validation
- `policy-evidence` was split into dedicated recorder and read-model modules so evidence persistence, summary construction, and operational listing no longer share one mixed-responsibility file
- a governance test now protects the internal override route from regressing back to local `Schema.Literal(...)` taxonomy copies
- route and service behavior remain unchanged while the Safety Domain boundary becomes easier to evolve safely
