---
title: Text Generation Lexical Quality Program
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-11
---

# Text Generation Lexical Quality Program

## Parent

- PRD: [`text-generation-lexical-quality.md`](./text-generation-lexical-quality.md)
- ADR: [`../../adr/0001-generation-domain-and-lexical-quality.md`](../../adr/0001-generation-domain-and-lexical-quality.md)
- Plan: [`../plan/text-generation-lexical-quality-implementation-plan.md`](../plan/text-generation-lexical-quality-implementation-plan.md)
- Tracker: [`../plan/text-generation-lexical-quality-tracker.md`](../plan/text-generation-lexical-quality-tracker.md)

## User stories covered

1–10 (full PRD)

## What to build

End-to-end **lexical quality program** for backend text generation: unified word targets, domain classification, domain-aware prompts and lexicon, step-scoped LLM context, lexical critic and release gate, LinkedIn `tighten` step, regression corpus, and showcase alignment.

This parent issue tracks ten vertical slices (`17`–`26`). Each child issue must be mergeable independently where dependencies allow.

## Child issues

| # | Issue | Epic |
|---|-------|------|
| 17 | [Unified OutputWordTarget](../issues/17-unified-output-word-target.md) | A — Contracts |
| 18 | [Domain classifier](../issues/18-generation-domain-classifier.md) | A — Contracts |
| 19 | [PromptPolicy and domain prompts](../issues/19-prompt-policy-domain-prompts.md) | B — Prompts |
| 20 | [Domain-filtered lexicon and voice](../issues/20-domain-filtered-lexicon-voice.md) | B — Prompts |
| 21 | [Step-scoped context and adapter](../issues/21-step-scoped-context-adapter.md) | C — Pipeline |
| 22 | [Format condensation steps](../issues/22-linkedin-tighten-pipeline-step.md) | C — Pipeline |
| 23 | [Lexical critic and fidelity](../issues/23-lexical-critic-fidelity.md) | D — Quality |
| 24 | [Lexical release gate and selection](../issues/24-lexical-release-gate-selection.md) | D — Quality |
| 25 | [Regression corpus and metrics](../issues/25-lexical-regression-corpus.md) | E — Data |
| 26 | [Showcase and voice fixtures audit](../issues/26-showcase-voice-fixtures-audit.md) | E — Data |

## Program acceptance criteria

- [ ] ADR 0001 accepted; PRD and plan indexed in live docs READMEs.
- [ ] All child issues `done`; tracker shows baseline vs post metrics.
- [ ] All content types: no tech jargon on non-technical briefings in strict mode.
- [ ] Length compliance > 90% per format on regression corpus (short formats mandatory).
- [ ] Feature flag documented; rollout phases completed or explicitly deferred with owner note.

## Suggested order

`17 → 18 → (19 ∥ 20) → 21 → 22 → 23 → 24 → 26` with `25` starting after `17` and evolving through `24`.
