---
title: Author Trait Confirmation and Regression
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: HITL
last_updated: 2026-06-17
---

# Author Trait Confirmation and Regression

## Parent

- [`development-traits-and-author-confidence.md`](../prd/development-traits-and-author-confidence.md)
- [`issue-development-traits.md`](../prd/issue-development-traits.md)
- [ADR 0008](../../adr/0008-development-traits-and-author-confidence.md)

## User stories covered

4, 5, 7, 10

## What to build

Ship **Author Trait Confirmation** (Sim / Não / Não sei), **Voice Next Step** mapping for trait gaps, and CI regression for **Development Traits**.

Deliver end-to-end:

- API to record author confirmation per trait key: `confirmed` | `rejected` | `skipped`
- Sim → update diagnostics audit: `status: confirmed`, confidence bump (cap `high`); does not alter generation hints
- Não → `status: disputed` in audit; set **Voice Next Step** via `nextActionCodes` + localized CTA for opposite-pattern or conflicting examples
- Não sei → no persistence change; card dismissed for session
- Dashboard: one confirmation card per visit max; prioritize lowest confidence or `disputed` traits
- Map trait gaps to `nextActionCodes` (reuse `review_conflicting_examples`, `add_more_examples`, `add_examples_from_other_content_types` or add `add_argumentative_example` if needed)
- Extend `tests/fixtures/reasoning-regression/` personas with `expectedTraits` + optional gap scenarios
- `tests/reasoning-regression/development-traits-regression.test.ts`
- `scripts/eval-development-traits.ts` + `pnpm eval:development-traits`
- Baseline doc: `docs/live/plan/development-traits-regression-baseline.md`
- Observability: `trait_confirmation_recorded`

HITL: product copy review for confirmation prompts and gap CTAs before GA.

## Acceptance criteria

- [ ] Confirmation API integration test: Sim updates diagnostics; generation hints unchanged on Não.
- [ ] Dashboard shows confirmation card only for `low`/`medium` confidence or `disputed` traits.
- [ ] At most one confirmation card per dashboard visit.
- [ ] `pnpm eval:development-traits` exits 0 on corpus; CI job runs it.
- [ ] Persona corpus ≥6 authors with `expectedTraits`; confidence rules validated in tests.
- [ ] Regression baseline doc indexed in plan README.
- [ ] pt-BR + en confirmation and gap copy reviewed (HITL sign-off noted in PR).

## Blocked by

- [85-author-development-mirror-dashboard.md](./85-author-development-mirror-dashboard.md)
