# Step planner COGS — pricing proposal (Track C)

**Source:** [step-planner-cogs-report.md](./step-planner-cogs-report.md) (2026-06-22, 17/18 HTTP runs, balanced only)  
**Gate:** Option A approved — 0% `planSignature` drift; repricing on dominant bucket  
**Target margin:** 67.5% (unchanged from hybrid pricing design)

## Method

```
revenueUsd     = observedUsdP50 / (1 - 0.675)
creditUsdValue = (short-piece short balanced revenue) / canonicalCreditCost
creditPrice    = ceil_1_decimal(revenueUsd / creditUsdValue)
```

- **Anchor:** `short-piece × short × balanced` = **$0.0726** p50 → **2.5 credits** (keeps current `canonicalCreditCost`)
- **creditUsdValue:** $0.089354 per internal credit
- **fast / strict:** extrapolated as **0.4×** and **4×** balanced (no balanced-mode samples for other modes yet)
- **Other length tiers:** scaled from observed tier using existing short-piece tier ratios (medium = 1.6× short, long = 2× short)

## Observed USD (balanced, VPS founder account)

| planSignature | Representative tier | Runs | p50 USD | p90 USD |
|---------------|---------------------|------|---------|---------|
| short-piece | short | 5 | 0.0726 | 0.0754 |
| serial-piece | medium | 3 | 0.0722 | 0.0724 |
| edition-piece | medium | 6 | 0.1080 | 0.1546 |
| long-piece | long | 3 | 0.1328 | 0.1359 |

**Outliers (do not price to p90):** `engage-audience` minimal with hook removed = $0.0476; `document-decision` heavy with structure = $0.1546 (still same bucket).

## Proposed `pricesByPlan` (balanced cells = calibrated)

Replace the `pricesByPlan` block in `apps/backend/policies/official/2026-05-16/pricing.json`:

```json
{
  "canonicalCreditCost": 2.5,
  "pricesByPlan": {
    "short-piece": {
      "short": { "fast": 1, "balanced": 2.5, "strict": 10 },
      "medium": { "fast": 1.6, "balanced": 4, "strict": 16 },
      "long": { "fast": 2, "balanced": 5, "strict": 20 }
    },
    "long-piece": {
      "short": { "fast": 1, "balanced": 2.3, "strict": 9.2 },
      "medium": { "fast": 1.5, "balanced": 3.7, "strict": 15 },
      "long": { "fast": 1.9, "balanced": 4.6, "strict": 18.5 }
    },
    "serial-piece": {
      "short": { "fast": 1, "balanced": 1.6, "strict": 6.5 },
      "medium": { "fast": 1, "balanced": 2.5, "strict": 10 },
      "long": { "fast": 1.3, "balanced": 3.2, "strict": 13 }
    },
    "edition-piece": {
      "short": { "fast": 1, "balanced": 2.5, "strict": 10 },
      "medium": { "fast": 1.6, "balanced": 3.8, "strict": 15.2 },
      "long": { "fast": 2, "balanced": 4.8, "strict": 19.2 }
    }
  }
}
```

### vs current grid (balanced only)

| Cell | Current | Proposed | Δ |
|------|---------|----------|---|
| short-piece / short | 2.5 | 2.5 | — |
| short-piece / medium | 4 | 4 | — |
| short-piece / long | 5 | 5 | — |
| serial-piece / medium | 3.5 | 2.5 | −29% |
| edition-piece / medium | 4 | 3.8 | −5% |
| long-piece / long | **8** | **4.6** | **−42%** |
| long-piece / medium | 6 | 3.7 | −38% |

**Takeaway:** compositor + step planner COGS is materially lower than the Phase 2 theoretical grid for `long-piece` and `serial-piece`. Keeping old prices would over-charge vs telemetry.

## Quota presentation (preview sidebar)

With `canonicalCreditCost = 2.5`:

| Generation (balanced) | creditPrice | quotaCost (`ceil`) |
|-----------------------|-------------|-------------------|
| short-piece / short | 2.5 | 1 |
| serial-piece / medium | 2.5 | 1 |
| edition-piece / medium | 3.8 | 2 |
| long-piece / long | 4.6 | 2 |
| engage-audience minimal (hook removed) | ~1.7 credits equiv. | 1 |

Copy stays honest: “~1 geração” for most shorts; long blog “~2 gerações”.

## Plan monthly credits (separate from `pricing.json`)

If `canonicalCreditCost` stays **2.5**, internal grants must shrink to preserve marketing quotas from [hybrid pricing design](../specs/2026-06-18-hybrid-pricing-design.md):

| Plan | Target quotas/mo | Proposed `monthlyCredits` | Old (canonical 12 mental model) |
|------|------------------|---------------------------|--------------------------------|
| Free | ~8 | **20** | 96 |
| Criador | ~25 | **63** | 300 |
| Pro | ~60 | **150** | 720 |

Formula: `monthlyCredits = targetQuotas × canonicalCreditCost`.

**Do not change grants until pricing grid is deployed** — otherwise quota copy and wallet burn rate diverge.

## Margin spot-check (Pro, all-balanced mix)

Assume Pro user burns **60 quotas/mo** as **short-piece / short / balanced** (1 quota = 2.5 credits):

- COGS: 60 × $0.0726 = **$4.36/mo**
- Revenue (indicative $59/mo): margin **~92%** on this mix

Worst-case cell in sample (edition-piece / medium / balanced, 2 quotas each):

- COGS per gen: $0.108 → priced at 3.8 credits → still within 67.5% target at implied credit value.

## Rollout checklist

1. [ ] Apply `pricesByPlan` + keep `canonicalCreditCost: 2.5` in `pricing.json`
2. [ ] Bump `policyVersion` if required by governance (>15% change on long-piece — **yes**, new version recommended: `2026-06-22`)
3. [ ] Update billing plan definitions (`monthlyCredits`) to match quota targets — **done** for free/pro/criador in `default-plans.ts`
4. [ ] Re-run one preview + execute smoke after deploy
5. [ ] Commit this report + `step-planner-cogs-report.md` as sign-off artifacts
6. [ ] Optional: rerun failed fixture `share-idea / heavy` (Gemini 503) for 18/18 completeness

## Deferred

- **fast / strict** recalibration from telemetry (needs mode sweep)
- **Option B** surcharge on `edition-piece` p90 (only if post-launch telemetry shows sustained >30% spread)
- Legacy `pricing[]` rows (`validation-post`, etc.) — keep until legacy path removed
