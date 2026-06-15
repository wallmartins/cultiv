---
title: Step-Scoped Context and Minimal Adapter Payload
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-11
---

# Step-Scoped Context and Minimal Adapter Payload

## Parent

- [`text-generation-lexical-quality.md`](../prd/text-generation-lexical-quality.md)
- [`issue-text-generation-lexical-quality.md`](../prd/issue-text-generation-lexical-quality.md)

## User stories covered

3, 9

## What to build

**`step-context.ts`:** `buildStepVoiceContext(stepName, voiceProfile, domain)` — matrix applies to **all** LLM steps across catalog pipelines:

| Step | Examples | Lexicon | Prior output in user msg |
|------|----------|---------|--------------------------|
| hook | 1 short | omit | briefing only |
| outline / structure / research | 2 | filtered max 2 | briefing + prior material |
| draft / expand | up to 6 | filtered max 3 | prior step output |
| refine | 1–2 | omit | draft + briefing summary |
| tighten | 0 | omit | draft/refine output + word target |
| analyze | 0 | omit | briefing only |

**`skills.ts`:** use step-scoped voice context instead of full profile on every step.

**`pipeline-execution-adapter.ts`:** replace `JSON.stringify(context.state)` with `buildStepContext(stepName, state)` whitelist — never re-send full `voiceProfile` if already in system prompt.

## Acceptance criteria

- [ ] Refine user payload measurably smaller than today (fixture test: < 50% bytes).
- [ ] Refine step receives no lexicon block in user message.
- [ ] Integration tests: coherent output for `linkedin-post`, `twitter-thread`, and `newsletter` pipelines.
- [ ] `architecture-post` structure/draft/refine steps receive structure-appropriate prior output only.

## Blocked by

- `19-prompt-policy-domain-prompts.md`
