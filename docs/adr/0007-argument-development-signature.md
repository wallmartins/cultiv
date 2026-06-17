---
title: Argument Development Signature
doc_type: adr
status: accepted
last_updated: 2026-06-17
---

# Argument development signature and voice fidelity architecture

Generated texts still reproduce an author's conclusions and surface tone while missing **how** the author develops a piece: the argumentative path, epistemic posture while writing, and structural habits inferred from **Voice Examples** (for example lived experience → doubt → experimentation → conclusion, rather than general observation → thesis → conclusion).

[ADR 0006](./0006-author-reasoning-signature.md) introduced **Core Reasoning Signature** (who the author is as a thinker) and **Format Expression Profile** (how the author sounds on a channel). That split did not model text **development** as a distinct, author-global signal. We decided to add **Argument Development Signature** between Core and Format, derive it offline in parallel with **Reasoning Extraction**, reconcile drafts only when a deterministic divergence check finds conflict, inject it step-scoped at generation time, and evaluate it heuristically in every **Quality Mode** — with **Voice Judge** as reinforcement, not the sole enforcement layer.

**Grill session:** June 2026 — extends the reasoning program without reopening the original kickoff as the source of truth.

## Model

### Layer placement

| Layer | Scope | Captures |
|-------|-------|----------|
| **Derived Voice Profile** | Author-global | Surface voice: tone, cadence, lexicon |
| **Core Reasoning Signature** | Author-global | Cognitive traits: certainty, judgment, authority source, reader relationship |
| **Argument Development Signature** | Author-global | How text unfolds: typical moves, transition tendencies, epistemic posture while writing, structural anti-patterns |
| **Format Expression Profile** | Per **Content Type** | Register and channel expression only — not a different reasoning or development mode |

**Voice Examples** remain the source of truth. Authors refine by adding examples, not by editing derived fields in Fase 1.

### Argument Development Signature Representation

Hybrid **B + C** from design review — depth without a fixed phase template:

- Rich **development prose** (primary guidance for generation)
- Inferred **repertoire of move labels** (author-specific vocabulary, not a Cultiv ontology)
- Soft **transition tendencies** (from → to with frequency; not a mandatory pipeline)
- Reduced **epistemic posture** enum (`exploratory`, `investigative`, `advocacy_mixed`, or equivalent reduced set — exact literals defined in contracts during implementation)
- **Structural anti-patterns** (wrong arcs to penalize in critic/drift/judge — distinct from **Derived Anti-Patterns** on Core, which target rhetorical/reasoning voice)

Cultiv must **not** impose a fixed argumentative phase template. Structure is inferred from examples.

### Voice Profile Rebuild extraction

On example create, update, or batch commit — not during generation:

1. **Reasoning Extraction** and **Argument Development Extraction** run **in parallel**, both reading **Voice Examples** only. Argument Development Extraction must **not** read the draft Core output (avoids anchoring bias).
2. **Voice Signature Divergence Check** (deterministic, no LLM) decides whether reconciliation is needed:
   - Epistemic posture vs **Core Reasoning Signature** enums (for example exploratory development + `certaintyLevel: high`)
   - Judgment/development mismatch (for example doubt/experimentation moves + `judgmentFrequency: high`)
   - **Prose collapse** between Core and Development narratives (layers duplicated instead of separated)
   - Structural anti-patterns incompatible with Core traits
3. **Voice Signature Reconciliation** (LLM, `voice-extraction-llm` or dedicated routing profile) runs **only when the divergence check fails**. Input: examples + draft Core + draft Development + draft Format. Output: one coherent persisted profile. **Voice Examples** are ground truth.
4. If no conflict: persist parallel drafts as-is.
5. On extraction or reconciliation failure: keep the last valid profile; do not block generation.

**Coverage threshold:** Argument Development Extraction requires ≥2 active **Voice Examples**; the signature is treated as **immature** until ≥3 active examples exist, aligned with **Voice Confidence** on the **Voice Dashboard**.

All of the above ships under the existing `voice.reasoningSignatureV1` feature flag — not a separate product toggle in v1.

**API cost:** most rebuilds perform two LLM calls; a third runs only on detected divergence.

## Generation

**Step-Scoped Reasoning Injection** extends [ADR 0006](./0006-author-reasoning-signature.md):

- Separate prompt block: `== ARGUMENT DEVELOPMENT ==` (parallel to `== AUTHOR REASONING ==`)
- Structural steps (`hook`, `outline`, `structure`, `draft`, `expand`): full development prose, moves, transitions
- Refinement steps (`refine`, `tighten`): epistemic posture + structural anti-patterns (guardrails against premature thesis defense)
- **Format Expression Profile** unchanged — format constraints only

Core and Argument Development must both be present when the reasoning flag is on; neither substitutes for the other.

## Evaluation

