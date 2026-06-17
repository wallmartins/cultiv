---
title: PRD - Author Reasoning Signature
doc_type: prd
status: ready-for-agent
domain: text-generation
last_updated: 2026-06-16
---

# PRD: Author Reasoning Signature

## Problem Statement

Generated texts still diverge from the author's real voice even when **Voice Confidence** is high (for example 12 examples across six content types). Outputs tend to:

- Reach conclusions faster than the author would
- Use more judgment and prescription than the author's examples
- Sound more certain than the author's typical stance
- Prioritize rhetorical impact over the author's narrative path
- Match superficial style (tone, first person, lexicon) while missing *how the author thinks*

Root causes identified in investigation and [ADR 0006](../../adr/0006-author-reasoning-signature.md):

1. **Generic cognition in Content Type presets** — `voice-presets.ts` injects narrative rules such as *progress through discovery* for every author on a format, competing with real examples.
2. **Surface-only derivation** — `voice-rebuild-derivation.ts` infers tone, cadence, and lexicon via heuristics only; no reasoning model.
3. **Briefing fidelity ≠ voice fidelity** — `evaluateFidelity` scores overlap with the briefing, not author reasoning.
4. **Shallow drift checks** — `evaluateVoiceDrift` uses substring style markers and sentence length, not certainty, judgment, or conclusion pace.
5. **Self-aligned selection** — no cross-provider judge to catch polished-but-unfaithful candidates.

**Kickoff (exploration only):** [improve-voice-kickoff.md](../refinement/improve-voice-kickoff.md)

## Product Rule (non-negotiable)

> **Author reasoning is learned from Voice Examples, not imposed by Content Type.** Format presets may constrain length and platform shape only. How the author observes, argues, hesitates, and concludes must come from the **Core Reasoning Signature** and optional per-format **Format Expression Profile** — never from generic channel personas.

## Solution

Introduce an **author reasoning signature program** across voice rebuild, generation, evaluation, and dashboard:

1. **Reasoning Extraction** — One structured LLM call per **Voice Profile Rebuild** (Gemini via `voice-extraction-llm`) producing hybrid **Reasoning Signature Representation** (prose + enums), **Derived Anti-Patterns**, and per-format **Format Expression Profile** when ≥2 active examples exist.
2. **Format-only presets** — Strip cognitive/narrative rules from **Content Type Format Preset**; keep word targets and structural constraints.
3. **Step-Scoped Reasoning Injection** — Inject core + format expression into LLM prompts by step depth (`hook` through `expand` full; `refine`/`tighten` guardrails).
4. **Reasoning quality layer** — Extend drift and critic with reasoning-aligned heuristics; adjust scorer weights.
5. **Voice Judge** — Conditional LLM judge on finalists (Groq via `voice-judge-llm`, separate from generation provider).
6. **Voice Reasoning Presentation** — Read-only dashboard section showing what the system inferred.

Governance: [ADR 0006](../../adr/0006-author-reasoning-signature.md) · [implementation plan](../plan/author-reasoning-signature-implementation-plan.md) · [issue parent](./issue-author-reasoning-signature.md)

## User Stories

1. As an **End User** with a solid voice library, I want generated posts to match how I *reason* — not just my vocabulary — so that outputs feel unmistakably mine.

2. As an **End User** who writes more formally on LinkedIn and more casually in threads, I want format-appropriate *expression* without the platform changing how I think, so that channel differences reflect my real habits.

3. As an **End User**, I want to see how Cultiv understands my writing style on the Voice Dashboard, so that I can improve my examples when inference is wrong.

4. As an **End User**, I want the system to avoid guru tone and absolutism when my examples do, so that I do not have to manually list every anti-pattern.

5. As an **End User** generating in `strict` mode, I want the best candidate selected for voice fidelity — not just polish — so that quality mode earns its credit cost.

6. As a **product owner**, I want measurable reasoning drift metrics and a regression corpus, so that we can prove improvement beyond subjective review.

7. As a **backend engineer**, I want reasoning derived once at rebuild and resolved once at generation, consistent with centralized voice profile resolution.

8. As a **backend engineer**, I want judge and extraction on dedicated routing profiles with clear fallbacks, so that provider outages do not block generation.

9. As a **compliance owner**, I want Groq judge usage covered under **Voice Training Consent** and subprocessors documentation, so that author text sent for evaluation is policy-aligned.

10. As a **QA engineer**, I want fixture authors with known reasoning traits and expected guardrail behavior, so that CI can catch regressions in extraction and selection.

## Scope

### In scope (Fase 1 — full program)

- All content types in the official policy catalog with LLM voice steps
- `apps/backend/src/product/voice/*` (rebuild, hints, presets, effective resolution)
- `apps/backend/src/execution/*` (skill templates, step context)
- `packages/text-quality/*` (drift, critic, scorer, judge hook)
- `packages/ai-adapters` (Groq adapter)
- AI policy catalog: `voice-extraction-llm`, `voice-judge-llm`
- `apps/web` Voice Dashboard — **Voice Reasoning Presentation**
- Contracts, domain types, database persistence for reasoning fields
- Regression corpus and baseline for reasoning metrics
- Groq subprocessor / consent note in safety docs

### Out of scope

- Dynamic semantic retrieval for voice examples (deferred until per-format volume exceeds prompt budget)
- Manual editing of derived reasoning fields in the UI
- Per-format *cognitive* profiles (expression only, not separate reasoning modes)
- Replacing the orchestrator or generation pipeline structure
- Multilingual expansion beyond existing pt-BR / en patterns

## Functional Requirements

### FR-1 — Reasoning persistence

