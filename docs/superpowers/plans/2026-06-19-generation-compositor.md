# Generation Compositor v1 — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `@phase1-legacy` intent→`contentType` resolver with a **CompositorPlanner** that builds an `ExecutionPlan` from `intent + scope + briefing`, runs it through the existing orchestrator, and prices executions by `planSignature × lengthTier × qualityMode` — behind `generation.compositor_v1` until parity sign-off.

**Architecture:** Compositor is a **pure planner** in `apps/backend/src/product/generation/compositor/`. It outputs `ExecutionPlan`, materialized as `ExplicitPipelineRequest` for `buildOrchestrationPlan`. Legacy resolver stays as fallback when the flag is off. Hybrid pricing and quota UX ship in the **same coordinated cutover** (extend `resolvePolicyPricing` for `planSignature + lengthTier`). Web wizard unchanged.

**Tech Stack:** TypeScript, Effect-TS, Effect Schema (`packages/contracts`), Vitest, Hono, existing orchestrator + skills registry, feature-flags package, `pricing.json` policy files.

**Spec:** [`docs/superpowers/specs/2026-06-19-generation-compositor-design.md`](../specs/2026-06-19-generation-compositor-design.md)

**Roadmap:** [`docs/superpowers/specs/2026-06-18-content-formats-phased-roadmap.md`](../specs/2026-06-18-content-formats-phased-roadmap.md)

**Related pricing plan:** [`docs/superpowers/plans/2026-06-18-hybrid-pricing.md`](./2026-06-18-hybrid-pricing.md) — coordinate Tasks 10–11 here with pricing plan Phase 1 repricing.

---

## Locked decisions (from spec + planning)

| Decision | Value |
|----------|--------|
| Feature flag | `generation.compositor_v1` (default `false`) |
| Preset IDs | `short-piece`, `long-piece`, `serial-piece`, `edition-piece` |
| Plan materialization | `ExplicitPipelineRequest` with `pipeline` from compositor |
| Policy routing | Reuse existing `routingProfile` names (`linkedin-llm`, `default-llm`, `premium-llm`) from preset step templates |
| `planSignature` when mixed steps | Dominant preset by step COGS weight (documented in preset module) |
| Channel v1 | `email`, `professional-network`, `blog`, `social`; `unspecified` = no channel patch |
| `tell-story` + `medium` | `serial-piece` preset + narrative expression patch |
| Parity gate | 6 fixtures; pass criteria per spec before default-on |
| Web UX | **No changes** in this plan |
| Phase 3 planner | **Out of scope** — compositor rules are deterministic only |

## File map

