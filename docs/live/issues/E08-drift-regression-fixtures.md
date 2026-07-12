# E08 — Drift regression fixtures

## What to build

Migrate and expand the drift regression fixtures. The existing 7 persona fixtures from `tests/fixtures/reasoning-regression/` must be moved into `packages/eval/src/fixtures/drift-regression/` and expanded to 15+ cases.

Each fixture contains:
- A voice profile with explicit CoreReasoningSignature enums
- A "bad candidate" text that deliberately violates the reasoning signature
- Expectations: the drift heuristic must detect the violation (minDriftScore threshold)

New cases should cover:
- Epistemic posture mismatches (overconfident vs. hedging)
- Argument structure violations (missing counterexamples when profile expects them)
- Structural anti-pattern triggers (e.g., profile forbids bullet lists but candidate uses them)

## Acceptance criteria

- [x] Original 7 fixtures migrated from `tests/fixtures/reasoning-regression/`
- [x] 8+ new drift regression fixtures added (total ≥ 15)
- [x] Each fixture has a voice profile with reasoning signature enums
- [x] Each fixture has a bad candidate that violates the signature
- [x] Expectations specify minimum drift detection threshold
- [x] Fixtures pass schema validation via the case loader
- [x] Old fixture location updated to import from new package (or removed if appropriate)

## Blocked by

- E02 (types must exist)
