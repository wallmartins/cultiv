---
title: Cultiv Launch — Marketing Surface Conversion Redesign
doc_type: design
status: approved
domain: marketing-surface
last_updated: 2026-06-26
supersedes_prd: docs/live/prd/cultiv-marketing-surface-phase-1.md
brainstorming_approach: Single landing with auth intent routing
---

# Cultiv Launch — Marketing Surface Conversion Redesign

## Summary

Transform the Cultiv **Marketing Surface** from a pre-launch **Waitlist** funnel into the **product entry point** for public launch. Visitors understand the product, see real plan prices, sign up for the Free tier, or subscribe to Criador/Pro — all while the **Authenticated Workspace** (`/app/*`) remains unchanged in scope except for auth routing and checkout handoff.

**Identity:** Cultiv Cartography (unchanged).

**Locales:** Portuguese at `/`, English at `/en` (existing **Marketing Locale** model).

**Waitlist:** removed entirely (UI, server route, Loops integration). Existing waitlist contacts receive a one-time manual launch email outside the product.

---

## Problem

Phase 1 marketing validated demand with a **Product Showcase** + **Waitlist**. The authenticated product is now ready for first real users: Auth0, generation, voice teaching, billing checkout (Stripe + Asaas), and plan tiers (Explorador / Criador / Pro).

The current landing still:

- Routes every CTA to `#waitlist`
- Uses pre-launch copy ("acesso antecipado", "entrar na lista")
- Shows plan cards with "Valor: em definição"
- Captures email via Loops without creating an **Application User**

Without this redesign, launch traffic cannot convert into product usage or paid subscriptions from the primary entry point.

---

## Goals

1. `/` and `/en` become the **launch conversion surface** — not a waitlist capture page.
2. **Free path:** visitor creates account → JIT provisioning → onboarding (if new) → **Generation Screen**.
3. **Paid path:** visitor selects plan → login/signup → JIT Free account → **auto-checkout** for chosen plan → payment → onboarding → platform with active subscription.
4. **Real prices** on marketing plan cards (BRL/USD, monthly/annual toggle).
5. **Narrative restructure** — section order and copy reflect a live product, not a future launch.
6. **Complete waitlist removal** — no dead code, env vars, or Loops dependency.
7. Preserve bilingual SEO, Cartography visual system, blog integration, and governance (no direct Public API `fetch` from marketing components).

---

## Non-Goals (this initiative)

- Authenticated workspace feature work beyond auth routing, checkout handoff, and success URL.
- Public `GET /api/public/plans` API (deferred; manifest is sufficient for launch).
- Customer self-service portal (cancellation, payment method update).
- NF-e automation.
- Marketing dark mode.
- In-app feedback collection tooling (separate initiative).
- Automated email to legacy waitlist contacts (manual Loops send, ops).

---

## Decisions (brainstorming)

| Topic | Decision |
|-------|----------|
| Conversion architecture | Single landing (`/`, `/en`) with **auth intent routing** via query params |
| Paid flow onboarding | **Pay first** — checkout intent bypasses onboarding gate; onboarding runs after successful payment |
| Free flow onboarding | Standard gate — new users enter onboarding before **Generation Screen** |
| Pricing on landing | Real subscription prices visible; default currency by locale (`pt` → BRL, `en` → USD); visitor can toggle |
| Billing period on landing | Monthly / annual toggle on plan section |
| Scope | Narrative restructure + conversion wiring; Cartography identity retained |
| Waitlist | Full removal (UI + API + Loops); manual email to existing list |
| Price data source | **Marketing plan manifest** shared with `DEFAULT_BILLING_PLANS` quotas; subscription display amounts maintained in one manifest file |
| Post-checkout success URL | `/app/onboarding?from=checkout` (configurable via `BILLING_CHECKOUT_SUCCESS_URL`) |
| Logged-in visitor on marketing | Header shows **"Ir para o app"**; plan CTAs skip `/login` |

### Rejected alternatives

