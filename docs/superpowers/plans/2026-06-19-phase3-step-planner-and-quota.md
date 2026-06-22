# Phase 3 Step Planner + Quota UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship briefing-driven `StepPlanner.patch()` behind `generation.step_planner_v1`, enrich preview with quota presentation on the compositor pricing grid, and add a COGS variance harness to gate full repricing.

**Architecture:** Compositor v1 remains the base plan; StepPlanner applies deterministic patch ops from briefing signals, recomputes `planSignature`, and feeds the same preview/execute path. Quota fields are a presentation layer over existing credits (`packages/payments/quota-presentation.ts`). COGS spike reuses parity fixtures with briefing variants.

**Tech Stack:** TypeScript, Effect, Vitest, existing compositor module (`apps/backend/src/product/generation/compositor/`), feature-flags package, contracts schemas.

**Spec:** [dynamic-step-planner-phase3-onepager.md](../specs/2026-06-19-dynamic-step-planner-phase3-onepager.md)

---

## File map

| Area | Create | Modify |
|------|--------|--------|
| Quota | `packages/payments/src/quota-presentation.ts`, `tests/payments/quota-presentation.test.ts` | `packages/contracts/src/generation-preview.ts`, `packages/payments/src/index.ts` |
| Preview | — | `apps/backend/src/product/generation/generation-preview.ts`, `tests/backend/backend-generation-preview.test.ts` |
| Web | — | `apps/web/src/app/generation/components/GenerationPreviewSidebar.tsx`, i18n keys |
| Step planner | `apps/backend/src/product/generation/step-planner/*` | `resolve-generation-target.ts`, `generation-preview.ts`, `public-generation.ts` |
| Flag | — | `packages/feature-flags/src/defaults.ts`, `apps/backend/src/product/core/feature-flags.ts`, `apps/backend/src/config/config-env.ts` |
| Telemetry | — | `packages/contracts/src/execution/job.ts` (ExecutionTelemetrySchema), execution metadata wiring |
| COGS spike | `apps/backend/scripts/step-planner-cogs-harness.ts` | `apps/backend/package.json` script |
| Policy anchor | — | `apps/backend/policies/official/2026-05-16/pricing.json` (`canonicalCreditCost`) |

---

### Task 1: Quota presentation helpers (payments)

**Files:**
- Create: `packages/payments/src/quota-presentation.ts`
- Create: `tests/payments/quota-presentation.test.ts`
- Modify: `packages/payments/src/index.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, expect, it } from "vitest";
import {
  resolveQuotaCost,
  resolveQuotaLimit,
  resolveQuotaRemaining
} from "../../packages/payments/src/quota-presentation.js";

describe("quota presentation", () => {
  const canonical = 2.5;

  it("converts credit price to quota cost with ceil", () => {
    expect(resolveQuotaCost(2.5, canonical)).toBe(1);
    expect(resolveQuotaCost(3, canonical)).toBe(2);
  });

  it("converts wallet balance to quota remaining with floor", () => {
    expect(resolveQuotaRemaining(10, canonical)).toBe(4);
    expect(resolveQuotaRemaining(2, canonical)).toBe(0);
  });

  it("converts monthly credits to quota limit", () => {
    expect(resolveQuotaLimit(50, canonical)).toBe(20);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm exec vitest run tests/payments/quota-presentation.test.ts`

- [ ] **Step 3: Implement**

```typescript
export function resolveQuotaCost(creditPrice: number, canonicalCreditCost: number): number {
  if (canonicalCreditCost <= 0) return 1;
  return Math.max(1, Math.ceil(creditPrice / canonicalCreditCost));
}

export function resolveQuotaRemaining(availableCredits: number, canonicalCreditCost: number): number {
  if (canonicalCreditCost <= 0) return 0;
  return Math.max(0, Math.floor(availableCredits / canonicalCreditCost));
}

export function resolveQuotaLimit(monthlyCredits: number, canonicalCreditCost: number): number {
  if (canonicalCreditCost <= 0) return 0;
  return Math.max(1, Math.floor(monthlyCredits / canonicalCreditCost));
}
```

Export from `packages/payments/src/index.ts`.

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Commit** `feat(payments): add quota presentation helpers`

---

### Task 2: Contracts — quota fields on preview response

**Files:**
- Modify: `packages/contracts/src/generation-preview.ts`
- Modify: `tests/contracts/contracts-schema.test.ts` (or dedicated preview test)

