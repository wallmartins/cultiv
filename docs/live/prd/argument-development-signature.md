---
title: PRD - Argument Development Signature
doc_type: prd
status: ready-for-agent
domain: text-generation
last_updated: 2026-06-17
---

# PRD: Argument Development Signature

## Problem Statement

Generated texts still miss **how the author develops a piece** even when [Author Reasoning Signature](./author-reasoning-signature.md) (ADR 0006) is active. Outputs may match surface tone, lexicon, and cognitive traits (**Core Reasoning Signature**) while following the wrong argumentative arc — for example defending a thesis early when the author's examples show lived experience → doubt → experimentation → conclusion.

Symptoms observed in review and grill sessions:

- Premature thesis or conclusion placement despite moderate **certainty** and slow **conclusion pace** on Core
- Generic “observation → thesis → conclusion” structure imposed by model defaults
- **Voice Judge** and **Reasoning Drift** catch rhetorical inflation but not structural development drift
- Core `narrativeProse` alone collapses “who I am as a thinker” and “how my texts unfold”

Root cause: ADR 0006 models author cognition and channel expression, not **text development** as a distinct author-global signal.

**Exploration (not source of truth):** [author-layers-kickoff.md](../kickoff/author-layers-kickoff.md)

## Product Rule (non-negotiable)

> **How an author develops a text is learned from Voice Examples, not imposed by Content Type or a Cultiv phase template.** **Argument Development Signature** captures argumentative moves, transition tendencies, epistemic posture while writing, and structural anti-patterns — inferred offline, reconciled internally when needed, and never edited manually in Fase 1.

## Solution

Extend the author reasoning program ([ADR 0006](../../adr/0006-author-reasoning-signature.md), [ADR 0007](../../adr/0007-argument-development-signature.md)) with **Argument Development Signature**:

1. **Argument Development Extraction** — Structured LLM call in parallel with **Reasoning Extraction** during **Voice Profile Rebuild**, reading **Voice Examples** only (blind to draft Core output).
2. **Voice Signature Divergence Check** — Deterministic post-extraction check for enum/posture conflicts, prose collapse, and incompatible structural anti-patterns.
3. **Voice Signature Reconciliation** — Conditional LLM harmonization only when divergence is detected; examples remain ground truth; failures keep last valid profile.
4. **Step-Scoped Reasoning Injection** — New `== ARGUMENT DEVELOPMENT ==` prompt block alongside `== AUTHOR REASONING ==`.
5. **Argument Development Drift** — Heuristic scoring in **every Quality Mode** (`fast`, `balanced`, `strict`).
6. **Voice Judge reinforcement** — Balanced mode also triggers on development-drift borderline; strict judge receives Core + Development; judge never replaces heuristic development checks.
7. **Voice Reasoning Presentation** — Second hero block on **Voice Dashboard** (“how I develop a text”).

Governance: [ADR 0007](../../adr/0007-argument-development-signature.md) · [implementation plan](../plan/argument-development-signature-implementation-plan.md) · [issue parent](./issue-argument-development-signature.md)

**Prerequisite:** Author Reasoning Signature program (issues 66–73) shipped or in GA with `voice.reasoningSignatureV1`.

## User Stories

1. As an **End User** whose writing unfolds through doubt and experimentation, I want generated posts to follow my developmental path — not jump to conclusions — so that outputs feel like my real process of thinking on the page.

2. As an **End User** with high **Voice Confidence**, I want Cultiv to distinguish *how I think* from *how I develop a text*, so that the dashboard reflects both dimensions clearly.

3. As an **End User**, I want structural mistakes (premature thesis, advocacy arc when I write exploratively) penalized even in `fast` mode, so that quick generations still respect my development style.

4. As an **End User** in `balanced` mode, I want borderline development fidelity to trigger a second opinion (**Voice Judge**), so that close calls favor my argumentative habits.

5. As an **End User** in `strict` mode, I want finalists judged on both Core and Development signatures, so that quality mode improves structural fidelity — not only rhetorical polish.

6. As an **End User**, I want to refine development inference by adding examples — not by editing derived fields — so that the product stays trustworthy and simple.

