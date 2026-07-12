# E03 — Deterministic scorer (Layer 1)

## What to build

Implement the deterministic scoring layer in `packages/eval/src/scorer/deterministic.ts`. This layer runs fast, costs zero LLM tokens, and checks content-level expectations from `EvalCase.expectations`.

Checks to implement:
- `mustContain` — all listed strings appear in the generated text (case-insensitive)
- `mustNotContain` — none of the listed strings appear
- `wordCountRange` — word count falls within `{ min, max }` bounds
- `tone` — basic heuristic tone detection (formal/informal/neutral) using keyword signals

The scorer returns a `DeterministicScore` with individual check results and an overall 0–100 pass rate.

## Acceptance criteria

- [x] `scoreDeterministic(text, expectations)` returns `DeterministicScore`
- [x] Each check produces a boolean pass/fail with a message
- [x] Composite score is weighted average of individual checks (0–100)
- [x] Handles edge cases: empty expectations (100), empty text (0), missing fields (skip)
- [x] Unit tests cover all check types and edge cases
- [x] No external dependencies beyond existing workspace packages

## Blocked by

- E02 (types must exist)
