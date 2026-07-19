# E04 — Heuristic scorer wiring (Layer 2)

## What to build

Wire the existing `text-quality` modules as the heuristic scoring layer in `packages/eval/src/scorer/heuristic.ts`. This layer reuses production scoring logic without duplicating it.

Modules to wrap:
- `scoreCandidate()` from `packages/text-quality/src/quality/scorer.ts` — weighted critic+fidelity+drift+strategy formula
- `evaluateVoiceDrift()` from `packages/text-quality/src/quality/reasoning-drift.ts` — drift heuristic against CoreReasoningSignature
- `evaluateDevelopmentDrift()` from `packages/text-quality/src/quality/development-drift.ts` — development drift against ArgumentDevelopmentSignature
- `criticizeText()` from `packages/text-quality/src/quality/critic.ts` — clichés, LLM tics, meta-commentary, repetition

The scorer produces a `HeuristicScore` that maps the existing module outputs into the eval scoring contract.

## Acceptance criteria

- [x] `scoreHeuristic(text, voiceProfile)` returns `HeuristicScore`
- [x] HeuristicScore includes sub-scores: critic, fidelity, drift, developmentDrift, lexical
- [x] Composite heuristic score is 0–100 weighted average
- [x] `packages/eval` has `packages/text-quality` as a workspace dependency
- [x] Wraps existing functions directly — no logic duplication
- [x] Unit tests verify each sub-scorer is called and results are composed

## Blocked by

- E02 (types must exist)