7. As a **product owner**, I want development drift metrics on the regression corpus, so that we can measure improvement on the original kickoff symptoms.

8. As a **backend engineer**, I want parallel extraction without anchoring bias, with reconciliation only on real conflicts, so that rebuild cost stays predictable (2 calls typical, 3 on divergence).

9. As a **backend engineer**, I want development fields passed through voice hints and profile merge unchanged, so that execution receives the full reconciled profile.

10. As a **QA engineer**, I want fixture authors with known development arcs (exploratory vs advocacy-mixed), so that CI catches regressions in extraction, drift, and judge triggers.

## Scope

### In scope (Fase 1 — full program)

- **Argument Development Signature** types, persistence, and profile screen API fields
- Parallel **Argument Development Extraction** + existing **Reasoning Extraction** on rebuild
- **Voice Signature Divergence Check** (deterministic) and conditional **Voice Signature Reconciliation**
- `== ARGUMENT DEVELOPMENT ==` injection in generation prompts (step-scoped)
- **Argument Development Drift** + structural anti-pattern critic findings
- **Voice Judge** policy update (`balanced` development-drift borderline; judge prompt includes Development)
- **Voice Dashboard** second hero block + trait chips (moves, epistemic posture)
- Voice hints / profile merge pass-through for development fields
- Regression corpus extension and baseline for development metrics
- Observability: reconciliation invoked / skipped (internal only)
- Same feature flag: `voice.reasoningSignatureV1`

### Out of scope

- Fixed argumentative phase templates or Cultiv-owned move ontology
- Separate feature flag for Development-only rollout
- User-visible extraction conflict or reconciliation UI
- Manual editing of development fields on dashboard
- Per-format development profiles (development is author-global in v1)
- Deeper Core extraction quality overhaul (deferred post-Development ship)
- Dynamic semantic example retrieval

## Functional Requirements

### FR-1 — Development persistence

- Persist **Argument Development Signature** on **Derived Voice Profile**: `developmentProse`, `moveLabels[]`, `transitionTendencies[]`, `epistemicPosture`, `structuralAntiPatterns[]`.
- Expose via voice profile screen API alongside Core and Format Expression.
- Mark signature **immature** when active examples &lt; 3 (aligned with **Voice Confidence**); extraction runs when ≥2 active examples.

### FR-2 — Parallel extraction (rebuild)

- Trigger: same as existing rebuild (example create, update, batch commit).
- **Reasoning Extraction** and **Argument Development Extraction** run concurrently; Development prompt must not receive draft Core output.
- Provider: `voice-extraction-llm` (or dedicated profile if split later).
- Validate with Effect Schema before any reconciliation step.
- On extraction failure for either leg: keep last valid full profile; do not block generation.

### FR-3 — Divergence check and reconciliation

- After both extractions succeed, run **Voice Signature Divergence Check** (no LLM):
  - Epistemic posture vs Core enums (e.g. `exploratory` + `certaintyLevel: high`)
  - Judgment/development mismatch (e.g. doubt moves + `judgmentFrequency: high`)
  - Prose collapse (Core and Development narratives near-duplicate)
  - Structural anti-patterns incompatible with Core traits
- If conflict: **Voice Signature Reconciliation** LLM call with examples + draft Core + draft Development + draft Format → single coherent persist.
- If no conflict: persist parallel drafts unchanged.
- On reconciliation failure: keep last valid profile; log internal event.

### FR-4 — Effective voice resolution

- `resolveEffectiveVoice` and voice hints include reconciled **Argument Development Signature** when flag on and ≥2 examples.
- Profile merge (`mergeVoiceProfile` / hints path) must preserve development fields — same invariant as Core reasoning fields.

### FR-5 — Step-Scoped Development Injection

- Add `== ARGUMENT DEVELOPMENT ==` to system template (separate from `== AUTHOR REASONING ==`).
- Structural steps (`hook`, `outline`, `structure`, `draft`, `expand`): full development prose, moves, transitions.
- Refinement steps (`refine`, `tighten`): epistemic posture + structural anti-patterns only.
- When flag on, Core and Development blocks both required; neither substitutes for the other.

### FR-6 — Argument Development Drift (heuristic)

