# E16 — CI PR pipeline

## What to build

Add an eval job to `.github/workflows/ci.yml` that runs on every PR. This is the fast path: deterministic + heuristic scoring only (no Voice Judge, no LLM cost).

The job:
1. Checks out code, installs dependencies
2. Runs `pnpm eval:ci` (deterministic + heuristic + compare against committed baseline)
3. Uploads eval report as GitHub Actions artifact
4. Fails if regression detected (exit code 1 from --compare)

## Acceptance criteria

- [x] New `eval` job in `.github/workflows/ci.yml`
- [x] Runs on `pull_request` events
- [x] Uses Node 22, pnpm, frozen lockfile
- [x] Runs `pnpm eval:ci` (no Voice Judge)
- [x] Uploads `packages/eval/dist/eval-report.json` as artifact (even on failure)
- [x] Job fails when regression is detected
- [x] Job passes with warning when warning-level regression detected
- [x] Eval job runs in parallel with existing test/lint jobs (not blocking them)

## Blocked by

- E15 (root scripts must exist)
