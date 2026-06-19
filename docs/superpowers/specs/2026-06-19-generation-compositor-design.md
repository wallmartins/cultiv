---
title: Generation Compositor — Phase 2 Execution Model
doc_type: design
status: approved
domain: product
last_updated: 2026-06-19
phase: 2
parent_roadmap: content-formats-and-pricing-phased-roadmap
supersedes: generation-profiles-as-exclusive-routes (informal)
---

# Generation Compositor — Phase 2 Execution Model

## Summary

Phase 2 replaces the **temporary legacy resolver** (`intent × tier → contentType`) with a **Generation Compositor**: a planner that turns the public **Generation Request** (`intent`, `scope`, briefing, quality mode) into an **execution plan** (ordered skills + runtime parameters), then runs it through the existing orchestrator.

**Presets** (`short-piece`, `long-piece`, `serial-piece`, `edition-piece`) are **internal templates** that seed the planner — not exclusive user-facing routes and not a return to six fixed format boxes.

The wizard UX from Phase 1 **does not change**. What changes is the engine behind the same contract.

## Problem

Phase 1 achieved a horizontal **product surface** (goal-first wizard, `intent + scope`, dynamic briefings) but execution still picks one of **six legacy pipelines**. The previously discussed “Option A” (four named profiles as exclusive routes) would mostly **relabel** that model: better pricing keys and fewer IDs, but the same “choose a kitchen, run a fixed menu” philosophy.

For a horizontal, voice-first product:

- Users express **purpose**, **size**, **channel**, and **subject matter** — not internal pipeline names.
- `engage-audience` vs `document-decision` differ in **rhetorical goal and structure**, not in which legacy box they fit.
- Channel (e.g. email vs professional network) should influence **expression and steps** when specified, not be ignored after a coarse lookup.

Shipping Phase 2 as profile-only routes risks:

1. **Result drift** when migrating to a compositor later (same wizard input, different text).
2. **Double calibration** (profiles now, compositor later).
3. **Product incoherence** — modern UX, legacy execution graph.

Alpha has **no external customers**; this is the window to align execution with the wizard without breaking paying users.

## Decision

**Phase 2 execution = Compositor v1 + preset templates + hybrid pricing on a stable plan signature.**

| Layer | Phase 1 | Phase 2 (this spec) |
|-------|---------|---------------------|
| Public API | `intent`, `scope`, briefing | **Unchanged** |
| Planner | `@phase1-legacy` map → `contentType` | **Compositor** → `ExecutionPlan` |
| Runner | Orchestrator over catalog pipeline | **Same orchestrator** over planned steps |
| Pricing key | `contentType × mode` (interim) | `planSignature × lengthTier × mode` |
| User-visible formats | Hidden | **Still hidden** |

**Rejected for Phase 2 primary path:** four exclusive `generationProfile` routes that only reorganize legacy pipelines (informal “Option A execution”).

**Retained from Option A:** preset names as **pricing and telemetry buckets**, not as the mental model exposed to users.

## Goals

1. **Plan** from `intent + scope + briefing + qualityMode` without selecting a legacy `contentType` ID.
2. Support **channel-aware** expression when `scope.channel` is set (email, blog, social, professional-network).
3. Reuse existing **skills** and orchestrator loop — compositor changes **what runs**, not how steps execute.
4. Reach **parity or better** vs legacy on a fixed rubric before removing the legacy resolver from the default path.
5. Emit a stable **`planSignature`** for hybrid pricing (`profile × lengthTier × mode` externally; see [hybrid-pricing-design](./2026-06-18-hybrid-pricing-design.md)).
6. Keep a **legacy fallback** behind a flag until parity sign-off.

## Non-Goals (Phase 2)

- **Dynamic step planner** (LLM chooses skills at runtime) — Phase 3.
- Removing `contentType` from catalog.json in the first compositor cut (deprecate gradually).
- Enterprise / team features.
- New skills beyond what existing pipelines already use (v1 composes known skills only).

## Concepts

### Generation Request (unchanged public contract)

From [generation-intent-wizard-design](./2026-06-18-generation-intent-wizard-design.md):

- `intent` — rhetorical goal
- `scope.lengthTier` — short | medium | long
- `scope.channel` — optional; influences expression and sometimes step set
- `briefing` — intent-specific fields (topic, audience, angle, examples, …)
- `qualityMode`, `language`, voice snapshot — as today

### ExecutionPlan (new internal artifact)