- [ ] **Step 1: Extend `GenerationPreviewResponseSchema`**

```typescript
quotaRemaining: Schema.Number,
quotaLimit: Schema.Number,
quotaCost: Schema.Number,
canonicalCreditCost: Schema.optional(Schema.Number),
```

- [ ] **Step 2: Failing decode test** with sample payload including quota fields.

- [ ] **Step 3: Run vitest contracts — PASS**

- [ ] **Step 4: Commit** `feat(contracts): add quota fields to generation preview response`

---

### Task 3: Policy canonical anchor + preview enrichment

**Files:**
- Modify: `apps/backend/policies/official/2026-05-16/pricing.json`
- Modify: `apps/backend/src/product/generation/generation-preview.ts`
- Modify: `tests/backend/backend-generation-preview.test.ts`

- [ ] **Step 1: Add root field** `"canonicalCreditCost": 2.5` (anchor = `short-piece × balanced` from `pricesByPlan`).

- [ ] **Step 2: Failing preview test**

```typescript
expect(decoded.quotaCost).toBeGreaterThanOrEqual(1);
expect(decoded.quotaLimit).toBeGreaterThan(0);
expect(decoded.quotaRemaining).toBeLessThanOrEqual(decoded.quotaLimit);
expect(decoded.currentBalance).toBeTypeOf("number"); // SDK field preserved
```

- [ ] **Step 3: In preview service**, after `pricingSnapshot` resolved, read `canonicalCreditCost` from active pricing policy (fallback 2.5), compute quota fields via payments helpers.

- [ ] **Step 4: Run** `pnpm exec vitest run tests/backend/backend-generation-preview.test.ts`

- [ ] **Step 5: Commit** `feat(backend): enrich generation preview with quota presentation`

---

### Task 4: Web — show quota in preview sidebar

**Files:**
- Modify: `apps/web/src/app/generation/components/GenerationPreviewSidebar.tsx`
- Modify: locale files (`apps/web/src/i18n/` or project convention)
- Create: `tests/web/generation-preview-quota.test.ts` (if hook extraction needed)

- [ ] **Step 1: Display** `quotaCost`, `quotaRemaining`, `quotaLimit` with copy like “Usa ~{quotaCost} geração(ões) · Restam aprox. {quotaRemaining} de {quotaLimit}”.

- [ ] **Step 2: Keep credit fields** for SDK/debug only — do not surface `currentBalance` in header if quota present.

- [ ] **Step 3: Run** `pnpm exec vitest run tests/web/` (targeted)

- [ ] **Step 4: Commit** `feat(web): show quota presentation in generation preview sidebar`

---

### Task 5: Step planner contracts + patch ops core

**Files:**
- Create: `apps/backend/src/product/generation/step-planner/types.ts`
- Create: `apps/backend/src/product/generation/step-planner/patch-ops.ts`
- Create: `apps/backend/src/product/generation/step-planner/guardrails.ts`
- Create: `tests/backend/step-planner-patch-ops.test.ts`

- [ ] **Step 1: Define patch op union**

```typescript
export type StepPlannerPatchOp =
  | { readonly type: "insertStep"; readonly before: string; readonly step: PlannedStep }
  | { readonly type: "removeStep"; readonly name: string }
  | { readonly type: "adjustWordTarget"; readonly min: number; readonly max: number };
```

- [ ] **Step 2: `applyPatchOps(plan, ops)`** — clone steps, forbid removing `sanitize`, forbid unknown skills, enforce max LLM steps: short≤3, medium≤4, long≤6.

- [ ] **Step 3: Tests** for guardrail violations and successful insert/remove.

- [ ] **Step 4: Commit** `feat(step-planner): patch ops and guardrails`

---

### Task 6: Briefing-driven rules

**Files:**
- Create: `apps/backend/src/product/generation/step-planner/briefing-rules.ts`
- Create: `apps/backend/src/product/generation/step-planner/step-planner.ts`
- Create: `tests/backend/step-planner-briefing-rules.test.ts`

- [ ] **Step 1: `derivePatchOps(input)`** rules from one-pager:
  - `explain-deeply` + short briefing text (<200 chars) → remove `research`, `outline`
  - `engage-audience` + no `question` field → remove `hook`
  - `document-decision` + long `systemContext` (>400 chars) → insert `structure` before `draft` if missing