- Score candidate against reconciled Development: posture signals, move alignment, transition tendencies, structural anti-pattern hits, premature thesis position.
- Run in **every Quality Mode** including `fast`.
- Integrate into lane runner and candidate ranking alongside **Reasoning Drift**.

### FR-7 — Critic extensions

- New or extended findings for structural anti-patterns (distinct from Core **Derived Anti-Patterns** findings).
- Feed into critic score and selection.

### FR-8 — Voice Judge policy update

| Quality Mode | Judge |
|--------------|-------|
| `fast` | Never |
| `balanced` | Reasoning drift borderline (60–80) **or** development drift borderline (60–80) **or** top-two tie ≤2 points |
| `strict` | Always top two finalists |

- Judge input: finalist draft, reconciled Core, reconciled Development, 1–2 examples, rubric.
- Groq preferred via **Voice Judge Routing Profile** (unchanged from ADR 0006).

### FR-9 — Voice Dashboard presentation

- Hero block 1: **Core Reasoning Signature** (“how I think”) — existing.
- Hero block 2: **Argument Development Signature** (“how I develop a text”) — prose + sentence-case trait chips (moves, posture).
- Format expression and anti-patterns remain in **Voice Dashboard Detail Layer**.
- No reconciliation conflict UI; immature state copy when &lt;3 examples.

### FR-10 — Observability

- Log: development extraction success/failure, divergence detected (yes/no), reconciliation invoked/skipped/failed.
- No example body or conflict detail in user-facing API.

## Non-Functional Requirements

- Rebuild p95: +≤5s vs single extraction when no reconciliation (parallel calls amortize vs sequential).
- Third LLM call (reconciliation) on ≤30% of rebuilds in production (monitor; tune divergence rules if higher).
- Generation p95 increase ≤10% vs ADR 0006 baseline (additional prompt block).
- Unit tests: extraction schema, divergence rules, drift heuristics, judge trigger matrix, hints merge.
- Integration test: rebuild with conflicting fixtures → reconciliation path; agree path skips third call.
- Feature flag: `voice.reasoningSignatureV1` (no new flag in v1).

## Success Metrics

| Metric | Target (post-rollout) | Notes |
|--------|------------------------|-------|
| Premature thesis / wrong arc on development regression corpus | −50% vs ADR 0006 baseline | Authors with exploratory development |
| Development drift failures on corpus | −40% vs baseline | Before judge |
| `balanced` judge invocations including development borderline | Measurable split logged | vs reasoning-only trigger |
| Reconciliation rate | ≤30% of rebuilds | Tune if excessive |
| Rebuild success (both legs + reconcile if needed) | ≥ 97% | Excluding provider outages |
| Blind review: “develops like me” | ≥ 70% on corpus | Sample of 20 generations |
| Dashboard second hero render | 100% when development exists | Immature state when &lt;3 examples |

## Testing Decisions

- Golden development extraction fixtures: ≥3 personas (exploratory, investigative, advocacy-mixed) × expected posture and moves.
- Divergence fixtures: paired drafts that must / must not trigger reconciliation.
- Drift: synthetic candidates with premature thesis vs exploratory posture.
- Judge: policy unit tests for balanced triggers (reasoning OR development OR tie).
- Hints merge regression: development fields survive `mergeVoiceProfile` (mirror Core fix).
- Extend `pnpm eval:reasoning` or add `pnpm eval:development` on shared corpus.

## Rollout

1. **Alpha** — contracts + parallel extraction + divergence; flag on internal; offline eval.
2. **Beta** — prompts + development drift; flag on for beta users; judge policy unchanged until drift stable.
3. **GA** — reconciliation + judge update + dashboard hero; full flag scope.

Rollback: disable `voice.reasoningSignatureV1` (reverts entire reasoning + development stack).

## References

- ADR: [0007-argument-development-signature.md](../../adr/0007-argument-development-signature.md)
- Extends: [0006-author-reasoning-signature.md](../../adr/0006-author-reasoning-signature.md)
- Parent program PRD: [author-reasoning-signature.md](./author-reasoning-signature.md)
- Kickoff: [author-layers-kickoff.md](../kickoff/author-layers-kickoff.md)
- Glossary: [CONTEXT.md](../../../CONTEXT.md)
