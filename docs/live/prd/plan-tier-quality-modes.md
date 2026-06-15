---
title: PRD - Plan Tier Quality Modes and Default Free Subscription
doc_type: prd
status: ready-for-agent
domain: billing
last_updated: 2026-06-12
---

# PRD: Plan tier quality modes and default free subscription

## Problem Statement

**End Users** in the **Authenticated Workspace** experience commercial limits that do not match product intent. **Content Types** (blog, LinkedIn, thread, etc.) appear blocked on the free plan because the backend reused `canRefine` (language refinement) as a catalog gate. Meanwhile, **Quality Modes** are not restricted by plan tier—only by whether the wallet has enough credits—so a free-tier user could still request **strict** if they had balance.

Separately, billing assumes an entitlement exists only when a subscription was manually seeded. New **Application Users** provisioned via JIT auth may have **no subscription record**, which surfaces as “plan restriction” in the UI instead of a coherent free-tier experience.

The product model should be: every user is on a subscription (minimum **free**), all formats are available, plan tier controls which **Quality Modes** can run, and credits control whether a generation can start right now.

## Solution

Realign commercial gating across payments, backend product surfaces, and the **Generation Screen**:

1. Provision a default **`free` subscription** for every **Application User** at JIT creation (or first authenticated touchpoint).
2. Keep existing plans and monthly credit amounts unchanged (`free`: 50, `pro`: 2500).
3. Expose all **Content Types** for users with an **active subscription**; remove format blocking by plan tier.
4. Enforce **Quality Mode** allowlists by **plan tier** (`free` → fast only; `starter` → fast + balanced; `pro` / `enterprise` → all).
5. Keep per-generation **credit pricing** the same across tiers (existing AI policy envelopes).
6. Return clear `blockedReason` values from **Generation Preview** and enforce the same rules on **Generation Request** execution.
7. Update the web **Generation Screen** to disable unavailable modes (not formats) with localized explanations.

## User Stories

### Subscription baseline

1. As an **End User**, I always have a subscription record after my first login, so that the product never treats me as “without a plan.”

2. As an **End User** on the **free** plan, I start with an **active** subscription, so that I can use the workspace immediately.

3. As an **End User** whose subscription became inactive, I still see my account state clearly, so that I know I must resolve billing before generating.

4. As an **End User** with zero credits, I remain subscribed, so that the UI explains insufficient credits rather than “format not in plan.”

### Content types (formats)

5. As an **End User**, I want to see and select every catalog **Content Type**, so that my creative choice is not limited by plan.

6. As an **End User** on any active plan, I want all formats enabled in the selector, so that I am not misled into thinking LinkedIn or newsletter requires an upgrade.

7. As an **End User**, I want briefing fields and guidance for any format I pick, so that the compose experience is complete regardless of tier.

### Quality modes (execution depth)

8. As an **End User** on **free**, I want only **Direto** (`fast`) available, so that deeper modes are a clear upgrade path.

9. As an **End User** on **starter**, I want **Direto** and **Equilibrado** (`fast`, `balanced`), so that I get more depth without full **Afinado**.

10. As an **End User** on **pro** or **enterprise**, I want all three modes, so that I can choose maximum refinement when needed.

11. As an **End User**, I want unavailable modes shown but disabled with a reason, so that I understand what upgrading unlocks.

12. As an **End User**, I want the recommended mode in **Generation Preview** to respect my plan allowlist, so that I am not nudged toward a mode I cannot run.

13. As an **End User**, I want the generate action blocked if I select a disallowed mode (or if the API rejects it), so that I cannot waste time on a request that will fail.

### Credits and pricing

14. As an **End User**, I want credit price per generation to depend on **Quality Mode** and **Content Type** but not on plan tier, so that pricing feels fair and predictable.

15. As an **End User** without enough credits, I want generate disabled with an insufficient-credits message, so that I know the blocker is balance—not format.

16. As an **End User**, I want **Generation Preview** to show price and projected balance using the same rules as execution, so that quotes stay trustworthy.

### API and SDK consistency

17. As a **Client Integration Surface** consumer, I want `contentTypes.list` to mark formats available for active subscribers, so that UI logic is simple.

18. As a **Client Integration Surface** consumer, I want `generationPreview` to return per-mode `allowed` and `blockedReason`, so that the **Generation Screen** can render plan-aware controls without duplicating business rules.