| File | Responsibility |
|------|----------------|
| `packages/contracts/src/generation-compositor.ts` | `ExecutionPlan`, `PlanSignature`, `PlannedStep`, compositor metadata schemas |
| `packages/contracts/src/index.ts` | Re-export compositor types |
| `apps/backend/src/product/generation/compositor/presets.ts` | Four preset step templates + routing profiles |
| `apps/backend/src/product/generation/compositor/rhetorical-profiles.ts` | Intent → goal class, prompt pack id, structure flags |
| `apps/backend/src/product/generation/compositor/scale.ts` | `lengthTier` → `wordTarget`, step gates |
| `apps/backend/src/product/generation/compositor/expression.ts` | Channel → expression profile + step patches |
| `apps/backend/src/product/generation/compositor/plan-materializer.ts` | `ExecutionPlan` → `PipelineDefinition` |
| `apps/backend/src/product/generation/compositor/compositor-planner.ts` | `plan(request)` entry point |
| `apps/backend/src/product/generation/resolve-generation-target.ts` | Branch: compositor vs legacy |
| `apps/backend/src/product/generation/merge-intent-pipeline-context.ts` | Attach `compositor` metadata to job context |
| `apps/backend/src/product/generation/public-generation.ts` | Build `ExplicitPipelineRequest` when compositor on |
| `apps/backend/src/product/generation/generation-preview.ts` | Same compositor path for preview |
| `apps/backend/src/product/ai-policy/ai-policy-snapshot.ts` | Resolve policy steps for compositor pipeline names |
| `apps/backend/policies/official/2026-06-18/catalog.json` | Add 4 compositor pipeline policy entries (mirror presets) |
| `apps/backend/policies/official/2026-06-18/pricing.json` | `planSignature × lengthTier × mode` price grid |
| `apps/backend/src/product/ai-policy/resolve-policy-pricing.ts` | Accept `lengthTier` + `planSignature` |
| `apps/backend/src/product/billing/generation-pricing-snapshot.ts` | Quote id includes `planSignature` + `lengthTier` when compositor |
| `apps/backend/src/execution/skills.ts` | Read `expressionProfile` + compositor `wordTarget` from pipeline context |
| `packages/feature-flags/src/defaults.ts` | `generation.compositor_v1` flag |
| `apps/backend/scripts/compositor-parity-harness.ts` | Run legacy vs compositor fixtures, emit comparison report |
| `apps/backend/scripts/calibration/briefings.ts` | Reuse for parity fixture briefings |
| `tests/backend/compositor-planner.test.ts` | Planner unit tests (all 6 parity fixtures) |
| `tests/backend/compositor-presets.test.ts` | Preset template invariants |
| `tests/backend/resolve-generation-target-compositor.test.ts` | Flag on/off resolution |
| `tests/backend/compositor-parity-harness.test.ts` | Harness smoke (mocked execution optional) |
| `tests/contracts/generation-compositor.test.ts` | Schema decode tests |

## Out of scope

- Dynamic StepPlanner (Phase 3)
- Removing `GET /me/content-types` (follow-up after default-on)
- Marketing pricing page
- Web wizard UI changes

---

## Task 1: Compositor contracts

**Files:**
- Create: `packages/contracts/src/generation-compositor.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `tests/contracts/generation-compositor.test.ts`

- [ ] **Step 1: Write failing schema test**

```typescript
// tests/contracts/generation-compositor.test.ts
import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import {
  ExecutionPlanSchema,
  PlanSignatureSchema
} from "../../packages/contracts/src/generation-compositor.js";

