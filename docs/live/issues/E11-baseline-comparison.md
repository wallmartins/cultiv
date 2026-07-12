# E11 — Baseline comparison + regression detection

## What to build

Implement the comparison and regression detection logic in `packages/eval/src/baseline.ts` (extending E10). This compares two baselines and produces a regression report.

Behavior:
- Compare current results against a previous baseline by case ID
- Calculate per-case delta (current composite - previous composite)
- Classify deltas: improvement (>+3), stable (-2 to +3), warning (-2 to -5), regression (<-5)
- Produce a `RegressionReport` with flagged regressions and summary statistics

Thresholds (configurable):
- Hard fail: `evalComposite` drops > 5 points
- Warning: `evalComposite` drops 2–5 points
- Improvement: `evalComposite` rises > 3 points

## Acceptance criteria

- [x] `compareBaselines(current, previous)` returns `RegressionReport`
- [x] Each case gets a delta and classification (improvement/stable/warning/regression)
- [x] `RegressionReport` includes: regressions[], warnings[], improvements[], summary stats
- [x] New cases (not in previous baseline) are flagged as "new" (not regression)
- [x] Removed cases (in previous but not current) are flagged as "removed"
- [x] Configurable thresholds via options parameter
- [x] Unit tests covering all delta classifications and edge cases

## Blocked by

- E10 (baseline persistence must exist)
