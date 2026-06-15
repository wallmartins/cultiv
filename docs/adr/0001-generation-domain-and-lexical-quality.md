---
title: Generation Domain and Lexical Quality
doc_type: adr
status: accepted
last_updated: 2026-06-11
---

# Generation domain classification and lexical quality contracts

Text generation currently splits word-length targets between prompts (`skill-templates.ts`) and candidate selection (`output-length.ts`), injects lexicon with instructions to reuse favored terms, appends full `context.state` to every LLM call, and scores fidelity by token overlap with the briefing. Together these mechanisms reward repetition and technical jargon even when the briefing is non-technical.

We decided to introduce a **GenerationContext** resolved once per run: unified **OutputWordTarget**, a **DomainClassifier** (`non-technical` | `technical` | `mixed`), and a **PromptPolicy** that forbids technical jargon, tool names, and software metaphors unless the classified domain allows them. Lexicon injection becomes sparse and domain-filtered; pipeline steps receive step-scoped voice context; `context.state` is minimized in the adapter; and **text-quality** gains document-level lexical metrics plus a **LexicalReleaseGate** that can re-roll or fail closed in strict mode.

## Considered Options

1. **Prompt-only fix** — Strengthen system instructions without changing scoring or lexicon. Rejected because selection still favors long, repetitive candidates and fidelity still rewards copying briefing tokens.
2. **Post-hoc humanizer regex** — Strip tech terms after generation. Rejected because it damages legitimate technical content and cannot fix structural repetition or hook echo.
3. **Unified contracts + domain gate** — Accepted. One source of truth for length; domain decided up front; enforcement in prompts, lexicon, critic, selector, and optional gate.

## Consequences

- `packages/text-quality` owns `DomainClassifier`, lexical metrics, and release gate; backend propagates `GenerationContext` into skills and quality lanes.
- `architecture-post` and `validation-post` default to `technical`; `linkedin-post` and `newsletter` default to `non-technical` unless briefing signals override.
- Author voice examples remain authoritative for tone and cadence; technical tokens in training examples are filtered from lexicon when domain is `non-technical`.
- Short-format pipelines gain or fix a shared `tighten` condensation step (LinkedIn add, thread fix miswired refine); optional for newsletter; policy catalog version bump required.
- `ContentTypeQualityProfile` configures scorer and gate behavior per content type, not LinkedIn-only.
- Feature flag `generation.lexicalQualityV2` per content type enables phased rollout and rollback.
- Regression corpus and baseline metrics live in `tests/fixtures/lexical-regression/` (see implementation plan).
