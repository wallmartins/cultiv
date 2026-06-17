---
title: Development Traits and Author Confidence
doc_type: adr
status: accepted
last_updated: 2026-06-17
---

# Development traits and author confidence architecture

[ADR 0007](./0007-argument-development-signature.md) ships **Argument Development Signature** as hybrid prose + soft structure for generation fidelity. Authors and product still need **direct, comparable answers** to stable questions about how they develop texts — and **confidence that each answer is grounded in their examples**, not generic LLM prose.

We extend the development layer with **Development Traits** (small structured enums), **Trait Confidence** (per-dimension trust), **Trait Evidence** (example linkage), and a read-only **Author Development Mirror** with a light **Author Trait Confirmation** loop. **Voice Examples** remain the source of truth; authors do not edit derived fields in Fase 1.

**Grill session:** June 2026 — extends ADR 0007 without a parallel extraction pipeline or fixed argumentative phase template.

## Problem

The eight author-facing development questions (observation vs thesis, perspective shifts, counterexamples, self-questioning, insight timing, analogies, validation source, conclusion vs question) are **partially inferable** from today's `developmentProse`, `moveLabels`, and **Core Reasoning Signature** enums — but:

- Answers are **implicit**, not queryable or comparable across authors.
- **Voice Confidence** is global (example count/diversity); it does not say *what we know* vs *what we are guessing*.
- Dashboard chips (moves, posture) help generation-minded readers, not authors validating "is this really me?"

Strong author confidence requires: **structured answers + evidence + per-trait confidence + honest gaps + light confirmation**.

## Model

### Layer placement (unchanged from ADR 0007)

| Layer | Scope | Role for these questions |
|-------|-------|--------------------------|
| **Core Reasoning Signature** | Author-global | Cognitive traits: authority source, conclusion pace, certainty, judgment |
| **Argument Development Signature** | Author-global | Structural arc: prose, moves, transitions, epistemic posture, structural anti-patterns |
| **Development Traits** | Author-global | **Stable enums** answering the eight development questions — child of Development, not Core |
| **Format Expression Profile** | Per **Content Type** | Out of scope |

**Development Traits** are persisted **inside** the development extraction result (same LLM call as ADR 0007), then post-processed deterministically. They do **not** replace `developmentProse` (still primary for generation injection).

### Question → field mapping

| Author question | Primary persistence | Secondary | Notes |
|-----------------|---------------------|-----------|-------|
| Parte de observação ou tese? | `traits.openingMode` | Core `openingStyle`, `conclusionPace` | Structural opening, not format register |
| Quantas mudanças de perspectiva? | `traits.perspectiveShiftDensity` | `transitionTendencies` | `low` \| `moderate` \| `high` |
| Usa contraexemplos? | `traits.usesCounterexamples` | `moveLabels` | Frequency, not boolean |
| Questiona a própria hipótese? | `traits.selfQuestioning` | `epistemicPosture`, Core `judgmentFrequency` | Structural self-doubt while writing |
| Insight cedo ou tarde? | `traits.insightTiming` | Core `conclusionPace` | Structural landing of insight; Core keeps cognitive pace |
| Raciocina por analogias? | `traits.usesAnalogies` | `moveLabels` | Frequency |
| Valida por experiência ou princípio abstrato? | Core `authoritySource` | — | **Not duplicated** on Development; mirror links to Core chip |
| Termina em conclusão ou pergunta? | `traits.closingMode` | `moveLabels`, final transitions | `conclusion` \| `open_question` \| `mixed` |

### Development Traits schema (contracts v2 extension)

All frequency fields use the same literal set as transition tendencies: `rare` \| `occasional` \| `common` \| `dominant`.

```typescript
// Illustrative — exact names in packages/contracts during implementation
DevelopmentTraits {
  openingMode: "observation" | "thesis" | "mixed"
  perspectiveShiftDensity: "low" | "moderate" | "high"
  usesCounterexamples: Frequency
  selfQuestioning: "low" | "moderate" | "high"
  insightTiming: "early" | "moderate" | "late"
  usesAnalogies: Frequency
  closingMode: "conclusion" | "open_question" | "mixed"
}

TraitRecord {
  value: <trait-specific enum>
  confidence: "low" | "medium" | "high"
  status: "inferred" | "confirmed" | "disputed" | "unknown"
  evidenceExampleIds: string[]  // Voice Example ids
}

DevelopmentTraitProfile {
  traits: DevelopmentTraits
  records: Record<TraitKey, TraitRecord>
}
```

**Argument Development Signature** becomes:

- `developmentProse`, `moveLabels`, `transitionTendencies`, `epistemicPosture`, `structuralAntiPatterns` (unchanged)
- `traitProfile?: DevelopmentTraitProfile` (optional until extraction v2 ships; mirror degrades gracefully)