| Alternative | Why rejected |
|-------------|--------------|
| Dedicated `/pricing` route | Extra navigation friction; splits SEO; unnecessary for launch scope |
| Public billing catalog API | Larger backend scope; manifest sufficient until prices change frequently |
| Onboarding before paid checkout | Conflicts with chosen UX; adds drop-off between plan selection and payment |

---

## Conversion Architecture

### Auth intent model

Introduce `marketing-auth-intent` module in `apps/web/src/marketing/auth/`:

```typescript
type MarketingPlanIntent = "free" | "criador" | "pro";

type MarketingAuthIntent = {
  readonly plan: MarketingPlanIntent;
  readonly currency: "BRL" | "USD";
  readonly period: "monthly" | "annual";
};

// Builds login URL or direct app URL when session exists
function buildMarketingConversionUrl(
  intent: MarketingAuthIntent,
  options: { readonly isAuthenticated: boolean }
): string;
```

**Return-to paths:**

| Intent | `returnTo` (unauthenticated) | Direct (authenticated) |
|--------|------------------------------|-------------------------|
| `free` | `/app/generate` | `/app/generate` (or onboarding if gated) |
| `criador` | `/app/plans?checkout=criador&currency={c}&period={p}` | same |
| `pro` | `/app/plans?checkout=pro&currency={c}&period={p}` | same |

Unauthenticated paid intents route through `/login?returnTo={encoded}`.

### Free flow

```
Marketing CTA "Começar grátis"
  → /login?returnTo=/app/generate
  → Auth0 Universal Login (signup or sign-in)
  → /callback
  → JIT: Application User + ensureDefaultFreeSubscription
  → resolvePostLoginNavigation → onboarding (if new) → /app/generate
```

### Paid flow

```
Marketing plan CTA "Assinar Criador/Pro"
  → /login?returnTo=/app/plans?checkout=criador&currency=BRL&period=monthly
  → Auth0 signup/login
  → JIT: Application User + Free subscription (temporary until webhook upgrades)
  → resolvePostLoginNavigation (checkout bypass — see below)
  → PlansScreen auto-starts createCheckout on mount
  → Hosted checkout (Asaas BRL / Stripe USD)
  → Webhook activates paid entitlement
  → successUrl → /app/onboarding?from=checkout
  → onboarding → /app/generate
```

### Post-login routing change

Extend `resolvePostLoginPath` in `apps/web/src/app/auth/lib/post-login-redirect.ts`:

- If `intendedPath` matches `/app/plans` with `checkout` search param → **return intended path as-is**, even when `shouldEnterOnboarding` is true.
- Otherwise existing rules apply.

`/login` must accept `returnTo` query param instead of hardcoding `/app/generate`.

### PlansScreen auto-checkout

Extend `/app/plans` route search validation:

```typescript
type PlansSearch = {
  readonly status?: "success" | "cancel";
  readonly checkout?: "criador" | "pro";
  readonly currency?: "BRL" | "USD";
  readonly period?: "monthly" | "annual";
};
```

On mount, when `checkout` is present and user has no active paid entitlement for that tier:

1. Apply `currency` / `period` from search (defaults: locale-derived currency, `monthly`).
2. Call `client.billing.createCheckout` once (guard with ref to prevent double-fire).
3. Redirect to gateway URL.

On checkout cancel (`status=cancel`), show banner; do not auto-retry.

### Backend config

Update production `BILLING_CHECKOUT_SUCCESS_URL` to `/app/onboarding?from=checkout` so paid new users land in onboarding after payment, not on the plans admin screen.

`BILLING_CHECKOUT_CANCEL_URL` remains `/app/plans?status=cancel` (preserve `checkout` params if useful for retry UX).

---

## Narrative Restructure

### Section order (single scroll)

