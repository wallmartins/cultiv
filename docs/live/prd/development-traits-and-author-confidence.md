---
title: PRD - Development Traits and Author Confidence
doc_type: prd
status: ready-for-agent
domain: text-generation
last_updated: 2026-06-17
---

# PRD: Development Traits and Author Confidence

## Problem Statement

[Argument Development Signature](./argument-development-signature.md) (ADR 0007) gives Cultiv a strong **generation** signal — `developmentProse`, moves, transitions, epistemic posture — but authors still cannot answer stable questions about **how they develop texts** with grounded confidence:

- Does the author open from observation or thesis?
- How often do perspective shifts occur?
- Are counterexamples and self-questioning part of the habit?
- Does insight land early or late?
- Does the author close with conclusion or open question?

Today these answers are **implicit** in prose and free-form `moveLabels`. **Voice Confidence** is global (example count/diversity); it does not express *what we know* vs *what we are guessing* per dimension. Dashboard chips help engineers; they do not give authors a mirror they can trust.

**Symptoms:**

- Authors read development prose and ask “is this really me?” without evidence.
- Product cannot surface honest gaps (“we don’t know yet if you use analogies”).
- Regression and QA lack structured ground truth for development dimensions.
- Trait-level disputes between examples are invisible until generation quality suffers.

Root cause: ADR 0007 optimized for **fidelity injection**, not **author-validated structured profile**.

## Product Rule (non-negotiable)

> **Development Traits are inferred from Voice Examples in the same offline extraction as Argument Development Signature — never from a separate Q&A pipeline or author-edited enums in Fase 1.** Per-trait confidence, evidence, and light confirmation build author trust; generation still uses reconciled `developmentProse` as primary guidance.

## Solution

Extend ADR 0007 with [ADR 0008](../../adr/0008-development-traits-and-author-confidence.md):

1. **Development Traits** — Small stable enums answering eight author development questions (seven on Development; validation source links to Core `authoritySource`).
2. **Trait Confidence Pass** — Deterministic post-extraction scoring (`low` / `medium` / `high`, `inferred` / `confirmed` / `disputed` / `unknown`) from example coverage and consistency.
3. **Trait Evidence** — Example id linkage + short excerpts for dashboard disclosure.
4. **Author Development Mirror** — Traits strip under the development hero with confidence indicators and unknown-state copy.
5. **Author Trait Confirmation** — Sim / Não / Não sei for low-confidence or disputed traits; updates diagnostics only, not generation hints.
6. **Voice Next Step by gap** — Targeted CTAs when traits are `unknown` or `disputed`.

Governance: [ADR 0008](../../adr/0008-development-traits-and-author-confidence.md) · [implementation plan](../plan/development-traits-implementation-plan.md) · [issue parent](./issue-development-traits.md)

**Prerequisite:** Argument Development Signature program (issues 74–81) shipped or in GA with `voice.reasoningSignatureV1`.

## User Stories

1. As an **End User**, I want Cultiv to answer “how I develop a text” in clear dimensions (opening, closing, perspective shifts), so that I can validate the profile without parsing long prose.

2. As an **End User**, I want to see **which examples** support each trait, so that I trust the mirror is grounded in my writing — not generic AI copy.

3. As an **End User**, I want honest “we don’t know yet” states when my examples are thin, so that the product does not pretend certainty.

4. As an **End User**, I want to confirm or reject a trait with one tap (Sim/Não/Não sei), so that I can strengthen confidence without editing technical fields.

5. As an **End User** with immature development (&lt;3 examples), I want trait confidence capped and clear next steps, so that I know what kind of example to add next.

6. As an **End User**, I want validation source (“experience vs abstract principles”) shown once via **Core Reasoning Signature**, linked from the development mirror — not duplicated confusingly.

7. As a **product owner**, I want per-trait confidence metrics and confirmation rates, so that we can measure author trust and profile quality.

8. As a **backend engineer**, I want traits in the **same** development extraction JSON (zero extra LLM calls), with deterministic confidence recomputation on rebuild, so that cost stays aligned with ADR 0007.

9. As a **backend engineer**, I want trait disputes to feed **Voice Signature Divergence Check**, so that reconciliation harmonizes structured and prose layers together.

