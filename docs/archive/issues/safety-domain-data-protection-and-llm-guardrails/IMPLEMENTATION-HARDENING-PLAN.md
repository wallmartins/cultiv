---
title: Safety Domain Hardening Coordination
doc_type: coordination
status: active
domain: safety-and-compliance
last_updated: 2026-06-02
---

# Safety Domain Hardening Coordination

This document coordinates the follow-up work required to bring the
`safety-domain-data-protection-and-llm-guardrails` implementation into full
alignment with the PRD, issue acceptance criteria, and review findings.

It is not the implementation itself. It exists so the remaining work can be
picked up in the right order, with the right boundaries, and without losing the
review context that identified the remaining gaps.

## Why this exists

The original 12 slices established the core Safety Domain behavior and the
suite is green, but a post-implementation review found four acceptance gaps and
several architectural follow-ups:

- `Voice Training Input` still lacks real backend-owned protected persistence
- consent revocation can still succeed even when protected artifact cleanup
  fails
- `Policy Evidence` for `Step Scope` is incomplete for some violation paths
- consent assertion is not yet reconstructable through specialized evidence
- operational override grants are still process-local
- some route-level safety schemas still duplicate canonical taxonomy literals

## Execution order

### Slice 13

Deliver the first real protected-persistence wave for `Voice Training Input`.

Why first:

- it is the largest remaining acceptance gap against the PRD and issue 08
- later consent hardening should operate on already-protected storage

### Slice 14

Make consent revocation fail closed when protected artifact invalidation does
not finish.

Why second:

- the PRD requires revocation to be materially effective, not advisory
- once storage is protected, revocation semantics become even more important

### Slice 15

Complete `Policy Evidence` for every `Step Scope` violation path.

Why third:

- slice 10 promised reconstructable boundary failures
- the current scope boundary is functionally correct but not fully observable

### Slice 16

Add reconstructable consent-assert evidence to the operational read model.

Why fourth:

- this closes the last known evidence-level delivery gap in the consent
  boundary
- it is small and independent once revocation semantics are correct

### Slice 17

Move operational override grants out of process memory into durable storage.

Why fifth:

- it is not blocking current acceptance, but it is the largest scalability risk
- durable grants allow restart-safe and multi-instance operational behavior

### Slice 18

Remove local taxonomy drift and finish single-responsibility hardening in the
remaining Safety Domain surfaces.

Why last:

- it is mostly architectural debt paydown rather than acceptance repair
- it should happen after the required functional gaps are closed so the final
  refactor lands on stable behavior

## Non-negotiable constraints

All follow-up work must continue to follow:

- `software-engineering`
- `effect-ts`
- `reviewing-code`
- `review-delivery`

And must preserve:

- fail-closed behavior on critical boundaries
- deep modules with small stable interfaces
- typed policy and evidence vocabulary
- `Derived Voice Profile` as the generation-time voice source of truth
- route-surface and service-boundary testing over private implementation tests

## Completion bar

This workstream should only be considered fully closed when:

- issue 08's protected-persistence acceptance criteria are materially true
- consent revocation cannot silently leave reusable protected artifacts behind
- policy evidence fully reconstructs scope and consent enforcement behavior
- operational override is restart-safe and no longer tied to one process
- route-level taxonomy drift has been removed from the known Safety Domain
  surfaces
- the final review finds no remaining acceptance gaps against the PRD
