---
title: Quality Mode Recommendation Heuristics
doc_type: issue
status: completed
domain: ai-implementation
last_updated: 2026-05-22
---

# Quality Mode Recommendation Heuristics

## Parent

- `docs/archive/prd/ai-policy-generation-preview.md`

## What to build

Build the slice that adds backend-owned **quality mode** recommendation to
**Generation Preview** using deterministic structural heuristics, with stable
reason codes and short explanation text.

This slice should prove the end-to-end behavior that:

- recommendation is computed in the backend
- recommendation only uses options already allowed for the current customer
- preview can explain why a mode is recommended without blocking other valid
  choices

Implementation guardrails:

- follow `software-engineering` and `effect-ts` guidelines
- keep heuristic rules explicit and testable
- avoid embedding product logic in client code

## Acceptance criteria

- [x] Generation Preview can return one recommended `qualityMode` with stable `reasonCodes` and a short explanation.
- [x] The recommendation never points to a blocked option outside the user's entitlement space.
- [x] The heuristic logic is isolated enough to evolve without rewriting preview orchestration.

## Blocked by

- `04-generation-preview-read-model.md`
