---
title: Hybrid Pricing — Token-Calibrated Credits with Quota Presentation
doc_type: design
status: approved
domain: billing
last_updated: 2026-06-18
---

# Hybrid Pricing — Token-Calibrated Credits with Quota Presentation

## Summary

Redesign Cultiv's commercial usage model to protect a **65–70% gross margin** while presenting a **simple, quota-based experience** to end users.

- **Internal layer:** credit-based billing (existing `packages/payments` engine) with `creditPrice` calibrated from real token costs per `contentType × qualityMode`.
- **External layer:** quota presentation ("~25 gerações este mês") derived from internal credits via a canonical unit — never expose internal credit math in the product UI.
- **Plan ladder:** Free → **Criador** (new) → Pro for B2C; Enterprise (sales-led) for agencies and teams.
- **Markets:** BRL and USD from day one — same quota structure, market-adjusted plan prices.

## Problem

The current model has two structural issues:

1. **Unrealistic allowances** — Pro grants 2,500 credits/month. At 10 credits per strict generation, that is 250 strict runs/month, far beyond realistic solo or professional usage.
2. **Broken unit economics** — credit prices are uniform across formats (1 / 2.5 / 10) and disconnected from actual token costs. At a hypothetical R$ 97/month Pro price, one strict generation would yield ~R$ 0.39 in revenue against ~R$ 1.77 in estimated COGS — a loss on every run.

The product needs pricing that:

- Reflects real pipeline cost (steps, models, parallel candidates, retries per quality mode).
- Differentiates by content format without exposing internal math to users.
- Allows silent internal recalibration when provider token prices change.
- Serves mixed audiences (solo creator → professional → agency) with clear upgrade paths.

## Goals

1. Calibrate `creditPrice` per `contentType × qualityMode` from production telemetry (14 real generations today; continuous recalibration as volume grows).
2. Replace inflated plan allowances with realistic monthly internal credit grants.
3. Present usage as **quotas** ("gerações") in UI and marketing — not internal credits.
4. Maintain the existing billing engine (`reserve → capture → release`, ledger, `policyVersion`).
5. Protect margin at 65–70% across all format/mode combinations.
6. Avoid exposing internal credit/token calculations in the Generation Screen to reduce legal and trust risk.

## Non-Goals (this initiative)

- Enterprise workspace / seats implementation (plan structure only; features deferred).
- Changing quality-mode tier gating philosophy (formats stay open; modes gated by tier — ADR 0002).
- Usage-based partial refunds when a generation exits early.
- Replacing the credit ledger with a new billing primitive.
- NF-e, tax, or payment-gateway changes (see payment-gateway design spec).

## Context

| Area | Current state |
|------|---------------|
| Plans | `free` (50 credits/mo), `pro` (2500 credits/mo + 300 daily) |
| Credit prices | Uniform per mode across all formats: fast=1, balanced=2.5, strict=10 (+ retry surcharge) |
| Pricing source | `apps/backend/policies/official/*/pricing.json` |
| Billing engine | `packages/payments` — wallet, ledger, reserve/capture/release |
| Telemetry | `inputTokensTotal`, `outputTokensTotal`, `estimatedUsdCost`, `debitedCredits` per execution |
| Production data | 14 real generations (founder testing; no external users yet) |
| Tier gating | free→fast; starter→fast+balanced; pro/enterprise→all modes |
| Markets | BRL (Asaas) + USD (Stripe) planned |

## Decision

### Selected: Hybrid model (internal credits + external quotas)

| Layer | What the user sees | What the system uses |
|-------|-------------------|---------------------|
| Marketing / pricing page | "~25 gerações/mês" | `monthlyCredits / canonicalCreditCost` |
| Generation Screen | "Usa ~1 geração · Restam 23 de 25" | `creditPrice / canonicalCreditCost` |
| Billing Screen | Progress bar + mode equivalences | Internal wallet balance |
| Billing engine | *(hidden)* | `creditPrice`, `availableCredits`, ledger |
| Ops / calibration | Cost vs margin dashboards | Token telemetry, `policyVersion` |

### Rejected alternatives

