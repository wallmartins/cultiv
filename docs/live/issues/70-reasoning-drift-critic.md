---
title: Reasoning Drift and Critic Extensions
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-16
---

# Reasoning Drift and Critic Extensions

## Parent

- [`author-reasoning-signature.md`](../prd/author-reasoning-signature.md)
- [`issue-author-reasoning-signature.md`](../prd/issue-author-reasoning-signature.md)
- [ADR 0006](../../adr/0006-author-reasoning-signature.md)

## User stories covered

5, 6, 10

## What to build

Extend **text-quality** with heuristic reasoning evaluation aligned to **Core Reasoning Signature** enums and **Derived Anti-Patterns**.

Deliver:

- `evaluateReasoningDrift` (or extend `evaluateVoiceDrift`): penalties for absolutism when `certaintyLevel` is moderate/low, prescriptive judgment when `judgmentFrequency` is low, premature conclusion (structural position), derived anti-pattern hits
- `critic.ts` findings: `premature_conclusion`, `excess_certainty`, `rhetorical_inflation`
- Integrate into `lane-runner` before candidate selection; expose scores in candidate trace
- Adjust `scoreCandidate` weights: increase reasoning/drift influence vs briefing fidelity where product policy allows; document per quality mode
- Feature flag gates new penalties when off

## Acceptance criteria

- [ ] Synthetic candidate with absolutisms scores lower when author `certaintyLevel=moderate`.
- [ ] Synthetic early-conclusion text triggers `premature_conclusion` when `conclusionPace=slow`.
- [ ] Derived anti-pattern match reduces drift score.
- [ ] Unit tests per enum dimension; no regression to existing lexical quality tests when flag off.
- [ ] Candidate selection trace includes reasoning drift notes for observability.

## Blocked by

- [68-format-only-presets-voice-resolution.md](./68-format-only-presets-voice-resolution.md)