- [ ] **Step 2: `patchExecutionPlan(basePlan, briefing)`** → apply ops, recompute `planSignature` via `resolveDominantPlanSignature`, return `{ plan, ops, basePlanSignature }`.

- [ ] **Step 3: Tests** per rule with fixture briefings.

- [ ] **Step 4: Commit** `feat(step-planner): briefing-driven deterministic rules`

---

### Task 7: Feature flag + wiring

**Files:**
- Modify: `packages/feature-flags/src/defaults.ts`
- Modify: `apps/backend/src/product/core/feature-flags.ts`
- Modify: `apps/backend/src/product/generation/resolve-generation-target.ts`
- Modify: `apps/backend/src/product/generation/generation-preview.ts`
- Create: `apps/backend/src/product/generation/is-step-planner-enabled.ts`
- Create: `tests/feature-flags/generation-step-planner-flag.test.ts`
- Create: `tests/backend/resolve-generation-target-step-planner.test.ts`

- [ ] **Step 1: Flag** `generation.step_planner_v1` default `off`; requires compositor enabled.

- [ ] **Step 2: After `planGeneration()`**, if step planner on and briefing present, call `patchExecutionPlan`.

- [ ] **Step 3: Preview pricing** uses **final** plan `planSignature` (answer open question #3 in one-pager).

- [ ] **Step 4: Tests** compositor+planner vs compositor-only.

- [ ] **Step 5: Commit** `feat(generation): wire step planner behind feature flag`

---

### Task 8: Planner telemetry

**Files:**
- Modify: `packages/contracts/src/execution/job.ts` (`ExecutionTelemetrySchema`)
- Modify: execution metadata assembly (search `metadata.telemetry` in backend execution path)

- [ ] **Step 1: Add optional `planner` block**

```typescript
planner: Schema.optional(Schema.Struct({
  patchCount: Schema.Number,
  ops: Schema.Array(Schema.String),
  basePlanSignature: PlanSignatureSchema,
  finalPlanSignature: PlanSignatureSchema
}))
```

- [ ] **Step 2: Populate** when step planner runs.

- [ ] **Step 3: Contract test + backend test**

- [ ] **Step 4: Commit** `feat(telemetry): step planner patch metadata`

---

### Task 9: COGS variance harness

**Files:**
- Create: `apps/backend/scripts/step-planner/briefing-variants.ts`
- Create: `apps/backend/scripts/step-planner-cogs-harness.ts`
- Modify: `apps/backend/package.json` → `"step-planner:cogs": "node dist/scripts/step-planner-cogs-harness.js"`

- [ ] **Step 1: Dry-run mode** — for each parity fixture × 3 briefing variants, compute base vs patched plan (no HTTP): LLM step count, planSignature drift.

- [ ] **Step 2: Optional `--execute`** — live runs when env set (like parity harness).

- [ ] **Step 3: Write report** `docs/superpowers/reports/step-planner-cogs-report.md` with p50/p90 summary.

- [ ] **Step 4: Commit** `feat(step-planner): COGS variance harness`

---

### Task 10: Integration test + docs

**Files:**
- Create: `tests/backend/step-planner-execution.integration.test.ts` (skip without postgres like compositor test)
- Modify: `docs/progress-log.md`
- Modify: `docs/superpowers/specs/2026-06-19-dynamic-step-planner-phase3-onepager.md` → `status: approved` after spike pass

- [ ] **Step 1: Integration test** — preview with planner on returns different `planSignature` for heavy `document-decision` briefing vs minimal.

- [ ] **Step 2: Run full test suite** `pnpm test`

- [ ] **Step 3: Update progress-log**

- [ ] **Step 4: Commit** `test(step-planner): integration coverage and docs`

---

## Execution order

```text
Task 1 → 2 → 3 → 4   (Track A: quota UX)
Task 5 → 6 → 7 → 8 → 9 → 10   (Track B: step planner + spike)
```

Track A tasks are independent of B except Task 7+ should merge cleanly. Implement **sequentially** (subagent-driven-development — no parallel implementers).

## Self-review (spec coverage)

| One-pager requirement | Task |
|-----------------------|------|
| StepPlanner.patch | 5, 6, 7 |
| Deterministic guardrails | 5 |
| Briefing rules | 6 |
| Feature flag | 7 |
| Telemetry | 8 |
| COGS spike | 9 |
| Quota UX (Track A) | 1–4 |
| planSignature recompute | 6, 7 |
| LLM assist v1.1 | Out of scope |
