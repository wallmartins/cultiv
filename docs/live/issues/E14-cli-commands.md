# E14 — CLI commands

## What to build

Implement the CLI command handlers in `packages/eval/src/cli/index.ts` that wire argument parsing (E13) to the eval runner (E06) and baseline operations (E10, E11).

Commands:
- `eval [flags]` — run eval suite with given config
- `eval --compare` — run suite + compare against latest baseline
- `eval --save-baseline` — run suite + persist results as new baseline
- `eval --report json` — output JSON to stdout
- `eval --report markdown` — output markdown to stdout

The CLI entry point reads args, loads fixtures, runs the scorer, applies reporters, and handles baseline operations.

## Acceptance criteria

- [x] `pnpm --filter @my-ai-orchestrator/eval start` runs the CLI
- [x] Default run (no flags) executes deterministic + heuristic scoring for all suites
- [x] `--suite` filters to specific suite
- [x] `--include-judge` enables Voice Judge layer
- [x] `--compare` loads latest baseline and produces comparison
- [x] `--save-baseline` persists results after run
- [x] `--report json` outputs valid JSON to stdout
- [x] `--report markdown` outputs markdown to stdout
- [x] Progress indicator during long runs
- [x] Exit code 0 on success, 1 on regression (when --compare)

## Blocked by

- E10 (baseline persistence)
- E11 (baseline comparison)
- E13 (argument parser)
