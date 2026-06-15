---
title: PRD - Text Generation Lexical Quality
doc_type: prd
status: ready-for-agent
domain: text-generation
last_updated: 2026-06-11
---

# PRD: Text Generation Lexical Quality

## Problem Statement

Generated texts repeat the same words and technical jargon across runs and within a single piece — for example *cache*, *versão*, *deploy*, *stack* — even when the briefing is about career, learning, communication, or other non-technical themes. Users perceive output as generic, artificially “tech-brained,” and unlike their natural voice.

Root causes are structural, not model-specific:

1. **Split length contracts** — Prompts target ~130–220 words for LinkedIn while candidate selection scores against 800–1200 words, favoring long outputs with room to repeat.
2. **Lexicon injection** — Profile and preset lexicons are merged and the model is told to “weave them in naturally,” amplifying high-frequency training tokens (often technical).
3. **State echo** — Full `context.state` JSON is appended to every LLM user message, duplicating voice metadata and prior steps.
4. **Weak repetition detection** — Critic only flags the same word three times in a row at low severity.
5. **Fidelity overlap** — Scoring rewards repeating briefing tokens verbatim.
6. **No domain gate** — Prompts mention avoiding tech imagery but nothing enforces it at selection or release time.

## Product Rule (non-negotiable)

> **Do not use technical jargon, technical terms, or technology/product names** unless the **theme and intent of the text** are genuinely technical or technological. Use jargon and technical vocabulary only when the classified generation domain requires it.

## Solution

Introduce a **lexical quality program** across backend execution and `text-quality`:

1. **Unified OutputWordTarget** — Single module for word ranges consumed by prompts, critic, and candidate selector.
2. **DomainClassifier** — Classify each generation as `non-technical`, `technical`, or `mixed` from briefing, topic, and content type.
3. **PromptPolicy** — Domain-aware system and step instructions; sparse lexicon; anti-echo rules on refine/tighten.
4. **Step-scoped voice context** — Different voice/example/lexicon payloads per pipeline step; minimal `context.state` in the adapter.
5. **Lexical quality scoring** — Document-level repetition metrics, tech-term hits when domain is non-technical, improved fidelity.
6. **LexicalReleaseGate** — Post-selection validation with re-roll (balanced) or fail-closed (strict).
7. **LinkedIn tighten step** — Condense and de-repeat after refine.
8. **Regression corpus** — Fixed briefings with objective metrics and baseline tracking.

Governance: [ADR 0001](../../adr/0001-generation-domain-and-lexical-quality.md) · [implementation plan](../plan/text-generation-lexical-quality-implementation-plan.md) · [issues 17–26](../issues/README.md).

## User Stories

1. As an **End User** generating a LinkedIn post about career or personal growth, I want the output free of software metaphors and tech jargon, so that the post sounds like me talking to my network — not like a engineering blog.

2. As an **End User** generating an architecture post, I want accurate technical terminology when the briefing is technical, so that the content remains credible to a technical audience.

3. As an **End User**, I want the same word or jargon not repeated unnecessarily within one post, so that the text feels edited rather than padded.

4. As an **End User** running multiple generations on different topics, I want vocabulary to vary across runs, so that my feed does not look like the same template with different nouns.

5. As an **End User** with a voice profile trained on technical writing, I want non-technical briefings to still produce accessible language, so that my training corpus does not force tech vocabulary into every format.

6. As an **End User** generating LinkedIn content, I want posts within feed-appropriate length (~130–220 words), so that I do not need heavy manual trimming.

7. As a **product owner**, I want objective regression metrics (tech hits, repetition, length compliance), so that we can prove improvement and catch regressions in CI.

8. As a **backend engineer**, I want generation domain and word targets defined once per run, so that prompts and quality scoring cannot diverge silently.

9. As a **backend engineer**, I want step-scoped context and a minimal adapter payload, so that LLM calls are cheaper and less prone to echo.

10. As a **QA engineer**, I want a fixed corpus of briefings with expected domain classification and quality thresholds, so that changes are testable without manual spot checks alone.

## Scope

### In scope

- All content types in official policy catalog that use LLM text steps: `linkedin-post`, `twitter-thread`, `newsletter`, `long-form-blog`, `architecture-post`, `validation-post`
- `apps/backend/src/execution/*` (skills, templates, adapter, voice hints)
- `packages/text-quality/*` (critic, fidelity, selector, new domain/lexical modules)
- Policy catalog version bump for LinkedIn `tighten` step
- Showcase regeneration guide and fixture audit (issue 26)
- Feature flag for phased rollout

### Out of scope

- Changing AI providers or routing profiles
- Replacing the orchestrator or full pipeline engine
- Embeddings / semantic retrieval for voice examples (future epic)
- Authenticated app UI beyond showcase content
- Multilingual expansion beyond existing pt-BR / en support patterns

## Functional Requirements

### FR-1 — Unified word targets

- One canonical `resolveOutputWordTarget(contentType)` used by prompts and quality.
- LinkedIn: min 130, max 220, ideal 170 (unless ADR/plan amended later).

### FR-2 — Domain classification

- Output: `GenerationDomain`, `confidence`, `signals`, `allowTechnicalLexicon`, `allowTechMetaphors`.
- Defaults: `architecture-post`, `validation-post` → `technical`; `linkedin-post`, `newsletter` → `non-technical` unless briefing overrides.
- Heuristic classifier v1; optional LLM classify in `strict` when confidence is low.

### FR-3 — Domain-aware prompts

- `non-technical`: forbid tech jargon, tool names, software metaphors except literal briefing quotes.
- `technical`: allow domain-appropriate terminology; still limit repetition.
- `mixed`: technical terms only where briefing requires; accessible language elsewhere.
- Lexicon instruction: use sparingly; max once per term unless essential.

