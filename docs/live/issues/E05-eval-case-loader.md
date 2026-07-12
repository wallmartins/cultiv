# E05 — Eval case loader

## What to build

Implement the fixture loading system in `packages/eval/src/fixtures/loader.ts`. This component discovers, loads, validates, and indexes eval case fixtures from the filesystem.

Behavior:
- Scan fixture directories (`voice-fidelity/`, `drift-regression/`, `critic-regression/`) for `.json` files
- Validate each fixture against `EvalCase` schema (using the types from E02)
- Support filtering by suite name, tags, or case ID pattern
- Return typed `EvalCase[]` ready for the runner
- Provide a `loadFixturesIndex()` function that returns available suites and case counts

## Acceptance criteria

- [x] `loadFixtures(options?)` returns validated `EvalCase[]`
- [x] Options support: `suite`, `tags`, `caseId` pattern filtering
- [x] Invalid fixtures produce clear error messages with file path and validation details
- [x] `loadFixturesIndex()` returns `{ suite: string; count: number }[]`
- [x] Handles empty fixture directories gracefully (returns empty array)
- [x] Unit tests with valid and invalid fixture JSON files
- [x] No LLM calls — pure filesystem + validation

## Blocked by

- E02 (types must exist)
