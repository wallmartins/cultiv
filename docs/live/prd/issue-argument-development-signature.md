---
title: Argument Development Signature Program
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Argument Development Signature Program

## Parent

- PRD: [`argument-development-signature.md`](./argument-development-signature.md)
- ADR: [`../../adr/0007-argument-development-signature.md`](../../adr/0007-argument-development-signature.md)
- Extends: [`../../adr/0006-author-reasoning-signature.md`](../../adr/0006-author-reasoning-signature.md)
- Plan: [`../plan/argument-development-signature-implementation-plan.md`](../plan/argument-development-signature-implementation-plan.md)
- Prerequisite program: [`issue-author-reasoning-signature.md`](./issue-author-reasoning-signature.md) (issues 66–73)

## User stories covered

1–10 (full PRD)

## What to build

End-to-end **Argument Development Signature** program: parallel **Argument Development Extraction** on voice rebuild, deterministic **Voice Signature Divergence Check**, conditional **Voice Signature Reconciliation**, step-scoped `== ARGUMENT DEVELOPMENT ==` injection, **Argument Development Drift** in every **Quality Mode**, updated **Voice Judge** triggers and prompt, and second hero block on **Voice Dashboard**.

Child issues are sliced as issues `74`–`81` below.

## Child issues

| # | Issue | Epic |
|---|-------|------|
| 74 | [Argument development contracts and persistence](../issues/74-argument-development-contracts-persistence.md) | A — Contracts |
| 75 | [Parallel argument development extraction](../issues/75-parallel-argument-development-extraction.md) | B — Extraction |
| 76 | [Voice signature divergence and reconciliation](../issues/76-voice-signature-divergence-reconciliation.md) | C — Reconciliation |
| 77 | [Development voice hints and resolution](../issues/77-development-voice-hints-resolution.md) | D — Hints |
| 78 | [Step-scoped development prompts](../issues/78-step-scoped-development-prompts.md) | E — Generation |
| 79 | [Argument development drift and critic](../issues/79-argument-development-drift-critic.md) | F — Quality |
| 80 | [Voice judge development policy](../issues/80-voice-judge-development-policy.md) | G — Judge |
| 81 | [Voice development presentation](../issues/81-voice-development-presentation.md) | H — Dashboard |

## Program acceptance criteria

- [ ] ADR 0007 accepted; PRD and plan indexed in live docs READMEs.
- [ ] All child issues `done`; development regression baseline documented.
- [ ] Parallel extraction does not pass draft Core into Development prompt (contract test).
- [ ] Reconciliation runs only when divergence check fails; rate monitored ≤30% of rebuilds.
- [ ] Development fields survive voice hints merge (regression test).
- [ ] `fast` mode applies development drift; judge never runs in `fast`.
- [ ] `balanced` judge triggers on reasoning OR development borderline OR tie.
- [ ] Voice Dashboard shows second hero when development signature exists.
- [ ] Feature flag `voice.reasoningSignatureV1` covers entire stack; no separate Development flag in v1.
- [ ] Author Reasoning Signature program (66–73) complete before GA of this program.

## Suggested order

`74 → 75 → 76 → 77 → (78 ∥ 79 ∥ 81) → 80`
