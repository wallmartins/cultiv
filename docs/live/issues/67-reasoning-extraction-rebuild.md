---
title: Reasoning Extraction on Voice Rebuild
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-16
---

# Reasoning Extraction on Voice Rebuild

## Parent

- [`author-reasoning-signature.md`](../prd/author-reasoning-signature.md)
- [`issue-author-reasoning-signature.md`](../prd/issue-author-reasoning-signature.md)
- [ADR 0006](../../adr/0006-author-reasoning-signature.md)

## User stories covered

1, 4, 8

## What to build

Add **Reasoning Extraction** to **Voice Profile Rebuild**: one structured LLM call per rebuild over all active **Voice Examples**, grouped by content type.

Deliver:

- Extraction prompt + Effect Schema for structured JSON output (`core` + `formatExpressions` map)
- AI policy routing profile `voice-extraction-llm` (Gemini preferred) in official catalog
- Orchestration inside `processUserRebuild` after examples load; merge with existing surface heuristics (tone, cadence, lexicon)
- Failure handling: on LLM/validation failure, keep previous reasoning snapshot; set `pendingRebuild.failed`; do not promote heuristic-only reasoning as substitute
- Observability: log extraction success/failure without example body text
- Feature flag `voice.reasoningSignatureV1` gates extraction (when off, rebuild behaves as today)

Format expressions emitted only for content types with ≥2 active examples.

## Acceptance criteria

- [ ] Creating or updating an example triggers rebuild that persists reasoning fields.
- [ ] Golden fixture: 3 mock author corpora produce schema-valid extraction (mocked LLM in tests).
- [ ] Simulated extraction failure leaves prior reasoning version active.
- [ ] Diagnostics summary reflects in-progress / failed rebuild states without breaking generation.
- [ ] Policy catalog documents `voice-extraction-llm` attempts and timeouts.

## Blocked by

- [66-reasoning-contracts-persistence.md](./66-reasoning-contracts-persistence.md)