### Every Quality Mode (including `fast`)

- **Argument Development Drift** — heuristic score from reconciled **Argument Development Signature**
- Critic findings for structural anti-patterns
- Development signal participates in candidate ranking

Voice identity enforcement does **not** wait for **Voice Judge**.

### Voice Judge (conditional reinforcement)

| Quality Mode | Judge |
|--------------|-------|
| `fast` | Never |
| `balanced` | When **any** of: reasoning drift borderline (60–80 on top candidate), **argument development drift** borderline (60–80 on top candidate), top-two `finalScore` within 2 points |
| `strict` | Always on top two finalists |

Judge prompt includes reconciled **Core Reasoning Signature** and **Argument Development Signature**, plus author examples. Groq preferred via **Voice Judge Routing Profile** per ADR 0006.

Heuristic development drift and judge are complementary: the former runs always; the latter resolves borderline finalists.

## Product surface

**Voice Reasoning Presentation** on the **Voice Dashboard**:

1. Hero block one — **Core Reasoning Signature** (“how I think”)
2. Hero block two — **Argument Development Signature** (“how I develop a text”) with prose + trait chips (moves, posture)
3. **Format Expression Profile** and structural/core anti-patterns remain in **Voice Dashboard Detail Layer** disclosures

Reconciliation is internal. Authors never see extraction conflict states or mismatch warnings in Fase 1.

## Considered Options

1. **Expand Core `narrativeProse` only** — Rejected. Core and development collapsed in practice; wrong arcs persisted after extraction.
2. **Sequential extraction with Core fed into Development** — Rejected. Anchoring risk; Development paraphrased Core instead of re-reading examples.
3. **Parallel extraction + unconditional reconciliation LLM** — Rejected. Unnecessary third call when drafts already agree; higher rebuild cost.
4. **Parallel extraction + conditional reconciliation + separate injection and drift** — Accepted.
5. **Judge as sole development enforcement** — Rejected. `fast` and clear `balanced` winners would skip structural fidelity checks.
6. **Separate feature flag for Development** — Rejected for v1. Core without Development reproduces the original failure mode.

## Relationship to ADR 0006

ADR 0006 remains authoritative for: **Content Type Format Preset** scope, provider split (extraction vs judge vs generation), read-only dashboard principle, and **Derived Anti-Patterns** on Core.

ADR 0007 adds the development layer, parallel/conditional rebuild orchestration, extended injection, **Argument Development Drift**, revised balanced judge triggers, and two-block hero presentation. Implementation issues should reference both ADRs.

Extended by [ADR 0008](./0008-development-traits-and-author-confidence.md) (**Development Traits**, **Trait Confidence**, **Author Development Mirror**, **Author Trait Confirmation**).

## Consequences

- `packages/contracts` gains **Argument Development Signature** types and reconciliation result shape.
- `reasoning-extraction.ts` splits or complements with `argument-development-extraction.ts`; rebuild orchestration gains parallel calls, divergence check, and conditional reconciliation.
- `voice-rebuild-derivation.ts` persists `argumentDevelopmentSignature` on **Derived Voice Profile**.
- `reasoning-prompt.ts` (or sibling) gains `== ARGUMENT DEVELOPMENT ==` with step-scoped depth.
- `packages/text-quality` gains **Argument Development Drift**, critic extensions for structural anti-patterns, and judge input updates.
- `voice-judge-policy.ts` gains development-drift borderline as a balanced trigger.
- `voice-hints.ts` / `voice-profile.ts` must pass development fields through to execution (same class of bug as Core hints merge).
- **Voice Dashboard** gains second hero block for development presentation.
- `CONTEXT.md` glossary updated (**Argument Development Signature**, **Argument Development Extraction**, **Voice Signature Divergence Check**, **Voice Signature Reconciliation**, **Argument Development Drift**).
- Observability: internal events for reconciliation invoked / skipped (no user-facing conflict UI in Fase 1).
- Deeper **Core Reasoning Signature** extraction quality is explicitly deferred; may be revisited after Development layer ships.
- PRD: [`argument-development-signature.md`](../live/prd/argument-development-signature.md) · Plan: [`argument-development-signature-implementation-plan.md`](../live/plan/argument-development-signature-implementation-plan.md)
- Follow-on: [ADR 0008](./0008-development-traits-and-author-confidence.md) · Plan: [`development-traits-implementation-plan.md`](../live/plan/development-traits-implementation-plan.md)

## References

- [ADR 0006 — Author Reasoning Signature](./0006-author-reasoning-signature.md)
- [ADR 0008 — Development Traits and Author Confidence](./0008-development-traits-and-author-confidence.md)
- [CONTEXT.md](../../CONTEXT.md) — canonical glossary
- [author-layers-kickoff.md](../live/kickoff/author-layers-kickoff.md) — exploration only; not implementation source of truth