- Persist **Core Reasoning Signature**: narrative prose, enums (`certainty_level`, `judgment_frequency`, `conclusion_pace`, `reader_relationship`, `authority_source`), **Derived Anti-Patterns**.
- Persist **Format Expression Profile** per content type when ≥2 active examples: `register`, `opening_style`, `technical_density`, short prose.
- Version with existing **Derived Voice Profile** on rebuild; expose via voice profile screen API.

### FR-2 — Reasoning Extraction (rebuild)

- Trigger: example create, update, batch commit (existing rebuild queue).
- Single structured LLM call per rebuild over all active examples grouped by format.
- Provider: Gemini via `voice-extraction-llm`.
- Validate response with Effect Schema before persist.
- On failure: keep last valid reasoning snapshot; mark diagnostics failed; do not promote heuristic-only reasoning.

### FR-3 — Format-only Content Type presets

- Remove cognitive/narrative `rules`, `styleMarkers`, and `antiPatterns` that impose authorial reasoning from `voice-presets.ts`.
- Retain format constraints: word targets, paragraph expectations, platform conventions.
- `buildVoiceHints` must not override author tone with preset tone when derived profile exists.

### FR-4 — Effective voice resolution

- Merge core reasoning + format expression for requested content type at `resolveEffectiveVoice`.
- Merge **Derived Anti-Patterns** with user-declared `antiPatternsExplicit`.
- Pass reasoning payload to execution and text-quality unchanged (no re-inference downstream).

### FR-5 — Step-Scoped Reasoning Injection

- Add `== AUTHOR REASONING ==` section to system template.
- Structural steps (`hook`, `outline`, `structure`, `draft`, `expand`): full core prose + format expression + enums summary.
- Refinement steps (`refine`, `tighten`): enum guardrails + derived anti-patterns only.
- Voice examples: keep existing per-step limits.

### FR-6 — Reasoning Drift (heuristic)

- Penalties aligned to core enums: absolutism, prescriptive judgment, premature conclusion (position in text), derived anti-pattern hits.
- Integrate into lane runner alongside existing drift score.

### FR-7 — Reasoning Critic (heuristic)

- New finding types: `premature_conclusion`, `excess_certainty`, `rhetorical_inflation`.
- Feed into existing critic score and candidate selection.

### FR-8 — Scorer weight adjustment

- Increase weight of voice/reasoning drift relative to briefing fidelity where product policy allows.
- Document per **Quality Mode** behavior in plan.

### FR-9 — Voice Judge (conditional)

- Run when: reasoning drift borderline (configurable band), top-two tie, or `strict` quality mode.
- Provider: Groq preferred via `voice-judge-llm`; fallback to primary provider; heuristics-only if all providers fail.
- Input: finalist `refinedDraft`, core prose, 1–2 author examples, enum rubric.
- Output: structured scores per dimension + short rationale; merge into selection.

### FR-10 — Voice Reasoning Presentation (dashboard)

- Read-only section on `/app/voice`: core prose, human-readable enum labels, per-format expression cards, derived anti-patterns.
- Localized via **App Locale** (pt-BR, en).
- Copy explains that adding examples refines inference (no edit controls in Fase 1).

### FR-11 — Observability

- Log rebuild extraction success/failure, judge invocation, and fallback reason codes (no example body in logs).

## Non-Functional Requirements

- Rebuild p95 latency increase ≤ 5s for users with ≤20 examples (extraction call).
- Generation p95 increase ≤ 15% in `balanced` with conditional judge (measure on regression corpus).
- Unit tests for extraction schema, drift heuristics, critic findings, judge rubric parser.
- Integration test: rebuild → generate → quality path with fixture author.
- Feature flag `voice.reasoningSignatureV1` for phased rollout and rollback.

## Success Metrics

| Metric | Target (post-rollout) | Notes |
|--------|------------------------|-------|
| Reasoning drift failures on author regression corpus | −40% vs baseline | Fixture authors with known traits |
| `excess_certainty` / `rhetorical_inflation` critic hits on finalists | −50% vs baseline | Before judge |
| Manual blind review: "sounds like me" | ≥ 70% on corpus | Sample of 20 generations |
| Rebuild extraction success rate | ≥ 98% | Excluding provider outages |
| Judge fallback rate | < 5% daily | Groq availability |
| Dashboard reasoning section render | 100% when profile exists | No crash on partial data |

## Testing Decisions

- Golden extraction fixtures: 3 author personas × expected enum/prose shape.
- Regression corpus: minimum 6 author profiles (including high-confidence 12-example set from kickoff tests).
- Per content type: at least 2 briefings × 3 quality modes smoke tests.
- Governance test: presets contain no cognitive narrative rules after migration.
- Showcase samples: revisit after program GA (optional issue in plan).

## Rollout

1. **Alpha** — schema + extraction + presets; flag off; offline eval on corpus.
2. **Beta** — prompts + drift/critic; flag on for internal users / `balanced` only.
3. **GA** — judge + dashboard; flag on all modes; strict always eligible for judge.

Rollback via `voice.reasoningSignatureV1`.

## References

- ADR: [0006-author-reasoning-signature.md](../../adr/0006-author-reasoning-signature.md)
- Kickoff: [improve-voice-kickoff.md](../refinement/improve-voice-kickoff.md)
- Archive ADR: [0001 centralize voice profile resolution](../../archive/adr/0001-centralize-voice-profile-resolution.md)
- Code touchpoints: `voice-rebuild-derivation.ts`, `voice-presets.ts`, `voice-hints.ts`, `skill-templates.ts`, `step-context.ts`, `drift.ts`, `critic.ts`, `lane-runner.ts`, `VoiceDashboard.tsx`