describe("generation compositor contracts", () => {
  it("decodes a valid execution plan", () => {
    const decoded = Schema.decodeUnknownSync(ExecutionPlanSchema)({
      planId: "plan-1",
      planSignature: "edition-piece",
      steps: [
        { name: "draft", skill: "draft", execution: "llm", routingProfile: "default-llm" }
      ],
      parameters: {
        wordTarget: { min: 400, max: 1200 },
        expressionProfile: "email-share-idea",
        intent: "share-idea",
        lengthTier: "medium"
      }
    });
    expect(decoded.planSignature).toBe("edition-piece");
  });

  it("rejects unknown plan signature", () => {
    expect(() => Schema.decodeUnknownSync(PlanSignatureSchema)("linkedin-post")).toThrow();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm exec vitest run tests/contracts/generation-compositor.test.ts`

- [ ] **Step 3: Implement schemas**

```typescript
// packages/contracts/src/generation-compositor.ts
import { Schema } from "effect";
import { GenerationIntentSchema, GenerationLengthTierSchema } from "./generation-intent.js";

export const PlanSignatureSchema = Schema.Literal(
  "short-piece",
  "long-piece",
  "serial-piece",
  "edition-piece"
);
export type PlanSignature = typeof PlanSignatureSchema.Type;

export const PlannedStepSchema = Schema.Struct({
  name: Schema.String,
  skill: Schema.String,
  execution: Schema.Literal("local", "llm"),
  routingProfile: Schema.optional(Schema.String)
});
export type PlannedStep = typeof PlannedStepSchema.Type;

export const ExecutionPlanParametersSchema = Schema.Struct({
  wordTarget: Schema.Struct({ min: Schema.Number, max: Schema.Number }),
  expressionProfile: Schema.String,
  intent: GenerationIntentSchema,
  lengthTier: GenerationLengthTierSchema
});

export const ExecutionPlanSchema = Schema.Struct({
  planId: Schema.String,
  planSignature: PlanSignatureSchema,
  steps: Schema.Array(PlannedStepSchema),
  parameters: ExecutionPlanParametersSchema
});
export type ExecutionPlan = typeof ExecutionPlanSchema.Type;

export const CompositorMetadataSchema = Schema.Struct({
  planId: Schema.String,
  planSignature: PlanSignatureSchema,
  expressionProfile: Schema.String,
  wordTarget: Schema.Struct({ min: Schema.Number, max: Schema.Number })
});
export type CompositorMetadata = typeof CompositorMetadataSchema.Type;
```

- [ ] **Step 4: Export from `packages/contracts/src/index.ts`**

- [ ] **Step 5: Run test — expect PASS**

Run: `pnpm exec vitest run tests/contracts/generation-compositor.test.ts`

- [ ] **Step 6: Commit**

```bash
git add packages/contracts/src/generation-compositor.ts packages/contracts/src/index.ts tests/contracts/generation-compositor.test.ts
git commit -m "feat(contracts): add ExecutionPlan and compositor metadata schemas"
```

---

## Task 2: Preset templates

**Files:**
- Create: `apps/backend/src/product/generation/compositor/presets.ts`
- Create: `tests/backend/compositor-presets.test.ts`

- [ ] **Step 1: Write failing preset tests**

```typescript
// tests/backend/compositor-presets.test.ts
import { describe, expect, it } from "vitest";
import { COMPOSITOR_PRESETS, getPreset } from "../../apps/backend/src/product/generation/compositor/presets.js";

describe("compositor presets", () => {
  it("defines four presets with sanitize terminal step", () => {
    expect(Object.keys(COMPOSITOR_PRESETS)).toHaveLength(4);
    for (const preset of Object.values(COMPOSITOR_PRESETS)) {
      expect(preset.steps.at(-1)?.skill).toBe("sanitize");
    }
  });

  it("long-piece includes research and outline", () => {
    const names = getPreset("long-piece").steps.map((s) => s.name);
    expect(names).toContain("research");
    expect(names).toContain("outline");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement presets** (mirror legacy catalog step names/routing from `apps/backend/policies/official/2026-05-16/catalog.json`)

```typescript
// apps/backend/src/product/generation/compositor/presets.ts
import type { PlannedStep, PlanSignature } from "@my-ai-orchestrator/contracts";

export interface CompositorPreset {
  readonly id: PlanSignature;
  readonly steps: readonly PlannedStep[];
  readonly relativeCostWeight: number;
}

export const COMPOSITOR_PRESETS: Record<PlanSignature, CompositorPreset> = {
  "short-piece": {
    id: "short-piece",
    relativeCostWeight: 1,
    steps: [
      { name: "hook", skill: "hook", execution: "llm", routingProfile: "linkedin-llm" },
      { name: "draft", skill: "draft", execution: "llm", routingProfile: "linkedin-llm" },
      { name: "refine", skill: "refine", execution: "llm", routingProfile: "linkedin-llm" },
      { name: "sanitize", skill: "sanitize", execution: "local" }
    ]
  },
  "long-piece": {
    id: "long-piece",
    relativeCostWeight: 3,
    steps: [
      { name: "research", skill: "research", execution: "local" },
      { name: "outline", skill: "outline", execution: "local" },
      { name: "draft", skill: "draft", execution: "llm", routingProfile: "premium-llm" },
      { name: "refine", skill: "refine", execution: "llm", routingProfile: "premium-llm" },
      { name: "finalize", skill: "publish", execution: "local" },
      { name: "sanitize", skill: "sanitize", execution: "local" }
    ]
  },
  "serial-piece": {
    id: "serial-piece",
    relativeCostWeight: 1.5,
    steps: [
      { name: "analyze", skill: "analyze", execution: "local" },
      { name: "draft", skill: "draft", execution: "llm", routingProfile: "default-llm" },
      { name: "tighten", skill: "tighten", execution: "llm", routingProfile: "default-llm" },
      { name: "sanitize", skill: "sanitize", execution: "local" }
    ]
  },
  "edition-piece": {
    id: "edition-piece",
    relativeCostWeight: 2,
    steps: [
      { name: "draft", skill: "draft", execution: "llm", routingProfile: "default-llm" },
      { name: "refine", skill: "refine", execution: "llm", routingProfile: "default-llm" },
      { name: "tighten", skill: "tighten", execution: "llm", routingProfile: "default-llm" },
      { name: "sanitize", skill: "sanitize", execution: "local" }
    ]
  }
};

export function getPreset(id: PlanSignature): CompositorPreset {
  return COMPOSITOR_PRESETS[id];
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

---

## Task 3: Scale + expression + rhetorical layers

**Files:**
- Create: `apps/backend/src/product/generation/compositor/rhetorical-profiles.ts`
- Create: `apps/backend/src/product/generation/compositor/scale.ts`
- Create: `apps/backend/src/product/generation/compositor/expression.ts`
- Create: `tests/backend/compositor-layers.test.ts`

- [ ] **Step 1: Write failing layer tests**

Test cases:
- `resolveWordTarget("medium")` → `{ min: 400, max: 1200 }` (reuse `PHASE1_WORD_TARGETS` from contracts)
- `resolveExpressionProfile({ intent: "share-idea", channel: "email" })` → `"email-share-idea"`
- `resolveExpressionProfile({ intent: "share-idea", channel: "unspecified" })` → `"share-idea-default"`
- `pickBasePreset({ intent: "explain-deeply", lengthTier: "long" })` → `"long-piece"`
- `pickBasePreset({ intent: "share-idea", lengthTier: "short", channel: "professional-network" })` → `"short-piece"`

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement layers**

`rhetorical-profiles.ts`: map each `GenerationIntent` to `{ goalClass, structureStep?: "structure" }` (`document-decision` + `medium|long` enables structure step patch).

`scale.ts`: import `PHASE1_WORD_TARGETS`; `gateHeavySteps(lengthTier)` returns whether research/outline allowed.

`expression.ts`: channel table:

| Channel | Effect |
|---------|--------|
| `email` | expression id `email-{intent}`; prefer `edition-piece`; add tighten |
| `professional-network` | `professional-{intent}`; prefer `short-piece`; ensure hook |
| `blog` | `blog-{intent}`; long tier → `long-piece` |
| `social` | `social-{intent}`; `short-piece` |
| `unspecified` | `{intent}-default`; preset from intent+tier only |

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

---

## Task 4: CompositorPlanner + materializer

**Files:**
- Create: `apps/backend/src/product/generation/compositor/compositor-planner.ts`
- Create: `apps/backend/src/product/generation/compositor/plan-materializer.ts`
- Create: `tests/backend/compositor-planner.test.ts`

- [ ] **Step 1: Write failing planner tests for all 6 parity fixtures**

```typescript
// tests/backend/compositor-planner.test.ts (excerpt)
import { describe, expect, it } from "vitest";
import { planGeneration } from "../../apps/backend/src/product/generation/compositor/compositor-planner.js";

describe("CompositorPlanner", () => {
  it("share-idea medium email → edition-piece without hook", () => {
    const plan = planGeneration({
      intent: "share-idea",
      scope: { lengthTier: "medium", channel: "email" },
      qualityMode: "balanced"
    });
    expect(plan.planSignature).toBe("edition-piece");
    expect(plan.steps.map((s) => s.name)).not.toContain("hook");
    expect(plan.parameters.expressionProfile).toBe("email-share-idea");
  });

  it("explain-deeply long blog → long-piece with research", () => {
    const plan = planGeneration({
      intent: "explain-deeply",
      scope: { lengthTier: "long", channel: "blog" },
      qualityMode: "balanced"
    });
    expect(plan.planSignature).toBe("long-piece");
    expect(plan.steps.map((s) => s.name)).toContain("research");
  });
});
```

Add cases for: `document-decision medium`, `engage-audience short social`, `tell-story medium`, `share-idea short professional-network`.

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement `planGeneration`**

```typescript
// compositor-planner.ts — orchestrates layers:
// 1. pickBasePreset(intent, tier, channel)
// 2. clone preset steps
// 3. apply intent patches (structure step for document-decision)
// 4. apply channel patches (add/remove hook, tighten)
// 5. apply scale gates (drop research/outline on short/medium when not long-piece)
// 6. assign planSignature via dominant preset cost weight
// 7. generate planId (uuid or hash of inputs)
```

```typescript
// plan-materializer.ts
import type { ExecutionPlan } from "@my-ai-orchestrator/contracts";
import type { PipelineDefinition } from "@my-ai-orchestrator/contracts";

export function materializeCompositorPipeline(plan: ExecutionPlan): PipelineDefinition {
  return {
    name: plan.planSignature,
    steps: plan.steps.map((step) => ({
      name: step.name,
      skill: step.skill,
      execution: step.execution,
      ...(step.routingProfile ? { routingProfile: step.routingProfile } : {})
    }))
  };
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

---

## Task 5: Feature flag

**Files:**
- Modify: `packages/feature-flags/src/defaults.ts`
- Create: `tests/feature-flags/generation-compositor-flag.test.ts`

- [ ] **Step 1: Add flag default `false`**

```typescript
{
  key: "generation.compositor_v1",
  defaultValue: false,
  description: "Use Generation Compositor v1 instead of @phase1-legacy contentType resolver"
}
```

- [ ] **Step 2: Test flag registered**

- [ ] **Step 3: Commit**

---

## Task 6: Wire compositor into resolve-generation-target

**Files:**
- Modify: `apps/backend/src/product/generation/resolve-generation-target.ts`
- Modify: `apps/backend/src/product/generation/merge-intent-pipeline-context.ts`
- Create: `tests/backend/resolve-generation-target-compositor.test.ts`

- [ ] **Step 1: Extend `ResolvedGenerationTarget`**

```typescript
export interface ResolvedGenerationTarget {
  readonly contentTypeId: string; // legacy fallback OR planSignature when compositor
  readonly resolvedIntent?: ResolvedGenerationIntent;
  readonly ignoredLegacyContentType?: string;
  readonly compositor?: {
    readonly plan: ExecutionPlan;
    readonly pipeline: PipelineDefinition;
  };
}
```

- [ ] **Step 2: Write failing tests** — with flag on, `resolveGenerationTarget` returns `compositor.plan`; with flag off, unchanged legacy behavior.

- [ ] **Step 3: Implement** — inject `FeatureFlagsService` or pass `compositorEnabled` from caller; when enabled + intent+scope present, call `planGeneration` + `materializeCompositorPipeline`, set `contentTypeId = plan.planSignature` for interim policy lookup.

- [ ] **Step 4: Update `mergeIntentPipelineContext`** to add `context.compositor = { planId, planSignature, expressionProfile, wordTarget }`.

- [ ] **Step 5: Run tests — expect PASS**

- [ ] **Step 6: Commit**

---

## Task 7: Preview + execute pipeline request wiring

**Files:**
- Modify: `apps/backend/src/product/generation/public-generation.ts`
- Modify: `apps/backend/src/product/generation/generation-preview.ts`
- Modify: `tests/backend/backend-generation-intent.test.ts` (or new integration test file)

- [ ] **Step 1: Write failing integration test** — with compositor flag on (mocked in test harness), preview returns `metadata.compositor.planSignature`.

- [ ] **Step 2: In `toInternalPipelineRequest`**, when `resolvedTarget.compositor` present, build:

```typescript
{
  pipeline: resolvedTarget.compositor.pipeline,
  inputs: { ...briefing, wordTarget: plan.parameters.wordTarget, expressionProfile: plan.parameters.expressionProfile },
  language: request.language,
  qualityMode: request.qualityMode,
  context: mergeIntentPipelineContext(...),
  idempotencyKey: request.idempotencyKey
} satisfies ExplicitPipelineRequest
```

Skip `aiPolicy.listContentTypes()` legacy lookup when compositor active; validate against compositor pipeline policy entries instead.

- [ ] **Step 3: Mirror in `generation-preview.ts`**

- [ ] **Step 4: Run integration tests**

- [ ] **Step 5: Commit**

---

## Task 8: AI policy catalog entries for compositor pipelines

**Files:**
- Modify: `apps/backend/policies/official/2026-06-18/catalog.json` (or active policy version)
- Modify: `apps/backend/src/product/ai-policy/ai-policy-snapshot.ts` (only if pipeline lookup fails — prefer catalog entries)
- Create: `tests/backend/compositor-policy-catalog.test.ts`

- [ ] **Step 1: Add four `pipelines` entries** keyed by preset id (`short-piece`, etc.) with steps matching `presets.ts` and policy step configs cloned from nearest legacy pipeline.

- [ ] **Step 2: Test** — `resolveExecutionSnapshot` succeeds for `ExplicitPipelineRequest` with `pipeline.name = "edition-piece"`.

- [ ] **Step 3: Commit**

---

## Task 9: Expression profile in skill runtime

**Files:**
- Modify: `apps/backend/src/execution/skills.ts`
- Create: `apps/backend/src/product/generation/compositor/expression-instructions.ts`
- Create: `tests/backend/compositor-expression-instructions.test.ts`

- [ ] **Step 1: Map expression profiles to format instruction strings**

Examples:
- `email-share-idea` → subject line, preview text, body, CTA rules
- `professional-share-idea` → hook-first, short paragraphs
- `blog-explain-deeply` → headings, section depth

- [ ] **Step 2: In `createBackendSkillDefinition`**, read `expressionProfile` and `wordTarget` from `context.inputs` when present; pass to `resolveFormatInstructions` / template locals (extend or wrap existing helper).

- [ ] **Step 3: Tests** — draft skill template includes email subject instruction when `expressionProfile = email-share-idea`.

- [ ] **Step 4: Commit**

---

## Task 10: Pricing — planSignature × lengthTier × mode

**Files:**
- Modify: `apps/backend/policies/official/2026-06-18/pricing.json`
- Modify: `apps/backend/src/product/ai-policy/resolve-policy-pricing.ts`
- Modify: `apps/backend/src/product/billing/generation-pricing-snapshot.ts`
- Modify: `packages/contracts/src/generation-preview.ts` (add optional `planSignature`, `lengthTier` to preview metadata)
- Create: `tests/backend/compositor-pricing.test.ts`

- [ ] **Step 1: Extend pricing.json schema** with nested grid:

```json
"pricesByPlan": {
  "short-piece": {
    "short": { "fast": 4, "balanced": 12, "strict": 18 },
    "medium": { ... },
    "long": { ... }
  }
}
```

Seed from calibration report + Option B viability spreads; keep legacy `pricesByContentType` until cutover.

- [ ] **Step 2: `resolvePolicyPricing`** — when `planSignature` + `lengthTier` provided, use new grid; else legacy `contentType`.

- [ ] **Step 3: Update quote id hash** to include `planSignature` and `lengthTier` when compositor.

- [ ] **Step 4: Tests** — preview quote for compositor plan differs by tier.

- [ ] **Step 5: Commit**

Coordinate with [`2026-06-18-hybrid-pricing.md`](./2026-06-18-hybrid-pricing.md) quota presentation tasks so preview sidebar shows quotas using new price cells.

---

## Task 11: Telemetry metadata

**Files:**
- Modify: `apps/backend/src/execution/pipeline/pipeline-runtime-state.ts` or telemetry builder
- Modify: `packages/payments/src/pricing-calibration/telemetry-ingest.ts` (read `planSignature` when present)

- [ ] **Step 1: Ensure execution telemetry includes** `pricing.planSignature`, `pricing.lengthTier`, `compositor.planId` in job result metadata.

- [ ] **Step 2: Update calibration ingest** to prefer `planSignature` over `contentType` when tagging rows.

- [ ] **Step 3: Test telemetry row parse with compositor fields**

- [ ] **Step 4: Commit**

---

## Task 12: Parity harness

**Files:**
- Create: `apps/backend/scripts/compositor-parity-harness.ts`
- Create: `apps/backend/scripts/compositor/parity-fixtures.ts`
- Add script: `apps/backend/package.json` → `"compositor:parity": "node dist/scripts/compositor-parity-harness.js"`
- Modify: `apps/backend/scripts/build.mjs` — bundle harness
- Create: `tests/backend/compositor-parity-fixtures.test.ts`

- [ ] **Step 1: Define 6 fixtures** matching spec matrix with shared briefing text per fixture.

- [ ] **Step 2: Harness runs each fixture twice** (legacy flag off vs on) when `CALIBRATION_ACCESS_TOKEN` + `DATABASE_URL` set; writes `docs/superpowers/reports/compositor-parity-report.md` with job ids, USD cost, step counts.

- [ ] **Step 3: Manual rubric section** in report template (intent fit 1–5) for founder to fill after reading outputs.

- [ ] **Step 4: Unit test fixture definitions and plan expectations**

- [ ] **Step 5: Commit**

---

## Task 13: End-to-end integration tests

**Files:**
- Create: `tests/backend/compositor-execution.integration.test.ts`
- Modify: `apps/backend/tests/postgres-test-helpers.ts` if needed

- [ ] **Step 1: With `RUN_POSTGRES_TESTS=true` and compositor flag forced on in test**, enqueue `share-idea + medium + email`, assert job reaches `done`, result metadata contains `planSignature: edition-piece`.

- [ ] **Step 2: Assert worker completes all planned steps** (progress history length ≥ step count).

- [ ] **Step 3: Run `pnpm test:ci`**

- [ ] **Step 4: Commit**

---

## Task 14: Rollout + documentation

**Files:**
- Modify: `docs/superpowers/specs/2026-06-19-generation-compositor-design.md` — set `status: approved` after parity pass
- Create: `docs/superpowers/reports/compositor-parity-runbook.md`
- Modify: `docs/progress-log.md`

- [ ] **Step 1: Run parity harness on VPS** with founder voice profile; fill rubric.

- [ ] **Step 2: If pass criteria met**, set `generation.compositor_v1` default to `true` in staging; then production.

- [ ] **Step 3: Document runbook** — flag toggle, rollback to legacy, recalibration command.

- [ ] **Step 4: Update progress-log**

- [ ] **Step 5: Commit**

---

## Self-review (spec coverage)

| Spec requirement | Task |
|------------------|------|
| Compositor planner | 4, 6 |
| Presets as templates | 2, 4 |
| Channel-aware expression | 3, 9 |
| Reuse orchestrator/skills | 7, 8 |
| planSignature pricing | 10 |
| Legacy fallback + flag | 5, 6 |
| Parity harness gate | 12, 14 |
| Telemetry tagging | 11 |
| Wizard unchanged | Out of scope (no web tasks) |
| Phase 3 planner deferred | Out of scope |

---

## Execution order

```text
Task 1 → 2 → 3 → 4 (planner core)
       → 5 → 6 → 7 → 8 (wiring)
       → 9 (expression)
       → 10 → 11 (pricing + telemetry) — can parallel with 9 after Task 7
       → 12 → 13 (parity + e2e)
       → 14 (rollout)
```

**Estimated:** 14 tasks, ~3–5 sessions with review between Tasks 7, 12, and 14.

---

## Verification commands

```bash
pnpm exec vitest run tests/contracts/generation-compositor.test.ts
pnpm exec vitest run tests/backend/compositor-planner.test.ts
pnpm exec vitest run tests/backend/resolve-generation-target-compositor.test.ts
pnpm test:ci
```

VPS parity (after Task 12 deploy):

```bash
export CALIBRATION_ACCESS_TOKEN=...
export DATABASE_URL=...
pnpm compositor:parity
```
