# Hybrid Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship token-calibrated internal credits with quota-based UX (gerações), new plan ladder (Free / Criador / Pro), and per-format `creditPrice` tables — without exposing internal credit math in the web UI.

**Architecture:** Keep `packages/payments` reserve/capture/ledger unchanged. Extend `pricing.json` with `canonicalCreditCost` + per-format prices. Add `quota-presentation.ts` to convert credits ↔ user-facing quotas. Enrich Generation Preview and Billing entitlement API responses with quota fields; web consumes quotas only. Phase 0 calibration script ingests production job telemetry before applying new prices.

**Tech Stack:** TypeScript, Effect-TS, Effect Schema (`@my-ai-orchestrator/contracts`), Vitest, Hono backend, React (`apps/web`), Kysely/PostgreSQL (job telemetry for calibration).

**Spec:** [`docs/superpowers/specs/2026-06-18-hybrid-pricing-design.md`](../specs/2026-06-18-hybrid-pricing-design.md)

---

## File map

| File | Responsibility |
|------|----------------|
| `packages/payments/src/quota-presentation.ts` | Pure quota conversion helpers |
| `packages/payments/src/pricing-calibration/types.ts` | Calibration input/output types |
| `packages/payments/src/pricing-calibration/theoretical-cost.ts` | Pipeline-based cost estimates |
| `packages/payments/src/pricing-calibration/margin-simulation.ts` | Plan margin scenarios |
| `packages/payments/src/pricing-calibration/telemetry-ingest.ts` | Parse job telemetry rows |
| `packages/payments/src/default-plans.ts` | Free / Criador / Pro allowances |
| `packages/contracts/src/quota-presentation.ts` | Shared quota view schemas |
| `packages/contracts/src/generation-preview.ts` | Add quota fields to preview response |
| `packages/contracts/src/billing-checkout.ts` | Add quota fields to entitlement view |
| `apps/backend/src/product/ai-policy/ai-policy-schema.ts` | Pricing doc root metadata |
| `apps/backend/policies/official/2026-06-18/pricing.json` | Calibrated prices (new version) |
| `apps/backend/policies/official/manifest.json` | Point active version to 2026-06-18 |
| `apps/backend/src/product/ai-policy/ai-policy-version-index.ts` | Return `canonicalCreditCost` |
| `apps/backend/src/product/generation/generation-preview.ts` | Attach quota fields to preview |
| `apps/backend/src/routes/billing-routes.ts` | Quota fields on entitlement endpoint |
| `scripts/calibrate-hybrid-pricing.ts` | CLI: telemetry → proposed pricing.json |
| `scripts/report-pricing-margin.ts` | Ops margin report from completed jobs |
| `apps/web/src/i18n/app/messages/{pt,en}.ts` | Quota copy + educational details |
| `apps/web/src/app/generation/components/GenerationPreviewSidebar.tsx` | Quota UX |
| `apps/web/src/app/generation/components/QuotaUsageDetails.tsx` | Educational "ver detalhes" |
| `apps/web/src/app/billing/screens/BillingScreen.tsx` | Quota progress + equivalences |
| `tests/payments/quota-presentation.test.ts` | Quota conversion unit tests |
| `tests/payments/pricing-calibration.test.ts` | Theoretical cost + margin tests |
| `tests/backend/backend-generation-preview.test.ts` | Preview quota fields |
| `tests/web/generation-quota-i18n.test.ts` | i18n keys present |

## Locked decisions

- **Criador** plan: `id: "criador"`, `tier: "starter"` (reuses existing tier ladder).
- **Canonical cell:** `validation-post` × `balanced`.
- **Target margin:** 0.675 (67.5%).
- **Initial allowances (pre-calibration defaults):** Free 96, Criador 300, Pro 720 internal credits.
- **Remove** `dailyCredits` from Pro.
- **Web UI:** never render `creditPrice`, `currentBalance`, or internal credits.

## Out of scope (this plan)

- Enterprise seats / shared workspace (Phase 4 in spec).
- Marketing pricing page (separate web task).
- Terms-of-use legal copy (product/legal task; spec lists requirements only).

---

## Phase 0 — Calibration (run before Phase 1 Task 5)

### Task 0: Calibration CLI

