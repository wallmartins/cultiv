---
title: Dynamic Step Planner — Phase 3 One-Pager
doc_type: design
status: approved
domain: product
last_updated: 2026-06-19
phase: 3
parent_roadmap: content-formats-and-pricing-phased-roadmap
depends_on: generation-compositor-design
---

# Dynamic Step Planner — Phase 3 One-Pager

## Summary

Phase 3 adds a **StepPlanner** that **patches** the Compositor v1 plan using briefing analysis — it does **not** replace the compositor or the public `intent + scope` contract.

This document defines **minimal scope**, **pricing/quota impact**, and a **recommended sequencing** decision so we do not lock commercial numbers on a COGS model that is about to move.

```text
Phase 2 (shipped):  Request → Compositor(v1 rules) → ExecutionPlan → Run
Phase 3 (proposed): Request → Compositor base plan → StepPlanner patches → ExecutionPlan → Run
```

## Why consider Phase 3 before “final” hybrid pricing

| Layer | Depends on step graph? | Wait for StepPlanner? |
|-------|------------------------|------------------------|
| **Quota UX** (copy: “~1 geração · restam 23”) | No — presentation over `creditPrice / canonicalCreditCost` | **No** — can ship on compositor grid |
| **`creditPrice` grid** (`planSignature × tier × mode`) | Yes — LLM step count drives COGS | **Yes** — avoid full repricing until COGS variance is known |
| **Plan allowances** (Free / Criador / Pro monthly credits) | Indirectly — worst-case mix | **Yes** — after spike + calibration |
| **Canonical unit** (`canonicalCreditCost` anchor) | Mildly — anchor choice still valid | **Partial** — re-anchor on compositor telemetry, not legacy `validation-post` |

**Conclusion:** Compositor already moved the pricing **key** off legacy `contentType`. What remains sensitive is **how much each generation costs in tokens** once plans can differ per briefing. That is a Phase 3 question, not a “old format” question.

## Minimal Phase 3 scope (v1)

### In scope

1. **`StepPlanner.patch(basePlan, briefing, voice?) → PatchedExecutionPlan`**
   - Input: compositor `ExecutionPlan` (steps, `expressionProfile`, `wordTarget`, base `planSignature`).
   - Output: same contract shape; only **allowed mutations** (see guardrails).

2. **Deterministic guardrails first** (no free-form LLM graph)
   - Allowed patch ops: `insertStep`, `removeStep`, `swapRoutingProfile`, `adjustWordTarget` within bounds.
   - Forbidden: unknown skills, steps after `sanitize`, removing `sanitize`, exceeding max LLM steps per tier.

3. **Briefing-driven rules (v1 examples)**
   - `document-decision` + long `systemContext` → ensure `structure` before `draft` (already partially in compositor; planner formalizes).
   - `explain-deeply` + short briefing → skip `research` / shallow `outline`.
   - `engage-audience` + no clear question in briefing → drop `hook` or shorten refine pass.
   - Channel unspecified + `tell-story` → keep `serial-piece`; do not invent channel steps.

4. **Optional LLM assist (v1.1 — spike gate)**
   - Small classifier: briefing complexity → `{ addResearch: boolean, addStructure: boolean }`.
   - Still outputs **patch ops**, not a raw skill list.

5. **Telemetry**
   - `planner.patchCount`, `planner.ops[]`, `planner.basePlanSignature`, `planner.finalPlanSignature`, `planner.cogsEstimateDelta`.

6. **Feature flag:** `generation.step_planner_v1` (default `off`; requires compositor on).

### Out of scope (Phase 3 v1)

- Changing wizard UX or public API fields.
- New skills beyond the existing registry.
- Per-user learned plans / reinforcement from feedback.
- Enterprise / team features.
- Replacing `resolveDominantPlanSignature` pricing bucket logic (extend it, do not remove).

## Compositor relationship

| Responsibility | Compositor v1 | StepPlanner v1 |
|----------------|---------------|----------------|
| Pick base preset (`short-piece`, …) | Yes | No |
| Intent / channel / tier expression | Yes | No |
| Rhetorical profile + wordTarget defaults | Yes | Adjust within caps |
| Intent-specific step patches (rules) | Yes (today) | **Migrate** incremental rules here over time |
| Briefing-specific step patches | No | **Yes** |
| `planSignature` for pricing | Dominant bucket after materialize | Recompute after patches |

Compositor rules become **defaults and guardrails**, not the ceiling.

## Impact on `planSignature` and pricing

### Current (Phase 2)

```text
creditPrice = f(planSignature, lengthTier, qualityMode)
planSignature = resolveDominantPlanSignature(materializedSteps, basePreset)
```

Four buckets: `short-piece`, `long-piece`, `serial-piece`, `edition-piece`.

### After StepPlanner

- **Same pricing key** — no return to `contentType`.
- **Higher within-bucket variance:** two `edition-piece` runs may differ by ±1–2 LLM steps.
- **`planSignature` may change** when patches shift dominant COGS (e.g. add `research` → often `long-piece`).

