---
title: Content Formats & Pricing — Phased Roadmap
doc_type: design
status: approved
domain: product
last_updated: 2026-06-18
---

# Content Formats & Pricing — Phased Roadmap

## Context

Cultiv is in **alpha**: production deploy, no external customers. Positioning is **horizontal** (voice-first professional writing for any audience). Current six content types reflect the founder's author workflow, not a diverse market.

Hybrid pricing (internal credits + quota UX) is designed but **final commercial rollout waits until execution model stabilizes** in Phase 2.

## Phases

| Phase | Focus | Public contract | Execution | Pricing |
|-------|--------|-----------------|-----------|---------|
| **1** | Goal-first wizard | `intent` + `scope` | Temporary resolver → 6 legacy pipelines | Legacy `contentType` prices (interim) |
| **2** | Compositor + presets | Same intent/scope | `CompositorPlanner` → `ExecutionPlan`; presets as templates | Hybrid quotas finalized (`planSignature × lengthTier × mode`) |
| **3** | Dynamic planner | Same | Skill sequence per generation (StepPlanner patches compositor plan) | Telemetry-driven recalibration after COGS spike |

## Specs & plans

| Phase | Design spec | Implementation plan |
|-------|-------------|---------------------|
| 1 | [generation-intent-wizard-design.md](./2026-06-18-generation-intent-wizard-design.md) | TBD after spec approval |
| 2 | [generation-compositor-design.md](./2026-06-19-generation-compositor-design.md) | [generation-compositor.md](../plans/2026-06-19-generation-compositor.md) |
| 3 | TBD → [dynamic-step-planner-phase3-onepager.md](./2026-06-19-dynamic-step-planner-phase3-onepager.md) | TBD after one-pager approval |
| Pricing | [hybrid-pricing-design.md](./2026-06-18-hybrid-pricing-design.md) | [hybrid-pricing.md](../plans/2026-06-18-hybrid-pricing.md) — execute in Phase 2 |

## Calibration artifact

Production calibration (14 generations) lives in [2026-06-18-hybrid-pricing-calibration.md](../reports/2026-06-18-hybrid-pricing-calibration.md). Used for **unit economics**, not for assuming customer format mix.

## Decision log

- **2026-06-18:** Horizontal positioning; wizard (option C) approved.
- **2026-06-18:** Three-phase execution evolution approved; no launch rush.
- **2026-06-18:** Phase 1 keeps legacy pipelines as temporary adapter only.
- **2026-06-18:** Final hybrid pricing deferred to Phase 2.
- **2026-06-19:** Phase 2 execution pivots to **Generation Compositor v1** (see compositor design spec); four presets are templates/pricing buckets, not exclusive user routes.