```ts
interface ExecutionPlan {
  readonly planId: string;           // stable id for logging
  readonly planSignature: string;    // pricing + telemetry bucket, e.g. "edition-piece"
  readonly steps: readonly PlannedStep[];
  readonly parameters: {
    readonly wordTarget: { min: number; max: number };
    readonly expressionProfile: string;  // channel + intent shaped constraints
    readonly intent: GenerationIntent;
    readonly lengthTier: GenerationLengthTier;
  };
}

interface PlannedStep {
  readonly name: string;
  readonly skill: string;
  readonly execution: "local" | "llm";
  readonly routingProfile?: string;
}
```

The orchestrator consumes `ExecutionPlan` the same way it today consumes a catalog `PipelineDefinition`.

### Presets (templates, not routes)

Presets are **default step bundles** the compositor starts from:

| Preset ID | Typical use | Base steps (v1) |
|-----------|-------------|-----------------|
| `short-piece` | Short social / validation | hook or analyze → draft → refine → sanitize |
| `long-piece` | Long-form depth | research → outline → draft → refine → finalize → sanitize |
| `serial-piece` | Threads / serial beats | analyze → draft (×beats) → tighten → sanitize |
| `edition-piece` | Newsletter / email editions | draft → refine → tighten → sanitize |

The compositor **selects and mutates** a preset; users never pick preset IDs.

### Compositor (planner)

Single responsibility: **`GenerationRequest → ExecutionPlan`**.

Two internal phases (not user-visible):

1. **Resolve** — map inputs to preset + modifiers + prompt packs.
2. **Materialize** — output ordered steps, word targets, expression rules.

**Not** a runtime “if intent then call skill X” tree during generation. All branching happens **before** the first skill runs.

## Planning model (v1)

### Inputs evaluated together

```text
GenerationRequest
        │
        ▼
┌───────────────────┐
│ 1. Rhetorical     │  intent → goal class, briefing schema, move bias
│    profile        │  (share | explain | engage | story | update | document)
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 2. Scale          │  lengthTier → wordTarget, enable/disable heavy steps
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 3. Expression     │  channel (if set) → format rules, hook style, CTA
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 4. Preset + patch │  pick template, add/remove steps, set routingProfile
└─────────┬─────────┘
          ▼
    ExecutionPlan
```

### Example: `share-idea` + `medium` + `email`

| Dimension | Effect on plan |
|-----------|----------------|
| intent `share-idea` | Opinion/lesson framing; briefing fields topic/audience/angle; no ADR structure |
| tier `medium` | wordTarget ~400–1,200; include refine; skip research/outline |
| channel `email` | expression: subject line + preview + body sections + CTA; preset lean `edition-piece` |
| briefing | Injected into every LLM skill as today |

Resulting plan (conceptual): `draft → refine → tighten → sanitize` with email expression profile and share-idea prompt pack.

### Example: `share-idea` + `medium` + `professional-network`

Same intent and tier; channel changes expression (hook-forward, short paragraphs) and may add `hook` step — preset lean `short-piece`.

### Example: `document-decision` + `medium`

Intent enables structure step and decision briefing schema; tier medium keeps architecture-style depth without full long-form research unless tier is `long`.

## Day-1 branching scope

Ship compositor v1 with rules for:

| Dimension | v1 behavior |
|-----------|-------------|
| **intent** (6 values) | Rhetorical profile + briefing schema + prompt pack selection |
| **lengthTier** | wordTarget; gate research/outline/refine depth |
| **channel** (when not `unspecified`) | Expression profile + step patch (hook, tighten, subject line rules) |
| **qualityMode** | Existing quality lanes (unchanged) |

**Defer to Phase 3:** LLM-inferred skill sequences; per-briefing dynamic graphs.

## Execution (unchanged runner)

```text
ExecutionPlan
      │
      ▼
createRuntimePipeline(plan, runtimeInputs)
      │
      ▼
orchestration loop (existing)
      │
      ▼
skills: draft, refine, hook, research, … (existing registry)
```

Briefing text, voice profile, and step-scoped reasoning injection remain as in current `createBackendSkillDefinition` behavior. Compositor sets **which** skills run and **formatInstructions** / **wordTarget** parameters.

## Pricing integration

Hybrid pricing moves to:

```text
creditPrice = f(planSignature, lengthTier, qualityMode)
```

- `planSignature` is one of the four presets **after** compositor planning (the bucket that best matches the materialized step set).
- `lengthTier` stays explicit in the Generation Request (user scope).
- Calibration uses telemetry tagged with `planSignature` + tier + mode — not legacy `contentType`.

Existing calibration reports remain useful as **cost anchors** for step families; re-tag sweep jobs by compositor output when available.