### Trait Confidence (deterministic, post-extraction)

After LLM extraction, a **Trait Confidence Pass** (no LLM) recomputes `confidence` and `status` from **Voice Examples** and draft evidence ids.

| Condition | `confidence` | `status` |
|-----------|--------------|----------|
| No textual signal for trait | — | `unknown` (do not invent a value) |
| Signal in exactly one active example | `low` | `inferred` |
| Same value supported in 2 active examples | `medium` | `inferred` |
| Same value in ≥3 examples, or ≥2 + aligned transition tendency | `high` | `inferred` |
| Examples contradict on value | `low` | `disputed` → triggers or reinforces **Voice Signature Divergence Check** |
| Author confirmed via **Author Trait Confirmation** | bump one level (cap `high`) | `confirmed` |
| Author rejected | unchanged for generation | `disputed` + diagnostic + targeted **Voice Next Step** |

**Global Voice Confidence** (low/medium/high) remains authoritative for **Voice Adaptation Mode**. **Trait Confidence** is additive detail on the dashboard — it does not override global confidence for generation conservatism in v1.

### Voice Profile Rebuild (extends ADR 0007)

1. **Reasoning Extraction** ∥ **Argument Development Extraction** (unchanged parallelism).
2. Development extraction JSON adds `traits` + LLM-proposed `traitEvidence` (example indices or ids).
3. **Trait Confidence Pass** normalizes evidence to example ids and applies rules above.
4. **Voice Signature Divergence Check** gains optional rules:
   - `traits.insightTiming: late` vs Core `conclusionPace: fast` (structural vs cognitive mismatch)
   - `traits.openingMode: thesis` vs exploratory `epistemicPosture` + doubt-heavy moves
   - any `status: disputed` on ≥2 traits
5. **Voice Signature Reconciliation** (conditional) harmonizes traits with Core + Development prose when invoked.
6. On failure: keep last valid profile including last trait profile.

**API cost:** zero additional LLM calls vs ADR 0007 (traits in the same development extraction request; confidence pass is deterministic).

**Feature flag:** same `voice.reasoningSignatureV1` — not a separate toggle in v1.

### Generation and evaluation

- **Prompt injection:** `developmentProse` + moves + transitions remain primary on structural steps. Traits are summarized in a compact line only when present (for example `Opening: observation; Closing: open_question`) — never replace prose.
- **Argument Development Drift:** optional v2 heuristics keyed off traits (for example penalize early thesis when `insightTiming: late`). Ship after trait regression corpus exists.
- **Voice Judge:** may include trait summary in development block for borderline cases; not required in v1 of this ADR.

## Product surface

### Author Development Mirror (extends **Voice Reasoning Presentation**)

Second hero block ("how I develop a text") gains a **Development Traits strip** below prose:

```
┌─────────────────────────────────────────────────────────────────┐
│  Como desenvolvo um texto                          [Confiança ●●●]│
├─────────────────────────────────────────────────────────────────┤
│  [developmentProse — 2–4 sentences, primary mirror]             │
│                                                                 │
│  Abertura          Perspectiva       Contraexemplos             │
│  Observação  ●●○   Moderada  ●●●     Ocasional  ●●○             │
│                                                                 │
│  Autoquestionamento  Insight         Analogias      Fechamento    │
│  Alta  ●●●           Tarde  ●●●      Raro  ●○○     Pergunta ●●○ │
│                                                                 │
│  Validação (como penso)  →  Experiência vivida  [chip Core]     │
│                                                                 │
│  ▼ Ver evidências (2 exemplos)     ▼ Lacunas (1)                  │
└─────────────────────────────────────────────────────────────────┘
```

- **●●● / ●●○ / ●○○** = trait confidence (high / medium / low). `unknown` traits show em dash with copy: *"Ainda não dá para inferir — adicione um exemplo que…"*
- **Validação** links to Core hero chip (`authoritySource`) — not duplicated.
- **Immature development** (&lt;3 active examples): traits strip visible but capped at `medium` confidence max and shows `developmentImmature` copy from ADR 0007.

### Evidence disclosure (detail layer)

Collapsible **Trait Evidence** inside **Voice Dashboard Detail Layer** (closed by default):

```
┌─ Evidências — Abertura: observação ─────────────────────────────┐
│  Exemplo 2 (linkedin-post)                                       │
│  "Notei que o time só percebeu o problema quando…"               │
│  Exemplo 5 (newsletter)                                          │
│  "Começo olhando o que mudou na prática antes de…"               │
└──────────────────────────────────────────────────────────────────┘
```

No full example dump — short excerpt (≤200 chars) + link to example management.

### Author Trait Confirmation (Fase 1 light loop)