19. As the backend, I want **Generation Request** authorization to match preview rules, so that clients cannot bypass mode gating.

### Operations and language refinement

20. As the platform, I want `canRefine` to continue gating **language refinement** in execution only, so that refinement policy stays independent from catalog availability.

21. As an operator, I want inactive subscriptions to fail closed on generation, so that billing state is enforced server-side.

## Implementation Decisions

### Modules to build or modify

| Module | Responsibility |
|--------|----------------|
| `packages/payments` | Default free subscription bootstrap; `resolveAllowedQualityModes(tier)`; `canUseQualityMode(entitlement, mode)`; clarify entitlement fields (active subscription vs spendable credits) |
| Auth JIT path (`public-auth` / application user service) | Call subscription bootstrap after user create |
| `content-type-catalog` (backend product) | `available` when subscription active; never use `canRefine` for formats |
| `generation-preview` (backend product) | Mode `allowed` = tier allowlist ∧ active subscription ∧ sufficient credits |
| `public-generation` (backend product) | Enforce mode tier on execute; remove format gate via `canRefine` |
| `apps/web` Generation Screen | Disable mode radios from preview; auto-fallback to highest allowed mode; update blocked-reason i18n |
| Contracts / error mappers | Optional new `blockedReason` literals for mode and subscription state |

### Tier ladder (unchanged plan IDs, tier-driven modes)

```
free      → fast
starter   → fast, balanced
pro       → fast, balanced, strict
enterprise → fast, balanced, strict
```

Registered plans today: `free` (tier `free`), `pro` (tier `pro`). The `starter` and `enterprise` tiers exist in types and pricing policy for forward compatibility.

### Subscription bootstrap

On JIT **Application User** create:

- Upsert subscription: `planId: "free"`, `status: "active"` (unless migrating existing state).
- Start billing cycle if the payments service requires it for wallet initialization.

`getEntitlement(userId)` should resolve the user's subscription without requiring dev-only seed config.

### Entitlement semantics

Split concerns currently folded into `canGenerate`:

- **Has active subscription** — `status === "active"`.
- **Can spend credits** — `availableCredits >= creditPrice` for the quoted generation.
- **Can use quality mode** — tier allowlist.

`canGenerate` may remain as a convenience boolean for “can start a quoted run now” (= active ∧ credits ∧ mode allowed) or be decomposed in the entitlement view; implementers should not overload it with format access.

### Pricing

No change to `pricing.json` price values. All tiers keep identical credit prices per `contentType × qualityMode`.

### Content catalog API

`ContentTypeCatalogItemView.available` means “selectable for briefing” (active subscription), not “included in plan tier.” `reasonCode` when unavailable should reflect subscription state, not format tier.

## Testing Decisions

Test **external behavior** only: API responses and entitlement outcomes, not private helpers.

| Area | Prior art |
|------|-----------|
| Payments entitlements | `tests/payments/payments-package.test.ts` |
| Generation preview | `tests/backend/backend-generation-preview.test.ts` |
| Content types API | `tests/backend/backend-app-content-types.test.ts` |
| Web i18n / generate | `tests/web/generate-i18n.test.ts` |

Required scenarios:

- New JIT user receives free subscription and entitlement with tier `free`.
- Free tier: all content types `available`; preview allows only `fast`; `balanced`/`strict` blocked with plan/mode reason.
- Pro tier: all modes allowed when credits suffice; blocked only on insufficient credits.
- Zero credits: formats still available; generate/preview blocked with `insufficient_credits`.
- Inactive subscription: formats may remain visible; generation blocked with subscription reason.
- Execution rejects disallowed mode even if client sends it directly.

## Out of Scope

- New plan SKUs, checkout, or **Billing Surface** UI (`/app/billing`).
- Changing monthly credit amounts or introducing `plus` / `ultimate` plan names.
- Per-tier credit **pricing** differences.
- Marketing pricing page updates.
- Persisting billing plans to PostgreSQL (remain in-memory seed unless a separate initiative lands).
- Gating **Voice Dashboard**, **Execution History**, or onboarding by plan.

## Further Notes

- ADR: [`0002-plan-tier-quality-modes-and-default-free-subscription.md`](../../adr/0002-plan-tier-quality-modes-and-default-free-subscription.md)
- Supersedes the Web v2 decision row “Content types blocked with reason” when the reason was plan/format tier.
- `content.language.refinement` feature flag and `canRefine` stay for pipeline language refinement (ADR unchanged).
