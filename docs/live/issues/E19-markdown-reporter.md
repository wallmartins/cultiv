# E19 — Markdown reporter

## What to build

Implement the markdown reporter in `packages/eval/src/reporter/markdown.ts` that produces human-readable reports for PR comments and documentation.

The reporter generates markdown with:
- Summary header (pass/fail, overall score, regression count)
- Per-suite results table (case ID, scores, status)
- Regressions section with before/after comparison
- Improvements section highlighting positive changes
- Configuration metadata (version, timestamp, flags used)

## Acceptance criteria

- [x] `reportMarkdown(evalReport)` returns formatted markdown string
- [x] Markdown is valid and renders correctly on GitHub
- [x] Summary uses emoji indicators (checkmark/warning/cross) for quick scanning
- [x] Results table is sortable-friendly (consistent column order)
- [x] Regressions section shows case ID, previous score, current score, delta
- [x] Output can be piped: `pnpm eval --report markdown > eval-report.md`
- [x] Unit tests verifying markdown structure

## Blocked by

- E06 (scoring orchestrator must produce EvalReport)
