# E18 — JSON reporter

## What to build

Implement the JSON reporter in `packages/eval/src/reporter/json.ts` that outputs eval results as structured JSON for CI artifact consumption and programmatic analysis.

The reporter serializes the full `EvalReport` to JSON with:
- Suite-level summaries (avgComposite, minComposite, passRate)
- Per-case results with all layer scores
- Baseline comparison (if available)
- Regressions list with deltas
- Metadata: timestamp, version, duration, config used

## Acceptance criteria

- [x] `reportJSON(evalReport)` returns formatted JSON string
- [x] JSON is valid and parseable
- [x] Includes all EvalReport fields (no truncation)
- [x] Handles missing optional fields gracefully (null/undefined omitted or null)
- [x] Pretty-printed by default, minified with `--compact` flag
- [x] Output can be piped to file: `pnpm eval --report json > report.json`
- [x] Unit tests verifying JSON structure and completeness

## Blocked by

- E06 (scoring orchestrator must produce EvalReport)
