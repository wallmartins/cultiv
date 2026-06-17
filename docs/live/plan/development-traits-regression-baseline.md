# Development Traits Regression Baseline

Last updated: 2026-06-17

## Corpus

- Location: `tests/fixtures/reasoning-regression/`
- Personas with `expectedTraits`: 7 authors (threshold ≥6)
- Eval command: `pnpm eval:development-traits`

## Confidence rules validated

- Unknown traits omit enum values (`status: unknown`)
- Single-example support → `low` / `inferred`
- Three-example agreement → `high` when immature cap not applied
- Contradictory evidence → `disputed`
- Immature development (`<3` active examples) caps confidence at `medium`

## Related tests

- `tests/backend/trait-confidence-pass.test.ts`
- `tests/backend/trait-aware-divergence.test.ts`
- `tests/reasoning-regression/development-traits-regression.test.ts` (vitest wrapper)
- `tests/web/voice-reasoning-section.test.tsx`

## Dashboard HITL

Confirmation prompts and gap CTAs require product copy review before GA (issue 86).