10. As a **QA engineer**, I want persona fixtures with expected traits and `pnpm eval:development-traits`, so that CI guards regression on author-facing answers.

## Scope

### In scope (Fase 1)

- `DevelopmentTraits`, `TraitRecord`, `DevelopmentTraitProfile` contracts and persistence on **Derived Voice Profile**
- Extended **Argument Development Extraction** prompt/schema: `traits` + `traitEvidence`
- **Trait Confidence Pass** (deterministic, no LLM)
- Trait-aware **Voice Signature Divergence Check** and reconciliation harmonization
- **VoiceReasoningPresentationView** / API exposure of traits + records + evidence excerpts
- **Author Development Mirror** UI: traits strip, confidence dots, Core authority cross-link
- **Trait Evidence** disclosure in **Voice Dashboard Detail Layer**
- **Author Trait Confirmation** API + diagnostics audit (one card per visit max)
- **Voice Next Step** copy mapping for trait gaps (`unknown`, `disputed`)
- i18n pt-BR + en for trait labels and confirmation copy
- Regression corpus extension + `pnpm eval:development-traits`
- Observability: `trait_confidence_computed`, `trait_confirmation_recorded`
- Same feature flag: `voice.reasoningSignatureV1`

### Out of scope

- Separate third LLM “development Q&A” pipeline
- Author-editable trait enum forms
- Trait confidence overriding **Voice Adaptation Mode** in v1
- Per-format development traits
- User-visible reconciliation conflict UI
- Trait-driven generation replacing `developmentProse` (compact trait summary in prompt optional, prose remains primary)
- **Argument Development Drift** v2 heuristics keyed on traits (follow-on after regression corpus)

## Functional Requirements

### FR-1 — Development Traits persistence

- Extend **Argument Development Signature** with optional `traitProfile: DevelopmentTraitProfile`.
- `DevelopmentTraits` fields: `openingMode`, `perspectiveShiftDensity`, `usesCounterexamples`, `selfQuestioning`, `insightTiming`, `usesAnalogies`, `closingMode` (literals per ADR 0008).
- Each trait has `TraitRecord`: `value`, `confidence`, `status`, `evidenceExampleIds[]`.
- Persist on **Derived Voice Profile**; round-trip on rebuild.
- Expose via voice profile screen API for dashboard and SDK.

### FR-2 — Extraction v2 (same LLM call)

- **Argument Development Extraction** returns `development` (unchanged) + `traits` + LLM-proposed `traitEvidence`.
- Prompt instructs: infer traits from examples only; do not read draft Core; enum literals in English; traitEvidence uses example ids present in input.
- Validate with Effect Schema before confidence pass.
- On extraction failure: keep last valid profile including last `traitProfile` if present.

### FR-3 — Trait Confidence Pass

- Deterministic module after successful development extraction.
- Rules per ADR 0008: `unknown` when no signal; `low`/`medium`/`high` from 1/2/3+ supporting examples; `disputed` on contradiction; cap at `medium` when development immature (&lt;3 active examples).
- Normalize `traitEvidence` to valid active example ids; drop invalid references.
- Emit internal observability event with trait key counts by confidence/status.

### FR-4 — Divergence and reconciliation

- Extend **Voice Signature Divergence Check**:
  - `insightTiming: late` vs Core `conclusionPace: fast`
  - `openingMode: thesis` vs exploratory posture + doubt-heavy moves
  - ≥2 traits with `status: disputed`
- **Voice Signature Reconciliation** harmonizes traits with Core + Development prose when invoked.
- On reconciliation failure: keep last valid full profile.

### FR-5 — Author Development Mirror (dashboard)

- Below development hero prose: **Development Traits strip** with sentence-case labels and confidence indicators (●●● / ●●○ / ●○○).
- `unknown` traits: dash + localized gap copy (not invented values).
- Link to Core chip for `authoritySource` (question 7) — no duplicate trait.
- Immature development: existing `developmentImmature` copy + trait confidence cap.
- **Trait Evidence** collapsible in detail layer: ≤200 char excerpts + content type + link to examples.

### FR-6 — Author Trait Confirmation

