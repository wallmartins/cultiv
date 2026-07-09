# E17 — Nightly eval pipeline

## What to build

Add a nightly eval job to `.github/workflows/ci.yml` that runs the full eval suite with Voice Judge at 3 AM UTC daily. This is the comprehensive path: all scoring layers including LLM judge.

The job:
1. Runs on schedule (cron: `0 3 * * *`)
2. Runs `pnpm eval:nightly` (deterministic + heuristic + Voice Judge)
3. Saves results as new baseline for future comparisons
4. Uploads report as artifact

## Acceptance criteria

- [x] New `eval-nightly` job in `.github/workflows/ci.yml`
- [x] Runs on `schedule` with cron `0 3 * * *`
- [x] Uses Node 22, pnpm, frozen lockfile
- [x] Runs `pnpm eval:nightly` (with Voice Judge)
- [x] Saves baseline after run
- [x] Uploads `eval-report.json` as artifact
- [x] Can also be triggered manually via `workflow_dispatch`
- [x] Job does not block or depend on other jobs

## Blocked by

- E15 (root scripts must exist)