For traits with `confidence` ≤ `medium` or `status: disputed`:

```
┌─────────────────────────────────────────────────────────────────┐
│  Isso combina com você?                                          │
│  "Você costuma fechar com pergunta aberta."                      │
│                                                                 │
│  [ Sim ]   [ Não ]   [ Não sei ]                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Action | Effect |
|--------|--------|
| **Sim** | `status → confirmed`; confidence bump; stored in **Voice Diagnostics** audit (not generation hints) |
| **Não** | `status → disputed`; **Voice Next Step** suggests example of opposite pattern; no inline field edit |
| **Não sei** | unchanged; dismiss until next rebuild |

At most **one** confirmation card per dashboard visit (prioritize lowest confidence trait). No modal stack.

### Voice Next Step by gap (examples)

| Gap | `nextActionCode` (new or mapped) | CTA copy (pt-BR) |
|-----|----------------------------------|------------------|
| `usesAnalogies: unknown` | `add_examples_from_other_content_types` or new `add_argumentative_example` | "Adicione um texto em que você usa analogia" |
| `closingMode: disputed` | `review_conflicting_examples` | "Seus exemplos fecham de formas diferentes — qual representa melhor você?" |
| `perspectiveShiftDensity: low` confidence | `add_more_examples` | "Adicione um texto com mudança clara de perspectiva" |

## Considered Options

1. **Separate third LLM pipeline (Development Q&A)** — Rejected. Cost, drift from reconciled profile, duplicate source of truth.
2. **Derive traits read-back from prose only (no schema)** — Rejected for product confidence. Unstable, untestable.
3. **Full author-editable trait form** — Rejected for Fase 1 (ADR 0006/0007 read-only principle). Confirmation loop only.
4. **Fixed Cultiv ontology replacing moveLabels** — Rejected. Traits are small stable enums; moves stay author-specific.
5. **Traits in same extraction JSON + deterministic confidence + evidence mirror + confirmation** — Accepted.

## Relationship to ADR 0006 and ADR 0007

- ADR 0006 remains authoritative for **Core Reasoning Signature** and `authoritySource` (question 7).
- ADR 0007 remains authoritative for parallel extraction, reconciliation, injection, and drift.
- ADR 0008 adds **Development Traits**, **Trait Confidence Pass**, dashboard mirror wireframe, and confirmation loop — implementation issues should reference ADRs 0006–0008.

## Phased delivery

| Phase | Scope | Outcome |
|-------|-------|---------|
| **A — ADR + contracts** | Schema, glossary, plan | Alignment without runtime change |
| **B — Extraction v2** | Traits + evidence in development JSON; confidence pass; divergence rules | Persisted trait profile |
| **C — Mirror UI** | Traits strip, evidence disclosure, gap copy | Author sees grounded answers |
| **D — Confirmation** | Sim/Não/Não sei + diagnostics audit | Author-validated confidence |
| **E — Regression** | Persona fixtures with expected traits; `pnpm eval:development-traits` | CI guardrail |
| **F — Generation** | Traits pass-through + compact prompt summary (issue 87) | Execution benefits independent of dashboard |

Phase A is this ADR. Phases B–F are tracked in [`development-traits-implementation-plan.md`](../live/plan/development-traits-implementation-plan.md).

## Consequences

- `packages/contracts` extends **Argument Development Signature** / extraction result with `DevelopmentTraitProfile`.
- `argument-development-extraction.ts` prompt schema adds traits + evidence; exports unchanged TaggedError path.
- New `trait-confidence-pass.ts` (or module in voice rebuild) — deterministic only.
- `voice-signature-divergence.ts` gains trait-aware rules.
- `voice-signature-reconciliation.ts` harmonizes traits when reconciliation runs.
- `VoiceReasoningPresentationView` / mappers expose traits + records for web.
- **Voice Dashboard** second hero: traits strip + evidence + confirmation card.
- i18n: trait labels and frequency copy in pt/en (sentence case, not uppercase mono).
- `CONTEXT.md` glossary: **Development Traits**, **Trait Confidence**, **Trait Evidence**, **Author Trait Confirmation**, **Author Development Mirror**.
- Observability: `trait_confidence_computed`, `trait_confirmation_recorded` (internal).
- PRD follow-up: [`development-traits-and-author-confidence.md`](../live/prd/development-traits-and-author-confidence.md) · plan: [`development-traits-implementation-plan.md`](../live/plan/development-traits-implementation-plan.md)

## References

- [ADR 0006 — Author Reasoning Signature](./0006-author-reasoning-signature.md)
- [ADR 0007 — Argument Development Signature](./0007-argument-development-signature.md)
- [CONTEXT.md](../../CONTEXT.md)
- [development-traits-implementation-plan.md](../live/plan/development-traits-implementation-plan.md)
