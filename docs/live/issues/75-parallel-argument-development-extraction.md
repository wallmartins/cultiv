---
title: Parallel Argument Development Extraction
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Parallel Argument Development Extraction

## Parent

- [`argument-development-signature.md`](../prd/argument-development-signature.md)
- [`issue-argument-development-signature.md`](../prd/issue-argument-development-signature.md)
- [ADR 0007](../../adr/0007-argument-development-signature.md)

## User stories covered

1, 6, 8, 10

## What to build

Add **Argument Development Extraction** to **Voice Profile Rebuild**, running **in parallel** with existing **Reasoning Extraction**. Development extraction reads **Voice Examples** only — it must not receive draft **Core Reasoning Signature** output.

Deliver:

- Extraction prompt + Effect Schema for structured JSON output (development representation v1)
- Orchestration: concurrent calls with Reasoning Extraction inside rebuild pipeline
- Threshold: run when ≥2 active examples; persist with `immature` when &lt;3
- Provider: `voice-extraction-llm` (same routing profile as reasoning unless split is justified)
- Failure handling: on LLM/validation failure for Development leg, keep previous development snapshot; do not block generation or corrupt reasoning leg
- Feature flag `voice.reasoningSignatureV1` gates extraction
- Contract test: Development prompt builder never includes draft Core content

## Acceptance criteria

- [ ] Rebuild with flag on persists development fields after both extractions succeed.
- [ ] Golden fixtures: ≥3 mock author corpora (exploratory, investigative, advocacy-mixed) produce schema-valid development extraction (mocked LLM).
- [ ] Simulated Development extraction failure leaves prior development version active.
- [ ] Parallel execution: Reasoning and Development calls run concurrently (not sequential).
- [ ] Test asserts Development prompt excludes Core draft output.
- [ ] Rebuild with &lt;2 active examples skips Development extraction.

## Blocked by

- [74-argument-development-contracts-persistence.md](./74-argument-development-contracts-persistence.md)
- [67-reasoning-extraction-rebuild.md](./67-reasoning-extraction-rebuild.md)