## Parity spike (gate before default cutover)

Before compositor becomes the default path, run a **parity harness** — not the Phase 1 sweep alone.

### Fixture matrix (minimum)

| # | intent | tier | channel | Why |
|---|--------|------|---------|-----|
| 1 | share-idea | short | professional-network | High-volume short social |
| 2 | share-idea | medium | email | Channel must change expression |
| 3 | explain-deeply | long | blog | Deep + long preset |
| 4 | document-decision | medium | unspecified | Structure-heavy intent |
| 5 | engage-audience | short | social | Engagement framing |
| 6 | tell-story | medium | unspecified | Serial/narrative preset |

Same briefing text, same voice profile, same quality mode per row.

### Rubric (1–5 each)

1. **Intent fit** — does the output match the stated goal?
2. **Structure** — appropriate sections/beats for channel?
3. **Voice fidelity** — matches voice profile?
4. **Factual discipline** — no hallucinated claims beyond briefing?
5. **Cost band** — USD within ±30% of legacy median for comparable intent class?

### Pass criteria (alpha)

- Compositor **≥ legacy median** on rubric dimensions 1–3 for **≥5/6** fixtures.
- No fixture **below 3** on intent fit.
- Cost within band or explainable (extra steps documented).
- Founder sign-off on 2 “hero” scenarios (pick from matrix).

### Fail criteria → action

| Outcome | Action |
|---------|--------|
| Fails on `document-decision` or `explain-deeply` only | Add intent-specific branches; keep legacy fallback for that intent |
| Fails on channel only | Narrow v1 channel rules; ship compositor without channel branching first |
| Fails broadly | Do not cut over; iterate planner, do not revert wizard |

## Migration & rollout

1. Implement `CompositorPlanner` behind `generation.compositor_v1` flag (default `false`).
2. Run parity harness; iterate until pass criteria met.
3. Enable compositor for internal user; compare side-by-side with legacy flag.
4. Default compositor on; keep `generation.legacy_format_picker` + resolver for one release.
5. Remove `@phase1-legacy` resolver from default enqueue path.
6. Deprecate public `contentType` in API docs; remove from web client.
7. Recalibrate pricing on `planSignature × lengthTier × mode`.

## Relationship to Phase 3

Phase 3 **StepPlanner** may override or extend the compositor plan using briefing analysis and telemetry. Presets become **soft defaults**; compositor v1 rules become **guardrails**, not the ceiling.

```text
Phase 2:  Request → Compositor(v1 rules) → Plan → Run
Phase 3:  Request → Compositor defaults → Planner patches → Plan → Run
```

## Architecture sketch

```text
┌─────────────────────────────────────────────────────────┐
│ Web: IntentWizard (Phase 1, frozen UX)                  │
└───────────────────────────┬─────────────────────────────┘
                            │ GenerationRequest
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Backend product layer                                   │
│   CompositorPlanner.plan(request) → ExecutionPlan       │
│   (replaces IntentResolver → contentType)               │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Execution runtime (existing)                            │
│   buildOrchestrationPlan / runtime pipeline / worker    │
└─────────────────────────────────────────────────────────┘
```

## Open items (resolve in implementation plan)

1. Exact channel → expression profile table (start with email, professional-network, blog).
2. Whether `serial-piece` covers `tell-story` medium or needs a narrative-specific patch.
3. `planSignature` assignment when compositor mixes steps from two presets (rule: pick dominant COGS bucket).
4. Contract type for `ExecutionPlan` in `packages/contracts`.
5. Parity harness location (`apps/backend/scripts/` vs `tests/` integration suite).
6. Feature flag key: `generation.compositor_v1` vs extending existing flags package.

## Related documents

- [Content formats phased roadmap](./2026-06-18-content-formats-phased-roadmap.md)
- [Generation intent wizard (Phase 1)](./2026-06-18-generation-intent-wizard-design.md)
- [Hybrid pricing design](./2026-06-18-hybrid-pricing-design.md)
- [Option B viability report](../../apps/docs/superpowers/reports/calibration-option-b-viability.md) — tier economics (pricing dimension only)
- [CONTEXT.md](../../../CONTEXT.md) — Generation Request terminology

## Decision log

| Date | Decision |
|------|----------|
| 2026-06-19 | Phase 2 execution pivots to **Compositor v1** instead of four exclusive profile routes. |
| 2026-06-19 | Presets are **templates + pricing buckets**, not user-facing routes. |
| 2026-06-19 | Legacy resolver remains until **parity harness** passes. |