| # | Section ID | Component | Launch change |
|---|------------|-----------|---------------|
| 1 | `#hero` | `HeroSection` | Launch copy; primary **Começar grátis**; secondary **Ver planos** (`#preco`) |
| 2 | `#territorio` | `ProblemSection` | Present tense; pain unchanged |
| 3 | `#ferramentas` | `ComparisonSection` | Proof earlier in story (swap with how-it-works) |
| 4 | `#rota` | `HowItWorksSection` | Real product journey (teach voice → brief → generate today) |
| 5 | `#formatos` | `FormatsSection` | Supported **Content Types** available now |
| 6 | `#preco` | `PricingSection` | Real prices, quota copy, per-plan CTAs, currency/period toggles |
| 7 | — | `TestimonialSection` | Keep curated quote; no fabricated metrics |
| 8 | `#perguntas` | `FaqSection` | Launch FAQ (signup, billing, cancellation, privacy) |
| 9 | `#comecar` | `LaunchCtaSection` *(new)* | Final conversion block replacing waitlist |

**Removed:** `WaitlistSection`, `#waitlist` anchors, waitlist eyebrow copy.

### Header (`SiteHeader`)

| Visitor state | Primary CTA | Secondary |
|---------------|-------------|-----------|
| Anonymous | Começar grátis → free intent | Entrar → `/login` |
| Authenticated | Ir para o app → `/app/generate` | — |

Nav items: update `marketing-nav-items.ts` — add `#preco`, remove waitlist references.

### Section rail

Update `MarketingSectionRail` anchor list to match new order and IDs. Replace waitlist pin with `#comecar`.

### Blog cross-links

Blog header/footer CTA currently points to waitlist — update to **Começar grátis** (free intent). `llms.txt` / `llms-full.txt` copy updated to describe live product signup, not waitlist.

---

## Pricing Section Design

### Marketing plan manifest

New file: `apps/web/src/marketing/content/plans/marketing-plan-catalog.ts`

Responsibilities:

- Import `monthlyCredits` from `@my-ai-orchestrator/payments` `DEFAULT_BILLING_PLANS` for quota derivation.
- Import `resolveQuotaLimit` with `canonicalCreditCost` from active pricing policy (constant `2.5` for policy `2026-06-22`, or read from shared contracts constant).
- Define **display subscription prices** per plan × currency × period (amounts in minor units or decimal — pick one convention and format in UI).
- Export typed plan cards for PT/EN feature copy (from i18n) + numeric data from manifest.

**Parity rule:** When `DEFAULT_BILLING_PLANS` monthly credits change, manifest quotas update automatically. When gateway subscription amounts change, update manifest in the same PR.

### Plan card content

Each card shows:

- Plan name (Explorador / Criador / Pro)
- Price for selected currency + period (formatted: `R$ XX/mês`, `$XX/mo`)
- Annual savings badge when annual selected (if annual price < 12 × monthly)
- Quota line: `~{n} gerações/mês` via `resolveQuotaLimit`
- Feature bullets (from i18n)
- Quality modes available per tier (free → fast; criador → fast+balanced; pro → all)
- CTA button wired to `buildMarketingConversionUrl`

### Controls

- **Currency toggle:** BRL | USD — default from `MarketingLocale` (`pt` → BRL, `en` → USD)
- **Period toggle:** Mensal | Anual
- State is client-side in `PricingSection`; passed into conversion URLs

Payment method (PIX vs card) is **not** selected on marketing — chosen on `/app/plans` auto-checkout (BRL defaults to last-used or card; optional: pass `paymentMethod` in search if needed later).

---

## Waitlist Removal

### Delete

| Path | Purpose |
|------|---------|
| `apps/web/src/marketing/sections/WaitlistSection.tsx` | UI section |
| `apps/web/src/platform/server/waitlist-action.ts` | Server action |
| `apps/web/src/platform/server/handle-waitlist-request.ts` | Request handler |
| `apps/web/src/platform/server/waitlist-rate-limit.ts` | Rate limit |
| `apps/web/src/platform/services/waitlist/*` | Effect service + Loops adapter |
| `apps/web/src/routes/api/waitlist.ts` | API route |
| Related tests | waitlist unit/integration tests |

### Update