**Files:**
- Create: `packages/payments/src/pricing-calibration/types.ts`
- Create: `packages/payments/src/pricing-calibration/theoretical-cost.ts`
- Create: `packages/payments/src/pricing-calibration/margin-simulation.ts`
- Create: `packages/payments/src/pricing-calibration/telemetry-ingest.ts`
- Create: `packages/payments/src/pricing-calibration/index.ts`
- Create: `scripts/calibrate-hybrid-pricing.ts`
- Create: `tests/fixtures/billing/calibration-jobs.json`
- Create: `tests/payments/pricing-calibration.test.ts`
- Test: `tests/payments/pricing-calibration.test.ts`

- [ ] **Step 1: Write failing calibration tests**

```typescript
// tests/payments/pricing-calibration.test.ts
import { describe, expect, it } from "vitest";
import { estimateTheoreticalCostUsd } from "../../packages/payments/src/pricing-calibration/theoretical-cost.js";
import { deriveCreditPrice } from "../../packages/payments/src/pricing-calibration/margin-simulation.js";
import { parseJobTelemetryRows } from "../../packages/payments/src/pricing-calibration/telemetry-ingest.js";
import fixture from "../fixtures/billing/calibration-jobs.json";

describe("pricing calibration", () => {
  it("estimates higher cost for long-form-blog strict than twitter-thread fast", () => {
    const blog = estimateTheoreticalCostUsd({
      contentType: "long-form-blog",
      qualityMode: "strict"
    });
    const tweet = estimateTheoreticalCostUsd({
      contentType: "twitter-thread",
      qualityMode: "fast"
    });
    expect(blog).toBeGreaterThan(tweet);
  });

  it("derives credit price with target margin", () => {
    expect(
      deriveCreditPrice({
        costUsd: 0.15,
        targetMargin: 0.675,
        creditUsdValue: 0.01,
        rounding: "ceil_1_decimal"
      })
    ).toBe(4.7);
  });

  it("parses job telemetry rows from fixture", () => {
    const rows = parseJobTelemetryRows(fixture);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toMatchObject({
      contentType: expect.any(String),
      qualityMode: expect.any(String),
      observedUsdCost: expect.any(Number)
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk test vitest run tests/payments/pricing-calibration.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement calibration modules**

```typescript
// packages/payments/src/pricing-calibration/theoretical-cost.ts
import type { QualityMode } from "@my-ai-orchestrator/contracts";

const BASE_USD: Record<string, Record<QualityMode, number>> = {
  "twitter-thread": { fast: 0.03, balanced: 0.09, strict: 0.35 },
  "linkedin-post": { fast: 0.035, balanced: 0.12, strict: 0.45 },
  "validation-post": { fast: 0.04, balanced: 0.15, strict: 0.55 },
  newsletter: { fast: 0.045, balanced: 0.17, strict: 0.65 },
  "long-form-blog": { fast: 0.08, balanced: 0.28, strict: 1.1 },
  "architecture-post": { fast: 0.085, balanced: 0.3, strict: 1.2 }
};

export function estimateTheoreticalCostUsd(input: {
  readonly contentType: string;
  readonly qualityMode: QualityMode;
}): number {
  const row = BASE_USD[input.contentType] ?? BASE_USD["validation-post"];
  return row[input.qualityMode];
}
```

```typescript
// packages/payments/src/pricing-calibration/margin-simulation.ts
import { roundCredits } from "../billing-utils.js";

export function deriveCreditPrice(input: {
  readonly costUsd: number;
  readonly targetMargin: number;
  readonly creditUsdValue: number;
  readonly rounding: "ceil_1_decimal";
}): number {
  const revenueUsd = input.costUsd / (1 - input.targetMargin);
  return roundCredits(revenueUsd / input.creditUsdValue, input.rounding);
}

export function simulatePlanMargin(input: {
  readonly monthlyCredits: number;
  readonly generations: ReadonlyArray<{ creditPrice: number; costUsd: number }>;
  readonly planRevenueUsd: number;
}): number {
  const totalCost = input.generations.reduce((sum, g) => sum + g.costUsd, 0);
  return (input.planRevenueUsd - totalCost) / input.planRevenueUsd;
}
```

```typescript
// packages/payments/src/pricing-calibration/telemetry-ingest.ts
export interface CalibrationTelemetryRow {
  readonly contentType: string;
  readonly qualityMode: string;
  readonly inputTokensTotal: number;
  readonly outputTokensTotal: number;
  readonly observedUsdCost: number;
  readonly debitedCredits: number;
}

