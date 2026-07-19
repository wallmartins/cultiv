# E10 — Baseline persistence

## What to build

Implement baseline save/load functionality in `packages/eval/src/baseline.ts`. Baselines are JSON files stored at `tests/eval/baselines/{suite}/{version}.json` that snapshot eval scores for regression detection.

Functions:
- `saveBaseline(report, version)` — serialize EvalReport as EvalBaseline, write to filesystem
- `loadBaseline(suite, version?)` — load a specific baseline or the latest for a suite
- `listBaselines(suite)` — list available baseline versions for a suite
- `getLatestBaseline(suite)` — convenience wrapper for the most recent baseline

Version is typically the git SHA or a semantic version string.

## Acceptance criteria

- [x] `saveBaseline()` writes JSON to `tests/eval/baselines/{suite}/{version}.json`
- [x] `loadBaseline()` reads and parses baseline JSON, returns typed `EvalBaseline`
- [x] `loadBaseline()` returns `null` for missing baselines (not throw)
- [x] `listBaselines()` returns `{ version: string; timestamp: string }[]` sorted by recency
- [x] `getLatestBaseline()` returns the most recent baseline or `null`
- [x] Directory structure is created automatically on first save
- [x] Unit tests for save, load, list, and missing-baseline scenarios

## Blocked by

- E06 (scoring orchestrator must produce EvalReport)