### Pricing options (pick after COGS spike)

| Option | Description | When to use |
|--------|-------------|-------------|
| **A. Dominant bucket (keep)** | Price quote uses `finalPlanSignature` after patches | Low patch frequency; simple UX |
| **B. Bucket + surcharge** | Base `creditPrice` + step surcharge if LLM count > preset median | Medium variance |
| **C. Observed quote** | Preview runs lightweight COGS estimator on final step list | High variance; most accurate, more engineering |

**Recommendation for alpha:** spike measures variance; if p90 COGS spread within a bucket is **≤30%**, keep **Option A** and defer B/C.

### Quota presentation (hybrid pricing)

Unchanged formula:

```text
quotaCost      = ceil(creditPrice / canonicalCreditCost)
quotaRemaining = floor(availableCredits / canonicalCreditCost)
```

**Action:** re-anchor `canonicalCreditCost` to compositor telemetry (e.g. median `short-piece × balanced`), not legacy `validation-post`.

Quota UX does **not** need StepPlanner to ship; repricing **does** if COGS variance is high.

## COGS spike (gate before commercial repricing)

Run **before** locking `pricing.json` and plan allowances.

### Fixture set

Reuse the six compositor parity fixtures + **3 briefing variants** each (minimal / typical / heavy):

- Vary briefing length and optional fields (`systemContext`, `question`, `beats`).
- Quality mode: `balanced` only for spike v1.

### Metrics to collect

| Metric | Purpose |
|--------|---------|
| LLM step count per run | Direct COGS driver |
| `estimatedUsdCost` per run | Calibration input |
| `basePlanSignature` vs `finalPlanSignature` | Bucket drift rate |
| % runs where patch changes dominant bucket | Pricing surprise rate |
| p50 / p90 USD within each `(planSignature, tier, mode)` | Repricing band width |

### Pass criteria to proceed with full repricing

- ≥80% of runs keep the same `planSignature` after patches **OR**
- p90 COGS within ±30% of bucket median for each `(planSignature, tier, balanced)`.

If fail: narrow patch rules or adopt Option B pricing before marketing quotas.

## Recommended sequencing for Cultiv (alpha)

```text
┌─────────────────────────────────────────────────────────────────┐
│ Now — stabilizing                                                 │
│ • Compositor on in prod (COMPOSITOR_V1_ENABLED)                   │
│ • Tag telemetry: planSignature, tier, mode, USD                   │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Track A — commercial (can parallel)                               │
│ • Quota UX on preview/web (presentation only)                     │
│ • Re-anchor canonicalCreditCost to compositor median              │
│ • Keep current compositor creditPrice grid (interim)              │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Track B — Phase 3 design + spike (2–3 weeks)                      │
│ • Approve this one-pager → full spec if needed                    │
│ • Implement StepPlanner v1 (rules-only) behind flag                │
│ • Run COGS spike → decide pricing Option A/B/C                    │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Then — commercial hardening                                       │
│ • Recalibrate pricing.json on planSignature grid                  │
│ • Adjust Free / Criador / Pro monthly credits                     │
│ • Marketing quota copy                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Decision: quota UX before or after StepPlanner?

| Choice | Pros | Cons |
|--------|------|------|
| **Quota UX before StepPlanner** | Users never see raw credits; simple win | Numbers may shift once after repricing |
| **Quota UX after StepPlanner + repricing** | One commercial message change | Delays UX polish; still on credits internally |

**Recommendation:** **Quota UX before** (Track A), with copy that avoids hard promises (“aproximadamente X gerações”) until repricing lands. **Full repricing after** COGS spike (Track B).

## Architecture sketch

```text
GenerationRequest (intent, scope, briefing, qualityMode)
        │
        ▼
CompositorPlanner.plan() ──► ExecutionPlan (base)
        │
        ▼
StepPlanner.patch() ──► ExecutionPlan (final)
        │                    • steps[], expressionProfile, wordTarget
        │                    • planSignature (recomputed)
        ▼
resolvePricingEnvelope(planSignature, lengthTier, qualityMode)
        │
        ▼
Existing execution runtime (unchanged)
```

## Open questions (resolve in full spec)

1. Max LLM steps per `lengthTier` (hard cap)?
2. Is LLM-assisted patch classification v1 or v1.1?
3. Preview quote: use base plan or final plan after planner (if planner adds steps between preview and execute)?
4. Rollback: `generation.step_planner_v1=false` falls back to compositor-only plan?

## Related documents

- [Content formats phased roadmap](./2026-06-18-content-formats-phased-roadmap.md)
- [Generation compositor (Phase 2)](./2026-06-19-generation-compositor-design.md)
- [Hybrid pricing design](./2026-06-18-hybrid-pricing-design.md)
- [Compositor parity report](../reports/compositor-parity-report.md)

## Next step

Review this one-pager. If approved → `writing-plans` for Phase 3 implementation plan (spike + StepPlanner v1 + pricing decision).