- `BelowFoldSections.tsx` — remove waitlist; add `LaunchCtaSection`
- `HeroSection.tsx`, `PricingSection.tsx`, `SiteHeader.tsx`, `SiteMobileNav.tsx` — CTAs via intent helper
- `apps/web/src/i18n/marketing/locales/{pt,en}.ts` — remove `waitlist` namespace; add `launchCta`; update `faq`, `pricing`, `hero`, `header`
- `apps/web/src/marketing/seo/geo/llms.ts` — remove waitlist references
- `README.md` — remove waitlist flow diagram
- Deploy docs — remove `LOOPS_API_KEY`, `LOOPS_MAILING_LIST_ID`

### Governance

Remove waitlist from forbidden-pattern exceptions if any. Re-run `frontend-client-boundary` governance tests.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Auth0 misconfigured | Existing `AuthNotConfigured` on `/login` |
| Checkout gateway down | PlansScreen shows `checkoutError` banner; user can retry manually |
| User already on target paid plan | Plan card shows current badge; CTA hidden or "Plano atual" |
| Auto-checkout double mount | `useRef` guard prevents duplicate `createCheckout` |
| Payment webhook delay | User may briefly see Free entitlement until webhook; Generation Screen quota reflects wallet (existing behavior) |
| Cancelled checkout | Return to `/app/plans?status=cancel`; no auto-retry |

---

## Testing

| Module | Type | Assertion |
|--------|------|-----------|
| `buildMarketingConversionUrl` | Unit | Free/paid paths; authenticated skip login; encodes returnTo |
| `resolvePostLoginPath` | Unit | `checkout` param bypasses onboarding |
| `marketing-plan-catalog` | Unit | Quota limits match `DEFAULT_BILLING_PLANS` |
| Marketing i18n | Unit | No `waitlist` keys; `launchCta` parity pt/en |
| Governance | Unit | No waitlist routes; no direct backend fetch in marketing |
| Manual QA | Manual | Free signup E2E; paid signup → checkout → onboarding; logged-in plan click; currency toggle; `/en` parity |

**Deferred:** Playwright E2E for full Auth0 + gateway (manual launch checklist).

---

## Acceptance Criteria (Definition of Done)

- [ ] `/` and `/en` render launch narrative with no waitlist section or `#waitlist` links
- [ ] Hero, header, pricing, and final CTA connect to auth/checkout intents
- [ ] Plan cards show real BRL/USD prices for monthly and annual selections
- [ ] Free CTA → signup → onboarding → generate works for new user
- [ ] Paid CTA → signup → auto-checkout → pay → onboarding → generate works
- [ ] Authenticated visitor on marketing sees "Ir para o app" and direct plan checkout
- [ ] Waitlist code, API route, Loops adapter, and env vars removed
- [ ] Blog and llms.txt CTAs point to product signup
- [ ] Lighthouse Performance + Accessibility ≥ 90 on `/`
- [ ] All existing web tests updated; new unit tests for intent routing pass

---

## Rollout

1. Ship marketing redesign + auth intent routing + waitlist removal in one release (avoid hybrid waitlist/live state).
2. Before deploy: send manual launch email to Loops waitlist audience.
3. After deploy: verify `BILLING_CHECKOUT_SUCCESS_URL` points to onboarding path.
4. Monitor first conversions: signup rate, checkout start, webhook activation, onboarding completion.

---

## Related Documents

- [cultiv-marketing-surface-phase-1.md](../../live/prd/cultiv-marketing-surface-phase-1.md) — superseded for conversion model
- [cultiv-authenticated-workspace-web-v2.md](../../live/prd/cultiv-authenticated-workspace-web-v2.md) — workspace scope
- [2026-06-18-hybrid-pricing-design.md](./2026-06-18-hybrid-pricing-design.md) — quota presentation
- [2026-06-17-payment-gateway-design.md](./2026-06-17-payment-gateway-design.md) — Stripe/Asaas checkout
- [2026-06-23-cultiv-cartography-redesign-design.md](./2026-06-23-cultiv-cartography-redesign-design.md) — visual identity
- [CONTEXT.md](../../../CONTEXT.md) — domain glossary
