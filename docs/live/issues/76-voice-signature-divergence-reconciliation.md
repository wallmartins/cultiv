---
title: Voice Signature Divergence and Reconciliation
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Voice Signature Divergence and Reconciliation

## Parent

- [`argument-development-signature.md`](../prd/argument-development-signature.md)
- [`issue-argument-development-signature.md`](../prd/issue-argument-development-signature.md)
- [ADR 0007](../../adr/0007-argument-development-signature.md)

## User stories covered

6, 8

## What to build

After parallel **Reasoning Extraction** and **Argument Development Extraction** succeed, run **Voice Signature Divergence Check** (deterministic, no LLM). Invoke **Voice Signature Reconciliation** (LLM) only when divergence is detected.

Deliver:

- `evaluateVoiceSignatureDivergence`: rules for posture vs Core enums, judgment/development mismatch, prose collapse between layers, structural anti-pattern clashes with Core traits
- `reconcileVoiceSignatures`: LLM harmonization with examples + draft Core + draft Development + draft Format; examples are ground truth
- When no conflict: persist parallel drafts unchanged (no third LLM call)
- On reconciliation failure: keep last valid full profile; log internal event; do not block generation
- Observability: `reconciliation.invoked`, `reconciliation.skipped`, `reconciliation.failed` (no user-facing conflict UI)

Divergence rules v1 (minimum):

| Rule | Example |
|------|---------|
| Posture vs certainty | `exploratory` + `certaintyLevel: high` |
| Posture vs conclusion pace | `exploratory` + `conclusionPace: fast` |
| Moves vs judgment | doubt/experimentation dominant + `judgmentFrequency: high` |
| Prose collapse | high similarity between Core narrative and development prose |
| Structural clash | `premature_thesis` structural + Core `conclusionPace: slow` |

## Acceptance criteria

- [ ] Agreeing draft pair skips reconciliation (exactly 2 LLM calls on rebuild).
- [ ] Conflicting fixture pair triggers reconciliation and persists unified profile.
- [ ] Reconciliation failure preserves last valid profile; generation still works.
- [ ] Unit tests per divergence rule with positive and negative cases.
- [ ] No reconciliation conflict state exposed via profile screen API.
- [ ] Feature flag off: divergence/reconciliation path not executed.

## Blocked by

- [75-parallel-argument-development-extraction.md](./75-parallel-argument-development-extraction.md)
