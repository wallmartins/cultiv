---
title: Plan Tier Quality Modes and Default Free Subscription
doc_type: adr
status: accepted
last_updated: 2026-06-12
---

# Plan tier gates quality modes, not content types; every user has a free subscription

Commercial limits were incorrectly applied to **Content Types** in the product catalog: availability used `canRefine`, which represents **language refinement** entitlement, not format access. **End Users** on the free plan saw formats blocked even when they had an active subscription and credits. At the same time, **Quality Modes** (`fast`, `balanced`, `strict`) were not gated by plan tier—only by credit balance—so a free-tier user could request **strict** if they had enough credits.

We decided that:

1. **Every authenticated Application User** has at least one **Billing Subscription** on the `free` plan, provisioned just-in-time with user creation (or first authenticated request). There is no long-lived user without a subscription record.
2. **Subscription status** may be `active` or, in exceptional cases, inactive (`past_due`, `canceled`, etc.). The normal case is `active` on `free`.
3. **Zero credits** is a valid state: the user remains subscribed but cannot start a **Generation Request** until credits are available.
4. **All catalog Content Types** remain visible and selectable for subscribed users. Commercial differentiation is **not** per format.
5. **Quality Mode** access is determined by **plan tier**, not content type:
   - `free` → `fast` only
   - `starter` → `fast`, `balanced`
   - `pro`, `enterprise` → `fast`, `balanced`, `strict`
6. **Credit pricing** per `qualityMode × contentType` stays uniform across tiers (existing AI policy pricing rows); tiers differ by **monthly credits** and **allowed modes**, not by per-generation price.
7. **`canRefine`** continues to mean **language refinement** in the execution pipeline only. It must not gate the content-type catalog.

## Considered options

1. **Gate formats by plan** (status quo, corrected labels) — Rejected. Product intent is that format choice is creative, not commercial; plans differentiate depth of execution (quality mode) and credit allowance.
2. **Gate modes via feature flags** — Rejected for permanent entitlements. Feature flags remain for rollout; plan tier ladder belongs in `packages/payments`.
3. **Gate modes in `pricing.json`** — Rejected. AI policy pricing answers *how much*; payments answers *whether the tier may use the mode*.
4. **Tier ladder in payments + JIT free subscription** — Accepted. Matches `billing-model-policy.md` ownership and ADR 0013 JIT provisioning pattern.

## Consequences

- `packages/payments` owns `resolveAllowedQualityModes(tier)` and subscription bootstrap helpers; entitlements distinguish **active subscription**, **allowed quality modes**, and **spendable credits**.
- JIT **Application User** provisioning triggers `ensureDefaultFreeSubscription(userId)` (or equivalent) in the auth path.
- `apps/backend` product layer (`generation-preview`, `public-generation`, `content-type-catalog`) consumes entitlements; formats are available when subscription is active; modes are filtered by tier and credits.
- `apps/web` **Generation Screen** disables unavailable **Quality Mode Presentation** options using preview `qualityModes[].allowed` and updated `blockedReason` copy.
- Existing plans and credit amounts (`free`: 50, `pro`: 2500) are unchanged in this decision.
- New `blockedReason` values may be introduced (`quality_mode_plan_restriction`, `subscription_inactive`) for clearer **End User** messaging.
- `docs/live/plan/decisions.md` and **Generation Screen** specs must be updated to reflect “all formats visible; modes gated by plan”.
