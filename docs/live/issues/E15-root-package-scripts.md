# E15 — Root package.json scripts

## What to build

Add eval-related scripts to the root `package.json` that wire to the eval CLI package.

Scripts to add:
- `eval` — runs `pnpm --filter @my-ai-orchestrator/eval start`
- `eval:ci` — runs eval with `--report json --compare` (for CI pipeline)
- `eval:nightly` — runs eval with `--include-judge --report json --save-baseline` (for nightly pipeline)

## Acceptance criteria

- [x] `pnpm eval` runs the eval suite (deterministic + heuristic)
- [x] `pnpm eval:ci` runs with JSON report and baseline comparison
- [x] `pnpm eval:nightly` runs with Voice Judge, JSON report, and saves baseline
- [x] All scripts use `--frozen-lockfile` equivalent (no install side effects)
- [x] Scripts are documented in root README or CONTRIBUTING

## Blocked by

- E14 (CLI commands must exist)
