---
title: Instruction Override Attempt Detection And Decisioning
doc_type: issue
status: ready-for-agent
domain: safety-and-compliance
last_updated: 2026-06-01
---

# Instruction Override Attempt Detection And Decisioning

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the slice that treats **Instruction Override Attempt** as a first-class
**Safety Domain** event instead of an incidental parsing detail, so the backend
can evaluate high-confidence attacks, ambiguous attempts, and non-blocking
signals consistently across input boundaries.

This slice should prove the end-to-end behavior that:

- override-attempt patterns are evaluated by backend policy, not by prompt text
  or ad hoc string filtering inside one route
- high-confidence malicious attempts can be blocked or quarantined with explicit
  decision semantics
- ambiguous or non-blocking heuristics remain observable so detection quality
  can improve without overblocking the product
- detector failures do not silently lower protection on critical paths

Implementation scope:

- define typed event and verdict models for **Instruction Override Attempt**
  classification, confidence, rationale category, and boundary outcome
- integrate these decisions into the **Input Safety Gateway** so the gateway can
  attach override-attempt results to input decisions
- support adapter-backed detector providers, but keep the final allow, block, or
  quarantine decision inside the backend policy engine
- record whether a signal was blocking or non-blocking so later metrics and
  **Policy Evidence** can distinguish hard policy enforcement from detection-only
  observation
- explicitly model fail-closed behavior for critical detector states and
  proportionate handling for ambiguous but non-critical heuristics

## User stories covered

- 2, 21, 22, 51, 52, 53, 54

## Acceptance criteria

- [ ] The backend models **Instruction Override Attempt** as a typed domain event with confidence or severity semantics instead of route-local string matching.
- [ ] High-confidence override attempts can be blocked or quarantined through the same typed gateway decision model used by other input policy outcomes.
- [ ] Non-blocking override heuristics remain observable and distinguishable from hard blocks so detection quality can be improved later.
- [ ] Critical detector failures fail closed instead of silently approving risky input.
- [ ] Focused tests cover blocked attacks, ambiguous but non-blocking cases, and detector failure handling.

## Blocked by

- `01-safety-policy-foundation-and-boot-validation.md`
- `02-public-input-safety-gateway-for-generation-boundaries.md`