| Alternative | Why rejected |
|-------------|--------------|
| **Transparent credits only** | Users can compute R$/generation; repricing visible; legal exposure when internal rates change |
| **Opaque quotas only (no credits)** | Requires replacing the working billing engine; top-ups and audit trail harder |
| **Format gating by plan** | Conflicts with ADR 0002 product intent; formats are creative choice, not commercial lever |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  apps/web — Generation Screen, Billing Screen, Marketing │
│  Quota copy only; no internal credits                    │
└──────────────────────┬──────────────────────────────────┘
                       │ QuotaPresentationLayer
                       │ (packages/payments or contracts)
┌──────────────────────▼──────────────────────────────────┐
│  packages/payments — UNCHANGED STRUCTURE                 │
│  wallet · ledger · reserve → capture → release           │
│  policyVersion on plans and pricing                      │
└──────────────────────┬──────────────────────────────────┘
                       │ creditPrice(contentType, qualityMode)
┌──────────────────────▼──────────────────────────────────┐
│  Cost calibration                                        │
│  telemetry → USD cost → creditPrice in pricing.json      │
│  canonicalCreditCost anchor per policyVersion            │
└─────────────────────────────────────────────────────────┘
```

### Canonical unit

**1 quota** ("1 geração") = internal credit cost of one `balanced` generation on `validation-post`.

```
quotaRemaining = floor(availableCredits / canonicalCreditCost, 1)
quotaCost      = ceil(creditPrice / canonicalCreditCost, 1)   // display rounding
```

`canonicalCreditCost` is stored in `pricing.json` root per `policyVersion`. All quota copy derives from it.

### QuotaPresentationLayer responsibilities

- Convert `availableCredits` → `quotaRemaining` / `quotaLimit`.
- Convert `creditPrice` → `quotaCost` for preview.
- Produce per-mode equivalence strings for Billing ("~25 equilibradas, ~8 afinadas, ~60 rápidas").
- **Never** expose `creditPrice`, `canonicalCreditCost`, `creditUsdValue`, or `policyVersion` to web clients.

## Cost Calibration

### Data sources

1. **Production telemetry** — aggregate `observedUsdCost`, token totals, and `debitedCredits` from completed executions, grouped by `(contentType, qualityMode)`.
2. **Theoretical model** — for cells with insufficient data, estimate from pipeline config:
   - LLM step count per `contentType` (`catalog.json` pipelines).
   - Routing profile per step (`default-llm`, `premium-llm`, `linkedin-llm`).
   - Quality-mode multipliers: parallel candidates (fast=1, balanced=2, strict=3) and max retries.
3. **Provider price table** — versioned `input_price_usd` / `output_price_usd` per model (ops config, not user-facing).

### Formula

```
cost_usd     = Σ (input_tokens × input_price + output_tokens × output_price) per LLM call
revenue_usd  = cost_usd / (1 - target_margin)          // target_margin = 0.675
creditPrice  = ceil(revenue_usd / creditUsdValue, rounding)
```

- **`creditUsdValue`** — fixed monetary anchor per `policyVersion` (e.g. one internal credit = $0.01 COGS equivalent). Chosen at calibration time; not exposed to users.
- **Percentiles:** use **p50** for commercial `creditPrice`; monitor **p90** for margin alerts.

### Format differentiation

`creditPrice` MUST vary by `contentType`, not only `qualityMode`. Pipeline complexity differs materially:

| Content type | LLM steps | Routing profile | Expected relative cost |
|--------------|-----------|-----------------|------------------------|
| `twitter-thread` | 3 | default-llm | Low |
| `linkedin-post` | 4 | linkedin-llm | Medium-low |
| `validation-post` | 2 | default-llm | Medium (canonical) |
| `newsletter` | 4 | default-llm | Medium-high |
| `long-form-blog` | 2 | premium-llm | High |
| `architecture-post` | 3 | premium-llm | High |

Illustrative internal credit prices (to be replaced by calibration from 14 production runs):

| Content type | fast | balanced | strict |
|--------------|------|----------|--------|
| twitter-thread | 2 | 6 | 24 |
| linkedin-post | 3 | 10 | 40 |
| validation-post | 3 | 12 | 48 |
| newsletter | 4 | 14 | 56 |
| long-form-blog | 8 | 30 | 120 |
| architecture-post | 8 | 32 | 130 |

With `canonicalCreditCost = 12` (balanced × validation-post), one quota ≈ 12 internal credits.

### Recalibration policy

| Trigger | Action |
|---------|--------|
| ≥50 executions in a `(contentType, qualityMode)` cell | Recompute p50/p90 from telemetry |
| Any cell `creditPrice` changes >15% | New `policyVersion`; new `pricing.json` |
| In-flight executions | Stay on policy active at start (existing rule) |
| Provider token price change | Update ops price table; recalibrate; **do not** change user-facing quota limits |

### Phase 0 deliverable

Before changing product allowances, run a calibration script against the 14 production generations plus theoretical fill-ins. Output:

- Observed vs planned cost per cell.
- Proposed `creditPrice` table.
- Margin simulation per plan tier at p50 and p90 usage mixes.
- Recommended `canonicalCreditCost` and plan `monthlyCredits`.

## Plan Structure

### B2C (self-serve)

| Plan | Audience | Quality modes | Internal credits/mo | Quota presentation | USD (indicative) | BRL (indicative) |
|------|----------|---------------|---------------------|--------------------|------------------|------------------|
| **Free** | Trial | fast | ~96 | ~8 gerações | $0 | R$ 0 |
| **Criador** | Solo, 2–4 pieces/week | fast, balanced | ~300 | ~25 gerações | $19–29 | R$ 49–79 |
| **Pro** | Professional, 8–15/week | all | ~720 | ~60 gerações | $49–79 | R$ 97–149 |

Notes:

- Quota numbers assume balanced × validation-post as the reference. UI shows equivalences for other modes.
- **Remove `dailyCredits: 300` from Pro** — incoherent with monthly quota model. Abuse protection stays in rate limits (RPM, concurrency) per existing quality-billing policy.
- **Rollover:** keep 25% with cap, expressed in quotas ("até N gerações levam para o próximo mês").
- **Top-up:** sold as quota packs ("+10 gerações"), mapped internally to credits at checkout.

Final prices and exact credit grants are set after Phase 0 margin simulation.

### B2B (sales-led)

| Plan | Audience | Notes |
|------|----------|-------|
| **Enterprise** | Agencies, small teams | Custom `monthlyCredits`, seats, shared pool; not on public pricing page |

Uses the same credit engine. Differentiation via volume, seats, and collaboration features (implementation deferred). Activation via sales contact, not self-serve checkout.

### Tier gating (unchanged)

```
free       → fast
criador    → fast, balanced     // tier id TBD: may map to starter tier
pro        → fast, balanced, strict
enterprise → all
```

All content types remain available on all active tiers (ADR 0002).

## User Experience

### Generation Screen

**Always visible:**

- Quota cost estimate: "Usa ~1 geração"
- Quota balance: "Restam 23 de 25 este mês"
- Blocked state: "Gerações esgotadas" with upgrade/top-up CTA

**Never visible:**

- Internal credits, `creditPrice`, decimals tied to internal math
- Token counts, model names, USD cost
- `policyVersion` or calibration metadata

### "Ver detalhes" (optional, educational only)

Expandable section with simplified copy — **no numbers that could be used as a price schedule**:

> **Por que algumas gerações usam mais?**
>
> Cada peça passa por etapas diferentes conforme o **formato** (um tweet é mais curto que um artigo) e o **modo** escolhido.
>
> - **Direto** — menos refinamento, usa menos da sua cota
> - **Equilibrado** — revisão intermediária; referência de "1 geração"
> - **Afinado** — mais etapas de qualidade e revisão, usa mais da sua cota
>
> Formatos com mais conteúdo (blog, newsletter) naturalmente consomem mais do que formatos curtos (LinkedIn, thread).
>
> Mostramos uma estimativa antes de você gerar.

### Billing Screen

- Progress: `18 / 25 gerações` this cycle
- Mode equivalences: "No seu plano: ~25 equilibradas, ~8 afinadas, ~60 rápidas" (computed from internal credits; rounded for display)
- Top-up: "+10 gerações" packs

### Marketing / pricing page

- Compare plans in **gerações**, not credits
- Footnote: *"Geração = peça em modo equilibrado, formato médio. Modos e formatos consomem quantidades diferentes."*
- BRL and USD: same quota allowances; prices adjusted per market
- Enterprise: "Fale conosco"

### Legal / trust guardrails

Terms of use should state:

1. Plan quotas are **usage estimates**, not fixed per-generation prices.
2. Monthly quota allowance is defined by the **plan**, not by an exposed conversion rate.
3. Internal calibration may change without user-visible quota limit changes.
4. Changes that **do** require notice: plan price, monthly quota volume, feature set.

**Rationale:** exposing internal credit prices creates auditable evidence if calibration changes. Users could claim undisclosed repricing. Quota presentation avoids this by keeping the commercial promise at the plan level ("25 gerações/mês").

## API and Contracts

### Existing fields (retained)

- `creditPrice`, `currentBalance` in Generation Preview — for SDK/advanced integrations
- `monthlyCreditsRemaining` on entitlement — internal; web maps to quota

### New optional fields

```typescript
// Entitlement / preview extensions
quotaRemaining: number
quotaLimit: number
quotaCost: number              // for current preview selection
quotaEquivalences?: {          // billing surface
  fast: number
  balanced: number
  strict: number
}
```

Web client consumes quota fields only. SDK may expose both layers.

## Runtime Flow

```
1. User selects contentType + qualityMode
2. resolvePricingEnvelope() → creditPrice (internal)
3. QuotaPresentationLayer → quotaCost, quotaRemaining
4. reserve(creditPrice)
5. Execute pipeline; collect telemetry
6. capture(creditPrice)          // fixed; no partial refund
7. Record observedUsdCost vs plannedCreditPrice for calibration
```

Retry surcharge remains in internal credits; UI may show "pode usar até +1 geração" without exposing surcharge math.

## Error Handling

| Scenario | User-facing | System |
|----------|-------------|--------|
| Insufficient credits | "Gerações esgotadas" + top-up/upgrade | `BillingInsufficientCreditsError` |
| Disallowed quality mode | Mode disabled + plan explanation | `quality_mode_plan_restriction` |
| Inactive subscription | Billing inactive message | `subscription_inactive` |
| Actual cost > p90 estimate | No user impact | Ops alert if cell margin <50% |
| Policy version missing | Generic error | `BackendAIPolicyPricingError` |

## Testing

| Area | Scenarios |
|------|-----------|
| Calibration script | 14 production runs produce valid table; theoretical fill for empty cells |
| QuotaPresentationLayer | Converts credits ↔ quotas; rounds display consistently |
| Margin simulation | Each plan tier at p50/p90 mix stays ≥65% gross |
| Generation preview | Returns quota fields; no credit fields required by web |
| Billing | Reserve/capture unchanged; quota balance decreases correctly |
| Plan migration | New signups get new allowances; legacy policyVersion honored for in-flight |
| i18n | Quota copy in pt/en; educational "ver detalhes" text |

## Implementation Phases

### Phase 0 — Calibration (no product change)

- Script: ingest production telemetry + theoretical model
- Output: proposed `pricing.json`, plan credit grants, margin report
- Review and approve numbers before Phase 1

### Phase 1 — Internal repricing

- New `pricing.json` with per-format `creditPrice`, `canonicalCreditCost`, `creditUsdValue`
- Update `default-plans.ts`: Free, Criador, Pro allowances; remove Pro `dailyCredits`
- New `policyVersion`; retire old Pro 2500 plan for new signups
- Tests: pricing resolution, margin bounds

### Phase 2 — Quota presentation layer

- `QuotaPresentationLayer` in `packages/payments` (or shared contracts helper)
- Extend entitlement + generation preview contracts
- Generation Screen + Billing Screen quota UX
- Educational "ver detalhes" (no internal numbers)

### Phase 3 — Ops and continuous calibration

- Internal dashboard: cost vs debited vs margin by cell
- Automated recalibration job (threshold: 50 executions per cell)

### Phase 4 — Enterprise (later)

- Seats, shared pool, sales-led catalog entries

## Related Documents

- [quality-billing-policy.md](../../archive/policies/quality-billing-policy.md) — token cost formula, retry rules, telemetry fields
- [billing-model-policy.md](../../archive/policies/billing-model-policy.md) — credit flow, policyVersion rules
- [ADR 0002](../../adr/0002-plan-tier-quality-modes-and-default-free-subscription.md) — tier gates modes, not formats
- [2026-06-17-payment-gateway-design.md](./2026-06-17-payment-gateway-design.md) — checkout and webhooks

## Open Items (resolve in Phase 0)

1. Exact `creditPrice` table from 14 production generations.
2. Final BRL/USD plan prices after margin simulation.
3. Whether **Criador** maps to existing `starter` tier id or new plan id.
4. Top-up pack sizes and prices in quota units.
