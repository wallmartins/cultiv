---
title: AI Provider Adapter Factory
doc_type: issue
status: ready-for-agent
domain: packages
slice_type: AFK
last_updated: 2026-06-24
---

# AI Provider Adapter Factory

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Package: `ai-adapters`

## What to build

Extract duplicated **OpenAI-compatible provider adapters** (OpenAI, Groq, DeepSeek, etc.) into a single factory:

```ts
createOpenAiCompatibleProvider({ name, baseUrl, defaultModel?, supportsModel? })
```

Each provider file becomes a thin config export. Preserve existing registry keys and behavior.

Add normalization tests for at least one additional provider beyond Groq (or parametrized test over all factory instances).

## Acceptance criteria

- [ ] Factory covers all current OpenAI-shaped providers.
- [ ] No behavior change in adapter registry routing.
- [ ] `groq-adapter.test.ts` still passes; ≥1 more provider covered by test.
- [ ] Per-provider files ≤ 15 lines or removed in favor of config table.

## Blocked by

None — can start immediately.