export function parseJobTelemetryRows(raw: unknown): CalibrationTelemetryRow[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((entry) => {
    const job = entry as {
      data?: {
        contentType?: string;
        result?: {
          telemetry?: {
            preview?: { finalQualityMode?: string };
            cost?: { inputTokensTotal?: number; outputTokensTotal?: number; estimatedUsdCost?: number; debitedCredits?: number };
            pricing?: { contentType?: string };
          };
        };
      };
    };
    const telemetry = job.data?.result?.telemetry;
    if (!telemetry?.cost) {
      return [];
    }
    return [{
      contentType: telemetry.pricing?.contentType ?? job.data?.contentType ?? "unknown",
      qualityMode: telemetry.preview?.finalQualityMode ?? "balanced",
      inputTokensTotal: telemetry.cost.inputTokensTotal ?? 0,
      outputTokensTotal: telemetry.cost.outputTokensTotal ?? 0,
      observedUsdCost: telemetry.cost.estimatedUsdCost ?? 0,
      debitedCredits: telemetry.cost.debitedCredits ?? 0
    }];
  });
}
```

```typescript
// scripts/calibrate-hybrid-pricing.ts
import { readFileSync, writeFileSync } from "node:fs";
import { deriveCreditPrice } from "../packages/payments/src/pricing-calibration/margin-simulation.js";
import { estimateTheoreticalCostUsd } from "../packages/payments/src/pricing-calibration/theoretical-cost.js";
import { parseJobTelemetryRows } from "../packages/payments/src/pricing-calibration/telemetry-ingest.js";

const CONTENT_TYPES = [
  "long-form-blog", "validation-post", "architecture-post",
  "linkedin-post", "twitter-thread", "newsletter"
] as const;
const MODES = ["fast", "balanced", "strict"] as const;
const TIERS = ["free", "starter", "pro", "enterprise"] as const;
const TARGET_MARGIN = 0.675;
const CREDIT_USD_VALUE = 0.01;

const telemetryPath = process.argv[2] ?? "tests/fixtures/billing/calibration-jobs.json";
const rows = parseJobTelemetryRows(JSON.parse(readFileSync(telemetryPath, "utf8")));

function resolveCostUsd(contentType: string, qualityMode: (typeof MODES)[number]): number {
  const observed = rows.filter((r) => r.contentType === contentType && r.qualityMode === qualityMode);
  if (observed.length > 0) {
    const sorted = [...observed].map((r) => r.observedUsdCost).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)]!;
  }
  return estimateTheoreticalCostUsd({ contentType, qualityMode });
}

const pricing = TIERS.flatMap((planTier) =>
  CONTENT_TYPES.flatMap((contentType) =>
    MODES.map((qualityMode) => ({
      planTier,
      contentType,
      qualityMode,
      creditPrice: deriveCreditPrice({
        costUsd: resolveCostUsd(contentType, qualityMode),
        targetMargin: TARGET_MARGIN,
        creditUsdValue: CREDIT_USD_VALUE,
        rounding: "ceil_1_decimal"
      })
    }))
  )
);

const canonical = pricing.find(
  (p) => p.contentType === "validation-post" && p.qualityMode === "balanced"
)!.creditPrice;

const document = {
  policyVersion: "2026-06-18",
  lifecycle: "active",
  creditUsdValue: CREDIT_USD_VALUE,
  canonicalCreditCost: canonical,
  targetMargin: TARGET_MARGIN,
  pricing
};

const outPath = "apps/backend/policies/official/2026-06-18/pricing.json";
writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Wrote ${outPath} (canonicalCreditCost=${canonical})`);
```

- [ ] **Step 4: Add fixture from production export**

Export 14 production jobs to `tests/fixtures/billing/calibration-jobs.json` (array of `{ data: { contentType, result: { telemetry } } }`). Re-run script against production export before merging Phase 1.

- [ ] **Step 5: Run tests**

Run: `rtk test vitest run tests/payments/pricing-calibration.test.ts`
Expected: PASS

- [ ] **Step 6: Run calibration script**

Run: `tsx scripts/calibrate-hybrid-pricing.ts`
Expected: writes `apps/backend/policies/official/2026-06-18/pricing.json`

- [ ] **Step 7: Human review checkpoint**

Review generated `pricing.json`, margin report output, and adjust `monthlyCredits` in Task 6 if simulation shows margin <65% on Pro mix. **Do not proceed to Task 5 until approved.**

- [ ] **Step 8: Commit**

```bash
git add packages/payments/src/pricing-calibration scripts/calibrate-hybrid-pricing.ts tests/
git commit -m "feat(billing): add hybrid pricing calibration toolkit and CLI"
```

---

## Phase 1 — Internal repricing

### Task 1: Quota presentation layer