### FR-4 — Filtered lexicon and voice hints

- Remove tech tokens from injected lexicon when domain is `non-technical`.
- Do not merge generic English preset lexicon when profile lexicon is sufficient.
- Localize preset lexicon by target language where applicable.

### FR-5 — Step-scoped context

- Hook: 1 short example, no lexicon list.
- Draft: filtered lexicon (max 3), up to 6 examples.
- Refine: no lexicon; instruction to vary vocabulary and not repeat hook verbatim.
- Tighten: length + de-repeat focus only.
- Adapter: whitelist step context instead of full `context.state`.

### FR-6 — Lexical quality metrics

- Type-token ratio, top-term concentration, repeated bigrams, hook–body overlap.
- Tech-term hit list (configurable policy JSON) when domain is `non-technical`.
- Critic severity scales with metric thresholds.

### FR-7 — Fidelity without copy-paste

- Penalize verbatim briefing phrases; score content-word overlap with caps.

### FR-8 — Release gate

- `strict`: re-roll once on gate failure, then fail.
- `balanced`: re-roll on gate failure.
- `fast`: score penalty only.
- Gate disabled for `technical` domain tech-term checks (repetition checks still apply).

### FR-9 — Format-aware condensation (short formats)

- **`linkedin-post`:** add `tighten` after `refine` → `hook → draft → refine → tighten → sanitize`.
- **`twitter-thread`:** replace miswired step (today `tighten` runs the `refine` skill) with a real `tighten` skill — condense to word target and de-repeat while preserving thread flow.
- **`newsletter`:** optional `tighten` before `finalize` when output exceeds max word target or lexical metrics fail in draft/refine.
- **`long-form-blog`, `architecture-post`, `validation-post`:** no mandatory new step; rely on refine + lexical critic/gate (long-form tolerates more length but still penalizes repetition and off-domain jargon).

Condensation rules live in one shared `tighten` skill definition; only catalog step lists differ per format.

### FR-10 — Per-format quality weights

- `ContentTypeQualityProfile` configures critic / fidelity / drift / lexical weights and gate strictness per content type (not LinkedIn-only).
- Short social formats weight lexical diversity and domain compliance higher; long technical formats weight fidelity and technical appropriateness higher.

### FR-11 — Observability

- Log domain classification, gate outcomes, and lexical metric summary on generation (no PII in logs).

## Non-Functional Requirements

- Regression eval script runnable locally (`pnpm eval:lexical` or equivalent).
- No increase in p95 latency > 25% for LinkedIn balanced mode after tighten + gate (measure in issue 25).
- All new modules covered by unit tests; integration tests for end-to-end generation on fixture briefings.

## Format coverage

The program applies to **all six** catalog content types. Only some gaps are LinkedIn-specific:

| Content type | Word target prompt vs quality | Domain default | Condensation step | Lexical gate |
|--------------|------------------------------|----------------|-------------------|--------------|
| `linkedin-post` | **Misaligned** (130–220 vs 800–1200) | `non-technical` | Add `tighten` | Full |
| `twitter-thread` | Aligned | briefing-based | Fix `tighten` skill | Full |
| `newsletter` | Aligned | `non-technical` | Optional `tighten` | Full |
| `long-form-blog` | Aligned | briefing-based | — | Full (repetition; jargon if non-tech briefing) |
| `architecture-post` | Aligned | `technical` | — | Repetition only; tech terms allowed |
| `validation-post` | Aligned | `technical` | — | Repetition + fidelity |

**Universal (all formats):** domain classifier, prompt policy, filtered lexicon, step-scoped context, minimal adapter payload, lexical critic, fidelity fix, release gate (with domain-aware rules).

**LinkedIn was the canary** because length scoring actively selected against the prompt contract. Other formats already agree on word targets but still suffer from lexicon injection, state echo, weak repetition detection, and missing domain enforcement.

## Success Metrics

| Metric | Target (post-rollout) | Formats |
|--------|------------------------|---------|
| Tech hits in `non-technical` briefings | 0 | all |
| Length compliance (per `OutputWordTarget`) | > 90% | all |
| Top-term concentration | < 8% per lemma | all |
| Type-token ratio (short formats) | > 0.45 | linkedin, thread |
| Repeated bigrams (≥3 occurrences) | −50% vs baseline | all |
| User-visible “same word irritated me” (manual sample) | Subjective improvement | all |

## Testing Decisions

- Unit tests per module (classifier, lexical metrics, word targets, prompt policy snapshots).
- Golden prompt snapshots for 3 domains × 3 steps.
- Fixture corpus: 30 briefings (15 non-tech, 10 tech, 5 mixed).
- Update `text-quality-package.test.ts` expectations to match unified word targets.
- Regression corpus: at least 5 briefings per content type (30 total minimum).
- Showcase samples (LinkedIn + thread minimum) regenerated after issue 24 complete.

## Rollout

1. **Alpha** — issues 17–20; offline eval on corpus.
2. **Beta** — issues 21–24; flag on for `balanced` LinkedIn.
3. **GA** — flag on all content types; strict gate enabled; showcase updated.

Rollback via `generation.lexicalQualityV2` per content type.

## References

- Prior analysis: conversation study on repetition and jargon (2026-06)
- Code touchpoints: `skill-templates.ts`, `output-length.ts`, `voice-hints.ts`, `pipeline-execution-adapter.ts`, `critic.ts`, `fidelity.ts`, `candidate-selector.ts`
- Archive ADR: [0001 centralize voice profile resolution](../../archive/adr/0001-centralize-voice-profile-resolution.md)
