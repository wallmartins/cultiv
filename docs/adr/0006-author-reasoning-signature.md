---
title: Author Reasoning Signature
doc_type: adr
status: accepted
last_updated: 2026-06-16
---

# Author reasoning signature and voice fidelity architecture

Voice generation still diverges from the author even with high **Voice Confidence** (12+ diverse examples). Investigation showed that **Content Type** presets in `voice-presets.ts` inject generic cognitive instructions (for example *progress through discovery*) that compete with author examples, while `evaluateFidelity` measures briefing overlap—not reasoning fidelity—and `evaluateVoiceDrift` only checks superficial markers.

We decided to separate **surface voice** from **author reasoning**, derive reasoning offline during **Voice Profile Rebuild**, inject it step-scoped at generation time, and evaluate finalists with heuristic reasoning checks plus a conditional **Voice Judge** on a different provider.

**Kickoff brief:** [improve-voice-kickoff.md](../live/refinement/improve-voice-kickoff.md) — original exploration questions and hypothesis; this ADR records the refined outcome of that debate.

## Model

### Layer 1 — Voice Examples

User-provided texts remain the source of truth. No manual editing of derived reasoning in Fase 1.

### Layer 2 — Derived profiles (rebuild)

On example create, update, or batch commit—not during generation—the rebuild runs one **Reasoning Extraction** LLM call (Gemini via `voice-extraction-llm`) over all active examples and produces:

- **Core Reasoning Signature** (author-global): hybrid **Reasoning Signature Representation** with narrative prose plus reduced enums (`certainty_level`, `judgment_frequency`, `conclusion_pace`, `reader_relationship`, `authority_source`) and **Derived Anti-Patterns**
- **Format Expression Profile** (per **Content Type**, when ≥2 active examples): register and expression only (`register`, `opening_style`, `technical_density`)—not a different reasoning mode per channel
- **Derived Voice Profile** (existing surface fields: tone, cadence, lexicon, style markers)

On extraction failure, the last valid profile stays active; heuristics-only output is not promoted without a successful extraction.

### Content Type presets

**Content Type Format Preset** carries format constraints only (word targets, paragraph shape, platform conventions). Cognitive and narrative patterns must not be injected from presets when the author has a derived voice.

### Generation

**Step-Scoped Reasoning Injection**:

- Structural LLM steps (`hook`, `outline`, `structure`, `draft`, `expand`): full core narrative + format expression
- Refinement steps (`refine`, `tighten`): enum guardrails only
- Voice examples: scoped by step as today

### Evaluation (Fase 1)

1. **Reasoning Drift** — heuristic penalties aligned to core enums and derived anti-patterns
2. **Reasoning Critic** — extended findings (`premature_conclusion`, `excess_certainty`, `rhetorical_inflation`)
3. **Voice Judge** — conditional on borderline drift, top-candidate tie, or `strict` **Quality Mode**; uses **Voice Judge Routing Profile** with Groq preferred (separate provider family from generation) and fallback to the primary provider; heuristics decide when Groq is unavailable

Dynamic semantic example retrieval remains out of Fase 1 until per-format example volume routinely exceeds prompt budget.

### Product surface

**Voice Reasoning Presentation** on the **Voice Dashboard**: read-only display of core prose, translated enums, per-format expression, and derived anti-patterns. Authors refine by adding examples, not by editing derived fields.

## Considered Options

1. **Examples + presets only** — Rejected. Presets imposed generic cognition; symptoms persisted at high confidence.
2. **Structured enums only** — Rejected. Risks stereotyping and replaces preset generics with extracted generics; prose is needed for generation quality.
3. **Dynamic retrieval only (ICL)** — Deferred. With ~2 examples per format, retrieval adds little after content-type filtering; valuable later at higher per-format volume.
4. **Hybrid core + format expression + conditional judge** — Accepted.

## Provider split

| Workload | Provider | When |
|---|---|---|
| **Reasoning Extraction** | Gemini (`voice-extraction-llm`) | Rebuild (low frequency) |
| **Voice Judge** | Groq preferred (`voice-judge-llm`) | Generation finalists (conditional) |
| **Content generation** | Existing routing profiles | Unchanged |

Separation that matters for quality: **generator ≠ judge**. Extraction may share the primary provider family because it is offline analysis, not self-judging generation output.

## Consequences

- `voice-presets.ts` loses cognitive/narrative rules; format constraints remain.
- `voice-rebuild-derivation.ts` gains LLM extraction orchestration and persistence for reasoning fields.
- `skill-templates.ts` gains `== AUTHOR REASONING ==` with step-scoped depth.
- `packages/text-quality` gains reasoning drift/critic extensions and judge integration; scorer weights should favor voice reasoning over briefing overlap where appropriate.
- `packages/ai-adapters` gains a Groq adapter; AI policy catalog gains `voice-extraction-llm` and `voice-judge-llm` routing profiles.
- `CONTEXT.md` glossary extended (**Core Reasoning Signature**, **Format Expression Profile**, **Derived Anti-Patterns**, **Voice Judge**, etc.).
- **Voice Training Consent** and subprocessors policy must cover Groq when judge sends author material externally.
- Implementation plan and issues should trace to this ADR, not to the kickoff brief alone.
- PRD: [`author-reasoning-signature.md`](../live/prd/author-reasoning-signature.md) · Plan: [`author-reasoning-signature-implementation-plan.md`](../live/plan/author-reasoning-signature-implementation-plan.md)