**Files:**
- Create: `packages/payments/src/quota-presentation.ts`
- Modify: `packages/payments/src/index.ts`
- Create: `tests/payments/quota-presentation.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/payments/quota-presentation.test.ts
import { describe, expect, it } from "vitest";
import {
  resolveQuotaCost,
  resolveQuotaEquivalences,
  resolveQuotaLimit,
  resolveQuotaRemaining
} from "../../packages/payments/src/quota-presentation.js";

describe("quota presentation", () => {
  const canonical = 12;

  it("converts credits to quota remaining", () => {
    expect(resolveQuotaRemaining(300, canonical)).toBe(25);
  });

  it("ceil quota cost for expensive generations", () => {
    expect(resolveQuotaCost(30, canonical)).toBe(3);
    expect(resolveQuotaCost(12, canonical)).toBe(1);
  });

  it("computes per-mode equivalences from monthly credits", () => {
    expect(
      resolveQuotaEquivalences({
        monthlyCredits: 300,
        canonicalCreditCost: 12,
        creditPricesByMode: { fast: 3, balanced: 12, strict: 48 }
      })
    ).toEqual({ fast: 100, balanced: 25, strict: 6 });
  });

  it("computes quota limit from plan grant", () => {
    expect(resolveQuotaLimit(300, canonical)).toBe(25);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk test vitest run tests/payments/quota-presentation.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```typescript
// packages/payments/src/quota-presentation.ts
import type { QualityMode } from "@my-ai-orchestrator/contracts";

export function resolveQuotaRemaining(
  availableCredits: number,
  canonicalCreditCost: number
): number {
  if (canonicalCreditCost <= 0) {
    return 0;
  }
  return Math.max(0, Math.floor(availableCredits / canonicalCreditCost));
}

export function resolveQuotaLimit(
  monthlyCredits: number,
  canonicalCreditCost: number
): number {
  if (canonicalCreditCost <= 0) {
    return 0;
  }
  return Math.max(1, Math.floor(monthlyCredits / canonicalCreditCost));
}

export function resolveQuotaCost(creditPrice: number, canonicalCreditCost: number): number {
  if (canonicalCreditCost <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(creditPrice / canonicalCreditCost));
}

