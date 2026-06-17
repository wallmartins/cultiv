---
title: Author Reasoning Signature Program
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-16
---

# Author Reasoning Signature Program

## Parent

- PRD: [`author-reasoning-signature.md`](./author-reasoning-signature.md)
- ADR: [`../../adr/0006-author-reasoning-signature.md`](../../adr/0006-author-reasoning-signature.md)
- Plan: [`../plan/author-reasoning-signature-implementation-plan.md`](../plan/author-reasoning-signature-implementation-plan.md)
- Kickoff: [`../refinement/improve-voice-kickoff.md`](../refinement/improve-voice-kickoff.md)

## User stories covered

1–10 (full PRD)

## What to build

End-to-end **author reasoning signature program**: offline reasoning extraction on voice rebuild, format-only content type presets, step-scoped reasoning injection in generation prompts, heuristic reasoning drift/critic, conditional **Voice Judge** on Groq, and read-only **Voice Reasoning Presentation** on the Voice Dashboard.

Child issues are sliced as issues `66`–`73` below.

## Child issues

| # | Issue | Epic |
|---|-------|------|
| 66 | [Reasoning contracts and persistence](../issues/66-reasoning-contracts-persistence.md) | A — Contracts |
| 67 | [Reasoning extraction on rebuild](../issues/67-reasoning-extraction-rebuild.md) | B — Extraction |
| 68 | [Format-only presets and voice resolution](../issues/68-format-only-presets-voice-resolution.md) | C — Presets |
| 69 | [Step-scoped reasoning prompts](../issues/69-step-scoped-reasoning-prompts.md) | D — Generation |
| 70 | [Reasoning drift and critic](../issues/70-reasoning-drift-critic.md) | E — Quality |
| 71 | [Voice Judge and Groq adapter](../issues/71-voice-judge-groq.md) | F — Judge |
| 72 | [Voice Reasoning Presentation](../issues/72-voice-reasoning-presentation.md) | G — Dashboard |
| 73 | [Reasoning regression and policy](../issues/73-reasoning-regression-policy.md) | H — Regression |

## Program acceptance criteria

- [ ] ADR 0006 accepted; PRD and plan indexed in live docs READMEs.
- [ ] All child issues `done`; regression baseline documented.
- [ ] Content type presets contain no cognitive/narrative author rules.
- [ ] High-confidence fixture author: manual review shows clear improvement on reasoning symptoms from kickoff.
- [ ] Voice Dashboard shows read-only reasoning presentation when profile exists.
- [ ] Judge runs on strict and conditional paths; Groq fallback documented and tested.
- [ ] Feature flag `voice.reasoningSignatureV1` documented; rollout completed or deferred with owner note.

## Suggested order

`66 → 67 → 68 → (69 ∥ 70 ∥ 72) → 71 → 73`
