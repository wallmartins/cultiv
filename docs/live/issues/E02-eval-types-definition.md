# E02 — Eval types definition

## What to build

Define the core TypeScript types for the eval system in `packages/eval/src/types.ts`. These types are the contract between all eval components (runner, scorer, fixtures, baselines, reporters).

Types to define:
- `EvalCase` — input fixture with expectations (mustContain, mustNotContain, wordCountRange, tone, minVoiceScore, minDriftScore)
- `EvalResult` — per-case result with deterministic/heuristic/judge/composite scores
- `EvalSuite` — collection of cases with suite metadata
- `EvalBaseline` — persisted snapshot with version, timestamp, results array, summary (avgComposite, minComposite, passRate, regressions)
- `EvalReport` — output envelope with baseline comparison, regressions, and suite summaries
- `ScoringLayer` — union type for deterministic/heuristic/judge layer identifiers

Follow the type shapes defined in `docs/eval-proposal.md` §3.2 and §3.4.

## Acceptance criteria

- [x] All types exported from `src/types.ts`
- [x] Types use discriminated unions where appropriate
- [x] `EvalCase.input.voiceProfile` supports both inline profile and fixture reference path
- [x] `EvalBaseline.results` includes per-layer scores (deterministic, heuristic, judge, evalComposite)
- [x] `EvalBaseline.summary` includes regressions array with caseId, previousScore, currentScore, delta
- [x] Types compile without errors
- [x] Barrel `index.ts` re-exports all types

## Blocked by

- E01 (package scaffold must exist)
