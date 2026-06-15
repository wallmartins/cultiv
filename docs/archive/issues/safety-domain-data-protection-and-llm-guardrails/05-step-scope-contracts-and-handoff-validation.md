---
title: Step Scope Contracts And Handoff Validation
doc_type: issue
status: completed
domain: safety-and-compliance
last_updated: 2026-06-02
---

# Step Scope Contracts And Handoff Validation

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the slice that turns **Step Scope** into an explicit backend-enforced
contract so each pipeline step can read only the fields it is authorized to see,
write only the artifacts it is authorized to produce, and hand off only
validated intermediate state to the next step.

This slice should prove the end-to-end behavior that:

- pipeline steps no longer rely on broad shared mutable state
- unauthorized reads and writes are blocked by backend policy rather than
  convention
- each step handoff is validated before the next step can proceed
- broken scope boundaries are treated as critical failures, not soft warnings

Implementation scope:

- model per-step read and write contracts as typed domain definitions attached to
  runtime execution metadata
- build a scope-enforcement boundary that resolves the allowed fields before step
  execution and validates produced artifacts after step execution
- keep **Derived Voice Profile** visible only where explicitly authorized and
  prevent raw **Voice Example** material from becoming ambient pipeline state
- make scope violations produce typed failures and specialized boundary outcomes
  that later slices can record as **Policy Evidence**
- ensure the runtime cannot proceed to the next step when post-write validation
  fails or when a step attempts to access unauthorized inputs

## User stories covered

- 14, 30, 33, 34, 45, 53, 55

## Acceptance criteria

- [x] Each pipeline step executes under an explicit typed read and write contract instead of ambient full-state access.
- [x] Unauthorized field reads or writes fail before later steps can consume the invalid state.
- [x] Step-to-step handoff validation runs after each write and blocks continuation when produced artifacts do not satisfy the declared contract.
- [x] The main generation path continues to consume **Derived Voice Profile** as the voice source of truth without broadening raw **Voice Example** access.
- [x] Focused runtime tests cover permitted scope access, denied access, invalid handoff artifacts, and fail-closed scope boundary behavior.

## Blocked by

- `01-safety-policy-foundation-and-boot-validation.md`
