---
title: Execution Snapshot Contract And Defensive Validation
doc_type: issue
status: completed
domain: ai-implementation
last_updated: 2026-05-16
---

# Execution Snapshot Contract And Defensive Validation

## Parent

- `docs/archive/prd/ai-policy-generation-preview.md`

## What to build

Build the slice that defines the immutable resolved execution snapshot passed
from product to execution, plus minimal runtime validation for structural and
operational invariants.

This slice should prove the end-to-end behavior that:

- product resolves the execution snapshot once
- execution consumes that snapshot without recomputing policy
- invalid runtime commands fail as execution integrity errors

Implementation guardrails:

- follow `software-engineering` and `effect-ts` guidelines
- keep the snapshot contract deep, explicit, and stable
- avoid runtime ownership drift back into execution

## Acceptance criteria

- [x] Product can hand execution one resolved immutable snapshot containing the policy information needed to run.
- [x] Execution applies only structural and operational invariant validation instead of recomputing product policy.
- [x] Invalid execution snapshots fail with execution integrity errors rather than policy repository errors.

## Blocked by

- `02-internal-pipeline-catalog-guard.md`
- `03-billing-pricing-envelope-resolution.md`
- `07-product-oriented-public-generation-command.md`
