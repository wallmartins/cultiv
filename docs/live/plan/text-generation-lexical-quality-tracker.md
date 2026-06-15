# Text Generation Lexical Quality — Tracker

**Parent:** [`issue-text-generation-lexical-quality.md`](../prd/issue-text-generation-lexical-quality.md)

**Last updated:** 2026-06-11

## Issue status

| # | Issue | Status | Owner | Notes |
|---|-------|--------|-------|-------|
| 17 | [Unified OutputWordTarget](../issues/17-unified-output-word-target.md) | `ready-for-agent` | — | |
| 18 | [Domain classifier](../issues/18-generation-domain-classifier.md) | `ready-for-agent` | — | blocked by 17 |
| 19 | [PromptPolicy](../issues/19-prompt-policy-domain-prompts.md) | `ready-for-agent` | — | blocked by 18 |
| 20 | [Domain-filtered lexicon](../issues/20-domain-filtered-lexicon-voice.md) | `ready-for-agent` | — | blocked by 18 |
| 21 | [Step-scoped context](../issues/21-step-scoped-context-adapter.md) | `ready-for-agent` | — | blocked by 19 |
| 22 | [LinkedIn tighten](../issues/22-linkedin-tighten-pipeline-step.md) | `ready-for-agent` | — | blocked by 17, 19 |
| 23 | [Lexical critic](../issues/23-lexical-critic-fidelity.md) | `ready-for-agent` | — | blocked by 17, 18 |
| 24 | [Release gate](../issues/24-lexical-release-gate-selection.md) | `ready-for-agent` | — | blocked by 23 |
| 25 | [Regression corpus](../issues/25-lexical-regression-corpus.md) | `ready-for-agent` | — | parallel from 17 |
| 26 | [Showcase audit](../issues/26-showcase-voice-fixtures-audit.md) | `ready-for-agent` | — | blocked by 24 |

## Baseline metrics (pre-implementation)

_Measure after issue 25 scaffold exists; fill before issue 24 merge._

| Metric | Baseline | Target | Post (TBD) |
|--------|----------|--------|------------|
| Tech hits (`non-technical`, n=15) | — | 0 | — |
| LinkedIn length compliance | — | > 90% | — |
| Top-term concentration (avg) | — | < 8% | — |
| Type-token ratio (LinkedIn) | — | > 0.45 | — |
| Bigram repeat rate | — | −50% | — |

## Rollout checklist

- [ ] `generation.lexicalQualityV2` flag defined in config
- [ ] Alpha: issues 17–20 + offline eval
- [ ] Beta: LinkedIn balanced enabled
- [ ] GA: all content types + strict gate
- [ ] Showcase regenerated (issue 26)
- [ ] `progress-log.md` updated on program completion

## Decisions log

| Date | Decision | Reference |
|------|----------|-----------|
| 2026-06-11 | Domain + lexical quality ADR accepted | [ADR 0001](../../adr/0001-generation-domain-and-lexical-quality.md) |
| 2026-06-11 | Tech jargon forbidden unless domain allows | PRD FR-3 |
