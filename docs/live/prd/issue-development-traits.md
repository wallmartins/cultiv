---
title: Development Traits and Author Confidence Program
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Development Traits and Author Confidence Program

## Parent

- PRD: [`development-traits-and-author-confidence.md`](./development-traits-and-author-confidence.md)
- ADR: [`../../adr/0008-development-traits-and-author-confidence.md`](../../adr/0008-development-traits-and-author-confidence.md)
- Extends: [`../../adr/0007-argument-development-signature.md`](../../adr/0007-argument-development-signature.md)
- Plan: [`../plan/development-traits-implementation-plan.md`](../plan/development-traits-implementation-plan.md)
- Prerequisite program: [`issue-argument-development-signature.md`](./issue-argument-development-signature.md) (issues 74–81)

## User stories covered

1–10 (full PRD)

## What to build

End-to-end **Development Traits** program: structured enums answering eight author development questions, **Trait Confidence Pass**, **Trait Evidence**, **Author Development Mirror** on **Voice Dashboard**, **Author Trait Confirmation** loop, and trait regression corpus — extending **Argument Development Extraction** without additional LLM calls.

Child issues are sliced as issues `82`–`86` below.

## Child issues

| # | Issue | Epic |
|---|-------|------|
| 82 | [Development traits contracts and persistence](../issues/82-development-traits-contracts-persistence.md) | A — Contracts |
| 83 | [Development traits extraction and confidence pass](../issues/83-development-traits-extraction-confidence.md) | B — Extraction |
| 84 | [Trait-aware divergence and reconciliation](../issues/84-trait-aware-divergence-reconciliation.md) | C — Reconciliation |
| 85 | [Author development mirror dashboard](../issues/85-author-development-mirror-dashboard.md) | D — Dashboard |
| 86 | [Author trait confirmation and regression](../issues/86-author-trait-confirmation-regression.md) | E — Confirmation & QA |
| 87 | [Development traits generation pass-through](../issues/87-development-traits-generation-pass-through.md) | F — Generation |

## Program acceptance criteria

- [ ] ADR 0008 accepted; PRD and plan indexed in live docs READMEs.
- [ ] All child issues `done`; `development-traits` regression baseline documented.
- [ ] Traits extracted in same LLM call as development (no third extraction pipeline).
- [ ] Trait confidence pass is deterministic; unit-tested thresholds.
- [ ] ≥2 disputed traits can trigger divergence; reconciliation harmonizes traits.
- [ ] Dashboard shows traits strip with confidence; `unknown` states do not invent values.
- [ ] Confirmation updates diagnostics only; `Não` does not change generation hints.
- [ ] `pnpm eval:development-traits` passes on CI corpus.
- [ ] Trait profile reaches execution via hints merge and optional compact prompt summary (issue 87).
- [ ] Feature flag `voice.reasoningSignatureV1` covers entire stack.
- [ ] Argument Development Signature program (74–81) complete before GA of this program.

## Suggested order

`82 → 83 → 84 → (85 ∥ 87) → 86`

Issue 87 can ship in parallel with dashboard mirror (85) once traits are reconciled (84). Confirmation/regression (86) remains last.
