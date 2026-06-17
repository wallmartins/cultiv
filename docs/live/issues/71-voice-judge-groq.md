---
title: Voice Judge and Groq Adapter
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-16
---

# Voice Judge and Groq Adapter

## Parent

- [`author-reasoning-signature.md`](../prd/author-reasoning-signature.md)
- [`issue-author-reasoning-signature.md`](../prd/issue-author-reasoning-signature.md)
- [ADR 0006](../../adr/0006-author-reasoning-signature.md)

## User stories covered

5, 8, 9

## What to build

Implement conditional **Voice Judge** with Groq adapter and dedicated routing profile.

Deliver:

- `packages/ai-adapters`: Groq provider (OpenAI-compatible transport)
- AI policy `voice-judge-llm`: Groq preferred (e.g. `llama-3.3-70b-versatile`), fallback to primary Gemini model
- `evaluateWithVoiceJudge`: structured rubric scoring finalist `refinedDraft` against core prose, enums, 1–2 author examples
- Invocation rules:
  - `fast`: never
  - `balanced`: when reasoning drift borderline (configurable band, default 60–80) or top-two tie
  - `strict`: always on top-two finalists
- On Groq 429/unavailable: fallback provider; if all fail, heuristics-only selection (generation must not fail)
- Env: `GROQ_API_KEY` documented in deployment reference
- Feature flag `voice.reasoningSignatureV1` gates judge

## Acceptance criteria

- [ ] Groq adapter unit tests with mocked transport; registry resolves `groq` provider.
- [ ] Strict mode invokes judge in integration test (mocked Groq).
- [ ] Balanced mode skips judge when drift clearly good/bad; invokes on borderline fixture.
- [ ] Fast mode never calls judge (assert call count).
- [ ] Fallback path tested when preferred provider returns 429.
- [ ] Judge prompt does not log full example bodies.

## Blocked by

- [70-reasoning-drift-critic.md](./70-reasoning-drift-critic.md)
