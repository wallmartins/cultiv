# E13 — CLI argument parser

## What to build

Implement the CLI argument parsing for the eval tool in `packages/eval/src/cli/args.ts`. This parses command-line arguments and produces a typed `EvalCLIConfig` object.

Supported flags:
- `--suite <name>` — filter to specific suite (voice-fidelity, drift-regression, critic-regression)
- `--include-judge` — enable Voice Judge Layer 3 (slower, costs tokens)
- `--compare` — compare results against committed baseline
- `--report <format>` — output format: `console` (default), `json`, `markdown`
- `--save-baseline` — persist results as new baseline
- `--case <id>` — run specific case by ID
- `--tags <tags>` — filter cases by tag (comma-separated)
- `--threshold <number>` — regression threshold override (default: 5)

Use a lightweight arg parser (e.g., `mri` or hand-rolled) — no heavy dependencies.

## Acceptance criteria

- [x] Parses all flags listed above with correct types
- [x] Validates flag combinations (e.g., `--save-baseline` without `--compare` is valid)
- [x] Produces typed `EvalCLIConfig` object
- [x] Shows help text with `--help` flag
- [x] Shows version with `--version` flag
- [x] Invalid flags produce clear error messages
- [x] Unit tests for each flag and combination

## Blocked by

- E06 (scoring orchestrator must exist to define what config is needed)