export function resolveQuotaEquivalences(input: {
  readonly monthlyCredits: number;
  readonly canonicalCreditCost: number;
  readonly creditPricesByMode: Record<QualityMode, number>;
}): Record<QualityMode, number> {
  return {
    fast: Math.floor(input.monthlyCredits / input.creditPricesByMode.fast),
    balanced: Math.floor(input.monthlyCredits / input.creditPricesByMode.balanced),
    strict: Math.floor(input.monthlyCredits / input.creditPricesByMode.strict)
  };
}
```

- [ ] **Step 4: Export from index**

```typescript
export {
  resolveQuotaCost,
  resolveQuotaEquivalences,
  resolveQuotaLimit,
  resolveQuotaRemaining
} from "./quota-presentation.js";
```

- [ ] **Step 5: Run tests**

Run: `rtk test vitest run tests/payments/quota-presentation.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/payments/src/quota-presentation.ts packages/payments/src/index.ts tests/payments/quota-presentation.test.ts
git commit -m "feat(payments): add quota presentation conversion helpers"
```

---

### Task 2: Pricing document schema + policy version

**Files:**
- Modify: `apps/backend/src/product/ai-policy/ai-policy-schema.ts`
- Modify: `apps/backend/src/product/ai-policy/ai-policy-version-index.ts`
- Modify: `apps/backend/src/product/ai-policy/ai-policy-types.ts`
- Create: `apps/backend/policies/official/2026-06-18/pricing.json` (from Task 0)
- Modify: `apps/backend/policies/official/manifest.json`
- Modify: `tests/backend/backend-ai-policy.test.ts`

- [ ] **Step 1: Write failing policy schema test**

Add to `tests/backend/backend-ai-policy.test.ts`:

```typescript
it("loads canonicalCreditCost from pricing document root", async () => {
  const envelope = await resolvePricingForTest({
    planTier: "pro",
    contentType: "validation-post",
    qualityMode: "balanced",
    policyVersion: "2026-06-18"
  });
  expect(envelope.canonicalCreditCost).toBeGreaterThan(0);
  expect(envelope.creditPrice).toBe(envelope.canonicalCreditCost);
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `rtk test vitest run tests/backend/backend-ai-policy.test.ts -t "canonicalCreditCost"`
Expected: FAIL

- [ ] **Step 3: Extend schema**

```typescript
// apps/backend/src/product/ai-policy/ai-policy-schema.ts
export const AIPolicyPricingDocumentSchema = Schema.Struct({
  policyVersion: Schema.String,
  lifecycle: AIPolicyLifecycleSchema,
  creditUsdValue: Schema.optional(Schema.Number),
  canonicalCreditCost: Schema.optional(Schema.Number),
  targetMargin: Schema.optional(Schema.Number),
  pricing: Schema.Array(
    Schema.Struct({
      planTier: BillingPlanTierSchema,
      contentType: Schema.String,
      qualityMode: QualityModeSchema,
      creditPrice: Schema.Number
    })
  )
});
```

```typescript
// apps/backend/src/product/ai-policy/ai-policy-types.ts — extend ResolvedPricingEnvelope
readonly canonicalCreditCost: number;
```

```typescript
// apps/backend/src/product/ai-policy/ai-policy-version-index.ts — in resolvePolicyPricingEnvelope return:
canonicalCreditCost:
  index.pricingDocuments.get(policy.version)?.pricing.canonicalCreditCost ??
  matchingPrice.creditPrice
```

- [ ] **Step 4: Update manifest**

```json
{
  "activeVersion": "2026-06-18",
  "versions": [
    {
      "version": "2026-06-18",
      "lifecycle": "active",
      "catalogPath": "./2026-05-16/catalog.json",
      "pricingPath": "./2026-06-18/pricing.json"
    },
    {
      "version": "2026-05-16",
      "lifecycle": "legacy-supported",
      "catalogPath": "./2026-05-16/catalog.json",
      "pricingPath": "./2026-05-16/pricing.json"
    }
  ]
}
```

- [ ] **Step 5: Run tests**

Run: `rtk test vitest run tests/backend/backend-ai-policy.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/backend/policies/ apps/backend/src/product/ai-policy/ tests/backend/backend-ai-policy.test.ts
git commit -m "feat(billing): add 2026-06-18 pricing policy with canonical credit cost"
```

---

### Task 3: Plan definitions (Free / Criador / Pro)

**Files:**
- Modify: `packages/payments/src/default-plans.ts`
- Modify: `tests/payments/default-free-subscription.test.ts`
- Modify: `tests/payments/gateway-webhook-dispatch.test.ts`
- Modify: `tests/payments/payments-package.test.ts`

- [ ] **Step 1: Write failing plan test**

```typescript
// tests/payments/default-free-subscription.test.ts — add:
it("registers criador plan with starter tier and 300 monthly credits", () => {
  const criador = DEFAULT_BILLING_PLANS.find((p) => p.id === "criador");
  expect(criador).toMatchObject({ tier: "starter", monthlyCredits: 300 });
});

it("pro plan has no dailyCredits and 720 monthly credits", () => {
  const pro = DEFAULT_BILLING_PLANS.find((p) => p.id === "pro");
  expect(pro?.monthlyCredits).toBe(720);
  expect(pro?.dailyCredits).toBeUndefined();
});
```

Update free expectation from `50` → `96` in existing tests.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `rtk test vitest run tests/payments/default-free-subscription.test.ts tests/payments/gateway-webhook-dispatch.test.ts`
Expected: FAIL

- [ ] **Step 3: Update default plans**

```typescript
// packages/payments/src/default-plans.ts
export const DEFAULT_BILLING_PLANS: readonly BillingPlanDefinition[] = [
  {
    id: "free",
    tier: "free",
    name: "Free",
    monthlyCredits: 96,
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: false }
    ],
    allowedModels: ["llama3.1", "gpt-4o-mini"]
  },
  {
    id: "criador",
    tier: "starter",
    name: "Criador",
    monthlyCredits: 300,
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: false }
    ],
    allowedModels: ["gpt-4o-mini", "gpt-4.1"]
  },
  {
    id: "pro",
    tier: "pro",
    name: "Pro",
    monthlyCredits: 720,
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: true },
      { key: "rollout.beta.access", enabled: true }
    ],
    allowedModels: ["gpt-4o-mini", "gpt-4.1", "claude-3-5-sonnet"]
  }
];
```

- [ ] **Step 4: Fix all tests expecting 50 / 2500 credits**

- [ ] **Step 5: Run payments tests**

Run: `rtk test vitest run tests/payments/`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/payments/src/default-plans.ts tests/payments/
git commit -m "feat(billing): add Criador plan and realistic monthly credit allowances"
```

---

## Phase 2 — API quota enrichment + web UX

### Task 4: Contract extensions

**Files:**
- Create: `packages/contracts/src/quota-presentation.ts`
- Modify: `packages/contracts/src/generation-preview.ts`
- Modify: `packages/contracts/src/billing-checkout.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `tests/contracts/contracts-schema.test.ts`

- [ ] **Step 1: Write failing schema test**

```typescript
// tests/contracts/contracts-schema.test.ts — extend preview decode:
expect(value.quotaRemaining).toBe(23);
expect(value.quotaCost).toBe(1);
expect(value.quotaLimit).toBe(25);
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Add schemas**

```typescript
// packages/contracts/src/quota-presentation.ts
import { Schema } from "effect";
import { QualityModeSchema } from "./execution.js";

export const QuotaEquivalencesSchema = Schema.Struct({
  fast: Schema.Number,
  balanced: Schema.Number,
  strict: Schema.Number
});
export type QuotaEquivalences = typeof QuotaEquivalencesSchema.Type;
```

```typescript
// packages/contracts/src/generation-preview.ts — add to response:
quotaRemaining: Schema.Number,
quotaLimit: Schema.Number,
quotaCost: Schema.Number,
```

```typescript
// packages/contracts/src/billing-checkout.ts — extend entitlement:
quotaRemaining: Schema.Number,
quotaLimit: Schema.Number,
quotaEquivalences: QuotaEquivalencesSchema,
```

Keep `availableCredits` / `creditPrice` fields for SDK; web will ignore them.

- [ ] **Step 4: Run contract tests**

Run: `rtk test vitest run tests/contracts/contracts-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/
git commit -m "feat(contracts): add quota fields to preview and entitlement views"
```

---

### Task 5: Backend generation preview quota enrichment

**Files:**
- Modify: `apps/backend/src/product/generation/generation-preview.ts`
- Modify: `tests/backend/backend-generation-preview.test.ts`
- Modify: `tests/backend/backend-free-tier-quality-modes.test.ts`

- [ ] **Step 1: Write failing preview test**

```typescript
it("returns quota fields derived from canonical credit cost", async () => {
  const decoded = await previewForUser("user_pro");
  expect(decoded.quotaCost).toBeGreaterThanOrEqual(1);
  expect(decoded.quotaLimit).toBeGreaterThan(0);
  expect(decoded.quotaRemaining).toBeLessThanOrEqual(decoded.quotaLimit);
  // SDK fields still present:
  expect(decoded.currentBalance).toBeTypeOf("number");
});
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Enrich preview service**

```typescript
import {
  resolveQuotaCost,
  resolveQuotaLimit,
  resolveQuotaRemaining
} from "@my-ai-orchestrator/payments";

// inside preview(), after pricingSnapshot resolved:
const plan = options.billing.getPlan(entitlement?.planId ?? "free");
const canonicalCreditCost = pricingSnapshot.canonicalCreditCost;
const monthlyCredits = plan?.monthlyCredits ?? 0;

return {
  pricingSnapshot: commercialPricingSnapshot,
  currentBalance,
  projectedBalanceAfterGeneration: roundCredits(currentBalance - pricingSnapshot.creditPrice),
  quotaRemaining: resolveQuotaRemaining(currentBalance, canonicalCreditCost),
  quotaLimit: resolveQuotaLimit(monthlyCredits, canonicalCreditCost),
  quotaCost: resolveQuotaCost(pricingSnapshot.creditPrice, canonicalCreditCost),
  // ...rest unchanged
};
```

- [ ] **Step 4: Run backend preview tests**

Run: `rtk test vitest run tests/backend/backend-generation-preview.test.ts tests/backend/backend-free-tier-quality-modes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/product/generation/generation-preview.ts tests/backend/
git commit -m "feat(backend): expose quota fields on generation preview"
```

---

### Task 6: Billing entitlement endpoint

**Files:**
- Modify: `apps/backend/src/routes/billing-routes.ts`
- Modify: `apps/backend/src/product/billing/resolve-user-billing.ts` (if helper needed)
- Create: `apps/backend/src/product/billing/quota-entitlement-view.ts`
- Modify: `tests/backend/billing-checkout.test.ts` (or add `billing-entitlement.test.ts`)

- [ ] **Step 1: Write failing entitlement route test**

```typescript
it("GET /me/billing/entitlement returns quotaRemaining and equivalences", async () => {
  const res = await app.request("/me/billing/entitlement", { headers: authHeaders });
  const body = await res.json();
  expect(body.quotaRemaining).toBeTypeOf("number");
  expect(body.quotaEquivalences.balanced).toBeTypeOf("number");
});
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Build entitlement view helper**

```typescript
// apps/backend/src/product/billing/quota-entitlement-view.ts
import {
  resolveQuotaEquivalences,
  resolveQuotaLimit,
  resolveQuotaRemaining
} from "@my-ai-orchestrator/payments";
import type { BillingEntitlement, BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { BackendAIPolicyServiceContract } from "../ai-policy/ai-policy-types.js";

export async function buildQuotaEntitlementView(
  entitlement: BillingEntitlement,
  billing: BillingServiceContract,
  aiPolicy: BackendAIPolicyServiceContract,
  planTier: string
) {
  const plan = billing.getPlan(entitlement.planId);
  const canonicalEnvelope = await aiPolicy.resolvePricingEnvelope({
    planTier,
    contentType: "validation-post",
    qualityMode: "balanced"
  });
  const canonical = canonicalEnvelope.canonicalCreditCost;
  const prices = await Promise.all(
    (["fast", "balanced", "strict"] as const).map(async (mode) => {
      const env = await aiPolicy.resolvePricingEnvelope({
        planTier,
        contentType: "validation-post",
        qualityMode: mode
      });
      return [mode, env.creditPrice] as const;
    })
  );

  return {
    quotaRemaining: resolveQuotaRemaining(entitlement.wallet.availableCredits, canonical),
    quotaLimit: resolveQuotaLimit(plan?.monthlyCredits ?? 0, canonical),
    quotaEquivalences: resolveQuotaEquivalences({
      monthlyCredits: plan?.monthlyCredits ?? 0,
      canonicalCreditCost: canonical,
      creditPricesByMode: Object.fromEntries(prices)
    })
  };
}
```

Wire into `billing-routes.ts` response (keep `availableCredits` for SDK).

- [ ] **Step 4: Run billing route tests**

Run: `rtk test vitest run tests/backend/billing-checkout.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/routes/billing-routes.ts apps/backend/src/product/billing/
git commit -m "feat(backend): add quota fields to billing entitlement endpoint"
```

---

### Task 7: Web i18n + Generation Screen quota UX

**Files:**
- Modify: `apps/web/src/i18n/app/messages/pt.ts`
- Modify: `apps/web/src/i18n/app/messages/en.ts`
- Modify: `apps/web/src/i18n/app/types.ts`
- Create: `apps/web/src/app/generation/components/QuotaUsageDetails.tsx`
- Modify: `apps/web/src/app/generation/components/GenerationPreviewSidebar.tsx`
- Modify: `apps/web/src/app/generation/hooks/useGenerationCommercialGate.ts`
- Modify: `apps/web/src/app/generation/screens/GenerationScreen.tsx`
- Create: `tests/web/generation-quota-i18n.test.ts`

- [ ] **Step 1: Write failing i18n test**

```typescript
import { describe, expect, it } from "vitest";
import { ptMessages } from "../../apps/web/src/i18n/app/messages/pt";

describe("generation quota i18n", () => {
  it("uses quota copy instead of credits in preview strings", () => {
    expect(ptMessages.generate.previewQuotaCost).toContain("{cost}");
    expect(ptMessages.generate.previewQuotaBalance).toContain("{remaining}");
    expect(ptMessages.generate.quotaUsageDetailsTitle).toBeTruthy();
    expect(ptMessages.generate.previewPrice).not.toContain("crédito");
  });
});
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Add i18n keys (pt + en)**

```typescript
// pt.ts — replace credit strings in generate section:
previewQuotaCost: "Usa ~{cost} geração(ões)",
previewQuotaBalance: "Restam {remaining} de {limit} este mês",
generateWithQuota: "Gerar texto",
noQuota: "Gerações esgotadas",
quotaUsageDetailsTitle: "Por que algumas gerações usam mais?",
quotaUsageDetailsBody: "...", // educational copy from spec — no numbers
quotaUsageDetailsToggle: "Ver detalhes",
```

Remove usage of `previewPrice`, `generateWithCredits`, `noCredits` from components (keep keys deprecated or delete if unused).

- [ ] **Step 4: Update GenerationPreviewSidebar**

```tsx
// Use commercialPreview.quotaCost / quotaRemaining / quotaLimit
// Remove creditPrice prop and credit display
// Add <QuotaUsageDetails messages={messages} /> collapsible
```

- [ ] **Step 5: Update useGenerationCommercialGate**

```typescript
const noQuota = (commercialPreview?.quotaRemaining ?? 0) < (commercialPreview?.quotaCost ?? 1);
// Remove creditPrice export; export quotaCost if needed for button state only
```

- [ ] **Step 6: Run web tests**

Run: `rtk test vitest run tests/web/generation-quota-i18n.test.ts tests/web/use-generation-commercial-gate.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/i18n/ apps/web/src/app/generation/ tests/web/
git commit -m "feat(web): generation screen quota UX with educational details"
```

---

### Task 8: Billing Screen quota UX

**Files:**
- Modify: `apps/web/src/app/billing/screens/BillingScreen.tsx`
- Modify: `packages/client-sdk/src/billing.ts` (if entitlement type needs update)
- Modify: `apps/web/src/i18n/app/messages/{pt,en}.ts`

- [ ] **Step 1: Update client SDK type to include quota fields**

- [ ] **Step 2: Replace credits display with progress bar**

```tsx
{entitlement ? (
  <Text variant="meta">
    {messages.billing.quotaProgress
      .replace("{used}", String(entitlement.quotaLimit - entitlement.quotaRemaining))
      .replace("{limit}", String(entitlement.quotaLimit))}
  </Text>
) : null}
```

- [ ] **Step 3: Add Criador checkout button** (`internalRef: "criador"`) alongside Pro.

- [ ] **Step 4: Update top-up copy** to "+10 gerações" when `topup_120` package lands in Task 9.

- [ ] **Step 5: Run web billing smoke**

Run: `rtk test vitest run tests/web/`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/billing/ packages/client-sdk/src/billing.ts
git commit -m "feat(web): billing screen quota progress and Criador plan"
```

---

### Task 9: Top-up packs + gateway catalog

**Files:**
- Modify: `apps/backend/src/product/billing/billing-bootstrap.ts`
- Modify: `apps/backend/src/infra/migrations/0012-billing-gateway.ts` (new migration `0013-billing-criador-topup.ts`)
- Modify: `tests/payments/gateway-webhook-dispatch.test.ts`

- [ ] **Step 1: Replace topup_500 with quota-based pack**

```typescript
// billing-bootstrap.ts
billing.registerTopUpPackage({
  id: "topup_10",
  credits: 120, // 10 quotas × canonical 12
  priceCents: 1900,
  currency: "BRL",
  description: "+10 gerações"
});
```

- [ ] **Step 2: Migration seeds criador + topup_10 catalog rows (BRL + USD)**

- [ ] **Step 3: Run gateway tests**

Run: `rtk test vitest run tests/payments/gateway-webhook-dispatch.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/product/billing/ apps/backend/src/infra/migrations/
git commit -m "feat(billing): criador catalog and quota-based top-up packs"
```

---

## Phase 3 — Ops (lightweight)

### Task 10: Margin report script

**Files:**
- Create: `scripts/report-pricing-margin.ts`
- Create: `tests/payments/pricing-margin-report.test.ts`

- [ ] **Step 1: Script aggregates job telemetry vs planned creditPrice; prints per-cell margin %**

- [ ] **Step 2: Test with fixture rows**

- [ ] **Step 3: Commit**

```bash
git add scripts/report-pricing-margin.ts tests/payments/pricing-margin-report.test.ts
git commit -m "chore(billing): add pricing margin report script"
```

---

## Final verification

- [ ] Run full CI test suite:

```bash
rtk test pnpm test:ci
```

Expected: all pass

- [ ] Manual smoke:

1. Free user sees ~8 gerações, fast only.
2. Preview shows quota cost/balance — no credits.
3. "Ver detalhes" shows educational copy only.
4. Pro user sees ~60 gerações equivalences on billing screen.
5. Strict + long-form-blog debits more quota than balanced + validation-post.

- [ ] Update spec status to `approved` and add progress-log entry.

---

## Self-review (spec coverage)

| Spec requirement | Task |
|------------------|------|
| Token-calibrated creditPrice per format×mode | Task 0, 2 |
| Realistic plan allowances | Task 3 |
| Quota presentation layer | Task 1, 4–6 |
| No internal credits in web UI | Task 7–8 |
| Educational "ver detalhes" | Task 7 |
| SDK retains credit fields | Task 4–5 |
| Remove Pro dailyCredits | Task 3 |
| Criador plan (starter tier) | Task 3, 8, 9 |
| Top-up in quota units | Task 9 |
| Margin 65–70% validation | Task 0, 10 |
| policyVersion migration | Task 2 |
| Enterprise deferred | Out of scope |

**Gaps:** Marketing pricing page and legal ToS copy — intentionally deferred.
