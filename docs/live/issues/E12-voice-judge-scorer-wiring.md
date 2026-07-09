# E12 — Voice Judge scorer wiring (Layer 3)

## What to build

Wire the existing Voice Judge as the optional Layer 3 scorer in `packages/eval/src/scorer/judge.ts`. This layer uses LLM-as-judge to evaluate voice fidelity with a separate provider from generation.

Wrap:
- `evaluateWithVoiceJudge()` from `apps/backend/src/execution/quality/voice-judge.ts`
- Uses the same prompt and scoring (0–100) as production
- Uses `Voice Judge Routing Profile` independently from generation provider

The scorer produces a `JudgeScore` with the voice fidelity score and rationale text.

Important: This layer is **optional** and costs LLM tokens. It's skipped in fast CI runs and enabled in nightly evaluations.

## Acceptance criteria

- [x] `scoreWithJudge(text, voiceProfile)` returns `JudgeScore`
- [x] JudgeScore includes: `score` (0–100), `rationale` (string), `provider` (string)
- [x] Uses temperature=0 for deterministic judge output
- [x] Graceful fallback when judge is unavailable (returns null, not error)
- [x] Provider and model version recorded in score for traceability
- [x] Unit tests with mock LLM response
- [x] Integration test with real Voice Judge (marked as slow)

## Blocked by

- E06 (scoring orchestrator must exist to integrate this layer)