- API endpoint to record Sim / Não / Não sei per trait key.
- Sim → `status: confirmed`, confidence bump (cap `high`); stored in **Voice Diagnostics** audit only.
- Não → `status: disputed`, targeted **Voice Next Step**; does not mutate generation hints.
- Não sei → no change; dismiss card until next visit.
- UI: at most one confirmation card per dashboard visit; prioritize lowest confidence or `disputed`.

### FR-7 — Voice Next Step by gap

- Map trait `unknown` / `disputed` to existing or new `nextActionCodes` with localized CTA (pt-BR + en).
- Examples: unknown analogies → add argumentative example; disputed closing → review conflicting examples.

### FR-8 — Generation trait pass-through (issue 87)

- Pass reconciled `traitProfile` through voice hints, `mergeVoiceProfile`, and `resolveEffectiveVoice` when flag on.
- Extend `VoiceSignalSummary` / snapshot `appliedSignals` with development trait summary when traits applied.
- Optional single-line trait summary in `== ARGUMENT DEVELOPMENT ==` on structural steps only; include high-confidence or `confirmed` traits; exclude `unknown` / `disputed`.
- `developmentProse` remains primary; trait line is additive guardrail.
- Shipped in issue 87 (evaluated separately from dashboard mirror).

### FR-9 — Observability

- Internal events: trait confidence computed, trait confirmation recorded.
- No trait evidence bodies in user-facing logs beyond dashboard excerpts.

## Non-Functional Requirements

- **Zero** additional LLM calls vs ADR 0007 rebuild (traits in same extraction request).
- Trait confidence pass: &lt;50ms p95 on typical example sets (&lt;20 active).
- Dashboard: traits strip renders without layout shift when `traitProfile` absent (graceful degrade).
- Unit tests: confidence rules, divergence trait rules, API confirmation, mirror unknown state.
- Integration: rebuild persists traits + evidence; confirmation updates diagnostics only.
- Feature flag: `voice.reasoningSignatureV1` (no new flag).

## Success Metrics

| Metric | Target (post-rollout) | Notes |
|--------|------------------------|-------|
| Authors with ≥3 examples see ≥5 traits with `medium`+ confidence | ≥80% | Excludes intentional `unknown` |
| Trait confirmation “Sim” rate on prompted cards | ≥60% | Low-confidence prompts only |
| “Não” rate without subsequent example add (7d) | Monitor | Product health signal |
| `unknown` traits per mature profile | ≤2 median | Honest gaps, not over-extraction |
| `pnpm eval:development-traits` CI | 100% pass | Persona corpus |
| Dashboard crash when `traitProfile` absent | 0 | Graceful degrade |
| Reconciliation rate increase from trait disputes | ≤+5% vs ADR 0007 baseline | Monitor |

## Testing Decisions

- Golden extraction: ≥3 personas with expected `traits` + `traitEvidence`.
- Confidence pass fixtures: 1/2/3 example thresholds; contradiction → `disputed`; immature cap.
- Divergence: trait/Core mismatch fixtures trigger reconciliation.
- Mirror component tests: strip, unknown, evidence disclosure, immature cap.
- Confirmation API: Sim/Não/Não sei diagnostics audit; generation hints unchanged on Não.
- Extend reasoning-regression personas with `expectedTraits`.
- Script: `pnpm eval:development-traits`.

## Rollout

1. **Alpha** — contracts + extraction v2 + confidence pass; flag internal; offline eval.
2. **Beta** — divergence/reconciliation trait rules; mirror UI without confirmation.
3. **GA** — confirmation loop + next steps by gap + CI eval script.

Rollback: disable `voice.reasoningSignatureV1` (reverts reasoning + development + traits stack).

## References

- ADR: [0008-development-traits-and-author-confidence.md](../../adr/0008-development-traits-and-author-confidence.md)
- Extends: [0007-argument-development-signature.md](../../adr/0007-argument-development-signature.md) · [0006-author-reasoning-signature.md](../../adr/0006-author-reasoning-signature.md)
- Parent ADS PRD: [argument-development-signature.md](./argument-development-signature.md)
- Glossary: [CONTEXT.md](../../../CONTEXT.md)
