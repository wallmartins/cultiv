# E06 — Eval scoring orchestrator

## What to build

Implement the core eval runner in `packages/eval/src/runner.ts` that orchestrates case loading, generation, scoring across all layers, and result aggregation.

The orchestrator:
1. Loads fixtures via the case loader (E05)
2. For each case: generates text (or accepts pre-generated candidate), runs deterministic scoring (E03), runs heuristic scoring (E04), optionally runs Voice Judge (E12 when available)
3. Aggregates per-case results into `EvalResult` with composite score
4. Produces `EvalReport` with suite-level summaries

The runner must be framework-agnostic — it accepts a `generate` function as a dependency injection parameter so it works with any generation backend.

## Acceptance criteria

- [x] `runEvalSuite(config)` returns `EvalReport`
- [x] Config accepts: `cases`, `generate` function, `includeJudge` flag, `voiceProfile` resolver
- [x] Each case produces an `EvalResult` with all layer scores
- [x] Composite score is configurable weighted average across layers
- [x] Runner handles generation failures gracefully (marks case as failed, continues)
- [x] Progress callback for long-running suites
- [x] Unit tests with mock generate function
- [x] Deterministic + heuristic layers run without LLM cost

## Blocked by

- E03 (deterministic scorer)
- E04 (heuristic scorer)
- E05 (case loader)
