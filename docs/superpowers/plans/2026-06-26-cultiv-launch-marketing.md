# Cultiv Launch Marketing Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the pre-launch waitlist funnel with a launch-ready marketing surface that converts visitors into Free signups or paid subscriptions via Auth0 + checkout handoff.

**Architecture:** Single-scroll landing (`/`, `/en`) keeps Cultiv Cartography. A new `marketing/auth` intent layer builds `/login?returnTo=…` or direct `/app/*` URLs. Post-login routing bypasses onboarding when `returnTo` targets paid checkout. `PlansScreen` auto-starts hosted checkout from search params. Plan prices come from a static marketing manifest aligned with `DEFAULT_BILLING_PLANS` quotas. Waitlist code is deleted in the same release.

**Tech Stack:** TanStack Start/Router, React 19, Auth0 React SDK, `@my-ai-orchestrator/client-sdk`, `@my-ai-orchestrator/payments`, Vitest.

**Spec:** [`docs/superpowers/specs/2026-06-26-cultiv-launch-marketing-design.md`](../specs/2026-06-26-cultiv-launch-marketing-design.md)

---

## File map

| File | Responsibility |
|------|----------------|
| `apps/web/src/marketing/auth/marketing-auth-intent.ts` | Intent types + `buildMarketingConversionUrl` + checkout path builder |
| `apps/web/src/marketing/auth/has-checkout-intent.ts` | Parse `returnTo` / plans URL for checkout bypass |
| `apps/web/src/marketing/auth/format-plan-price.ts` | Format BRL/USD amounts for cards |
| `apps/web/src/marketing/content/plans/marketing-plan-catalog.ts` | Display prices + quota derivation from payments package |
| `apps/web/src/marketing/components/MarketingConversionLink.tsx` | Client CTA: auth-aware href |
| `apps/web/src/marketing/sections/LaunchCtaSection.tsx` | Final signup CTA (replaces waitlist) |
| `apps/web/src/marketing/sections/PricingSection.tsx` | Real prices, toggles, per-plan CTAs |
| `apps/web/src/marketing/components/BelowFoldSections.tsx` | Reordered sections + `LaunchCtaSection` |
| `apps/web/src/marketing/components/SiteHeader.tsx` | Launch CTAs + authenticated state |
| `apps/web/src/marketing/components/SiteMobileNav.tsx` | Mirror header CTAs |
| `apps/web/src/marketing/components/MarketingSectionRail.tsx` | New section order; `#comecar` replaces `#waitlist` |
| `apps/web/src/marketing/navigation/marketing-nav-items.ts` | Add `#preco` nav item |
| `apps/web/src/app/auth/lib/post-login-redirect.ts` | Checkout intent bypasses onboarding |
| `apps/web/src/routes/login.tsx` | Accept `returnTo` search param |
| `apps/web/src/routes/app/plans.tsx` | Extended search validation |
| `apps/web/src/app/plans/screens/PlansScreen.tsx` | Auto-checkout on mount |
| `apps/web/src/i18n/marketing/types.ts` | Remove `waitlist`; add `launchCta`; update header/pricing types |
| `apps/web/src/i18n/marketing/locales/pt.ts` | Launch copy PT |
| `apps/web/src/i18n/marketing/locales/en.ts` | Launch copy EN |
| `apps/web/src/marketing/seo/geo/llms.ts` | Signup URL instead of waitlist |
| `apps/web/src/blog/screens/BlogPostScreen.tsx` | Free signup CTA |
| `tests/web/marketing-auth-intent.test.ts` | Intent URL builder tests |
| `tests/web/marketing-plan-catalog.test.ts` | Quota parity tests |
| `tests/web/post-login-redirect.test.ts` | Checkout bypass tests |
| `tests/web/has-checkout-intent.test.ts` | Parser tests |
| `README.md` | Remove waitlist diagram |
| `docs/live/runbooks/production-go-live.md` | Remove Loops env vars; document success URL |

## Deleted in this plan

- `apps/web/src/marketing/sections/WaitlistSection.tsx`
- `apps/web/src/platform/server/waitlist-action.ts`
- `apps/web/src/platform/server/handle-waitlist-request.ts`
- `apps/web/src/platform/server/waitlist-rate-limit.ts`
- `apps/web/src/platform/services/waitlist/*`
- `apps/web/src/routes/api/waitlist.ts`
- `tests/web/waitlist-service.test.ts`

## Out of scope

- Public plans API, Customer Portal, Playwright E2E, automated Loops launch email.

---

## Task 1: Marketing auth intent module

**Files:**
- Create: `apps/web/src/marketing/auth/marketing-auth-intent.ts`
- Create: `apps/web/src/marketing/auth/has-checkout-intent.ts`
- Create: `tests/web/marketing-auth-intent.test.ts`
- Create: `tests/web/has-checkout-intent.test.ts`

- [ ] **Step 1: Write failing tests for URL builder**

```typescript
// tests/web/marketing-auth-intent.test.ts
import { describe, expect, it } from "vitest";
import {
  buildMarketingConversionUrl,
  buildPlansCheckoutPath,
} from "../../apps/web/src/marketing/auth/marketing-auth-intent.js";

describe("buildPlansCheckoutPath", () => {
  it("builds checkout search for criador", () => {
    expect(
      buildPlansCheckoutPath({
        plan: "criador",
        currency: "BRL",
        period: "monthly",
      })
    ).toBe("/app/plans?checkout=criador&currency=BRL&period=monthly");
  });
});

describe("buildMarketingConversionUrl", () => {
  it("returns generate path for free intent when authenticated", () => {
    expect(
      buildMarketingConversionUrl(
        { plan: "free", currency: "BRL", period: "monthly" },
        { isAuthenticated: true }
      )
    ).toBe("/app/generate");
  });

  it("returns login with returnTo for unauthenticated paid intent", () => {
    const url = buildMarketingConversionUrl(
      { plan: "pro", currency: "USD", period: "annual" },
      { isAuthenticated: false }
    );
    expect(url).toBe(
      "/login?returnTo=%2Fapp%2Fplans%3Fcheckout%3Dpro%26currency%3DUSD%26period%3Dannual"
    );
  });

  it("returns direct checkout when authenticated", () => {
    expect(
      buildMarketingConversionUrl(
        { plan: "criador", currency: "BRL", period: "monthly" },
        { isAuthenticated: true }
      )
    ).toBe("/app/plans?checkout=criador&currency=BRL&period=monthly");
  });
});
```

```typescript
// tests/web/has-checkout-intent.test.ts
import { describe, expect, it } from "vitest";
import { hasCheckoutIntent } from "../../apps/web/src/marketing/auth/has-checkout-intent.js";

describe("hasCheckoutIntent", () => {
  it("is true for plans checkout returnTo", () => {
    expect(hasCheckoutIntent("/app/plans?checkout=criador&currency=BRL&period=monthly")).toBe(true);
  });

  it("is false for generate returnTo", () => {
    expect(hasCheckoutIntent("/app/generate")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/web/marketing-auth-intent.test.ts tests/web/has-checkout-intent.test.ts`

Expected: FAIL — modules not found

- [ ] **Step 3: Implement intent helpers**

```typescript
// apps/web/src/marketing/auth/marketing-auth-intent.ts
export type MarketingPlanIntent = "free" | "criador" | "pro";
export type MarketingBillingCurrency = "BRL" | "USD";
export type MarketingBillingPeriod = "monthly" | "annual";

export type MarketingAuthIntent = {
  readonly plan: MarketingPlanIntent;
  readonly currency: MarketingBillingCurrency;
  readonly period: MarketingBillingPeriod;
};

export function defaultCurrencyForLocale(locale: "pt" | "en"): MarketingBillingCurrency {
  return locale === "pt" ? "BRL" : "USD";
}

export function buildPlansCheckoutPath(intent: Omit<MarketingAuthIntent, "plan"> & {
  readonly plan: Exclude<MarketingPlanIntent, "free">;
}): string {
  const params = new URLSearchParams({
    checkout: intent.plan,
    currency: intent.currency,
    period: intent.period,
  });
  return `/app/plans?${params.toString()}`;
}

export function buildMarketingConversionUrl(
  intent: MarketingAuthIntent,
  options: { readonly isAuthenticated: boolean }
): string {
  if (intent.plan === "free") {
    return options.isAuthenticated ? "/app/generate" : `/login?returnTo=${encodeURIComponent("/app/generate")}`;
  }

  const checkoutPath = buildPlansCheckoutPath({
    plan: intent.plan,
    currency: intent.currency,
    period: intent.period,
  });

  return options.isAuthenticated
    ? checkoutPath
    : `/login?returnTo=${encodeURIComponent(checkoutPath)}`;
}
```

```typescript
// apps/web/src/marketing/auth/has-checkout-intent.ts
export function hasCheckoutIntent(path: string): boolean {
  try {
    const url = new URL(path, "https://cultiv.local");
    return url.pathname === "/app/plans" && url.searchParams.has("checkout");
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/web/marketing-auth-intent.test.ts tests/web/has-checkout-intent.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/marketing/auth/ tests/web/marketing-auth-intent.test.ts tests/web/has-checkout-intent.test.ts
git commit -m "feat(web): add marketing auth intent URL builders"
```

---

## Task 2: Post-login checkout bypass + login returnTo

**Files:**
- Modify: `apps/web/src/app/auth/lib/post-login-redirect.ts`
- Modify: `apps/web/src/routes/login.tsx`
- Modify: `tests/web/post-login-redirect.test.ts`

- [ ] **Step 1: Write failing checkout bypass test**

Add to `tests/web/post-login-redirect.test.ts`:

```typescript
it("honors paid checkout returnTo before onboarding gate", () => {
  expect(
    resolvePostLoginPath({
      onboardingComplete: false,
      voiceExampleCount: 0,
      intendedPath: "/app/plans?checkout=criador&currency=BRL&period=monthly",
    })
  ).toBe("/app/plans?checkout=criador&currency=BRL&period=monthly");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/web/post-login-redirect.test.ts`

Expected: FAIL — returns `/app/onboarding`

- [ ] **Step 3: Implement bypass in post-login-redirect**

```typescript
import { hasCheckoutIntent } from "~/marketing/auth/has-checkout-intent";

export function resolvePostLoginPath(input: PostLoginRedirectInput): string {
  if (input.intendedPath && hasCheckoutIntent(input.intendedPath)) {
    return input.intendedPath;
  }

  const gatedPath = shouldEnterOnboarding(input) ? APP_ONBOARDING_PATH : APP_GENERATE_PATH;

  if (!input.intendedPath || !isAppPath(input.intendedPath)) {
    return gatedPath;
  }

  if (shouldEnterOnboarding(input)) {
    return APP_ONBOARDING_PATH;
  }

  return input.intendedPath;
}
```

- [ ] **Step 4: Accept returnTo on login route**

Update `apps/web/src/routes/login.tsx`:

```typescript
export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search.returnTo === "string" ? search.returnTo : undefined,
  }),
  component: LoginPage,
});

// Inside LoginPageContent, replace hardcoded returnTo:
const search = Route.useSearch();
const returnTo = search.returnTo ?? "/app/generate";

void loginWithRedirect({
  appState: { returnTo },
});
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/web/post-login-redirect.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/auth/lib/post-login-redirect.ts apps/web/src/routes/login.tsx tests/web/post-login-redirect.test.ts
git commit -m "feat(web): bypass onboarding for paid checkout returnTo"
```

---

## Task 3: Marketing plan catalog + price formatting

**Files:**
- Modify: `apps/web/package.json` (add `@my-ai-orchestrator/payments` workspace dependency)
- Create: `apps/web/src/marketing/content/plans/marketing-plan-catalog.ts`
- Create: `apps/web/src/marketing/auth/format-plan-price.ts`
- Create: `tests/web/marketing-plan-catalog.test.ts`

- [ ] **Step 1: Add payments dependency**

In `apps/web/package.json` dependencies:

```json
"@my-ai-orchestrator/payments": "workspace:*"
```

Run: `pnpm install`

- [ ] **Step 2: Write failing quota parity test**

```typescript
// tests/web/marketing-plan-catalog.test.ts
import { describe, expect, it } from "vitest";
import { DEFAULT_BILLING_PLANS } from "@my-ai-orchestrator/payments";
import { resolveQuotaLimit } from "@my-ai-orchestrator/payments";
import { getMarketingPlanQuotas } from "../../apps/web/src/marketing/content/plans/marketing-plan-catalog.js";

const CANONICAL_CREDIT_COST = 2.5;

describe("marketing plan catalog", () => {
  it("derives quotas from DEFAULT_BILLING_PLANS", () => {
    const quotas = getMarketingPlanQuotas(CANONICAL_CREDIT_COST);
    for (const plan of DEFAULT_BILLING_PLANS) {
      expect(quotas[plan.id as keyof typeof quotas]).toBe(
        resolveQuotaLimit(plan.monthlyCredits, CANONICAL_CREDIT_COST)
      );
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run tests/web/marketing-plan-catalog.test.ts`

Expected: FAIL

- [ ] **Step 4: Implement catalog**

```typescript
// apps/web/src/marketing/content/plans/marketing-plan-catalog.ts
import { DEFAULT_BILLING_PLANS, resolveQuotaLimit } from "@my-ai-orchestrator/payments";
import type { MarketingBillingCurrency, MarketingBillingPeriod } from "~/marketing/auth/marketing-auth-intent";

export const MARKETING_CANONICAL_CREDIT_COST = 2.5;

/** Display amounts in major currency units (reais / dollars). Keep in sync with gateway catalog. */
export const MARKETING_SUBSCRIPTION_PRICES = {
  free: {
    BRL: { monthly: 0, annual: 0 },
    USD: { monthly: 0, annual: 0 },
  },
  criador: {
    BRL: { monthly: 69, annual: 690 },
    USD: { monthly: 24, annual: 240 },
  },
  pro: {
    BRL: { monthly: 119, annual: 1190 },
    USD: { monthly: 59, annual: 590 },
  },
} as const;

export function getMarketingPlanQuotas(canonicalCreditCost: number) {
  return Object.fromEntries(
    DEFAULT_BILLING_PLANS.map((plan) => [
      plan.id,
      resolveQuotaLimit(plan.monthlyCredits, canonicalCreditCost),
    ])
  ) as Record<"free" | "criador" | "pro", number>;
}

export function getMarketingDisplayPrice(
  planId: keyof typeof MARKETING_SUBSCRIPTION_PRICES,
  currency: MarketingBillingCurrency,
  period: MarketingBillingPeriod
): number {
  return MARKETING_SUBSCRIPTION_PRICES[planId][currency][period];
}
```

```typescript
// apps/web/src/marketing/auth/format-plan-price.ts
import type { MarketingBillingCurrency, MarketingBillingPeriod } from "./marketing-auth-intent";

export function formatPlanPrice(
  amount: number,
  currency: MarketingBillingCurrency,
  period: MarketingBillingPeriod,
  locale: "pt" | "en"
): string {
  if (amount === 0) {
    return locale === "pt" ? "Grátis" : "Free";
  }

  const formatted = new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

  const suffix =
    period === "annual"
      ? locale === "pt"
        ? "/ano"
        : "/yr"
      : locale === "pt"
        ? "/mês"
        : "/mo";

  return `${formatted}${suffix}`;
}
```

- [ ] **Step 5: Run test**

Run: `pnpm vitest run tests/web/marketing-plan-catalog.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json apps/web/src/marketing/content/plans/ apps/web/src/marketing/auth/format-plan-price.ts tests/web/marketing-plan-catalog.test.ts pnpm-lock.yaml
git commit -m "feat(web): add marketing plan catalog with quota-derived limits"
```

---

## Task 4: Plans route search + auto-checkout

**Files:**
- Modify: `apps/web/src/routes/app/plans.tsx`
- Modify: `apps/web/src/app/plans/screens/PlansScreen.tsx`

- [ ] **Step 1: Extend route search validation**

```typescript
// apps/web/src/routes/app/plans.tsx
type PlansSearch = {
  readonly status?: "success" | "cancel";
  readonly checkout?: "criador" | "pro";
  readonly currency?: "BRL" | "USD";
  readonly period?: "monthly" | "annual";
};

function readPlansSearch(search: Record<string, unknown>): PlansSearch {
  const checkout = search.checkout === "criador" || search.checkout === "pro" ? search.checkout : undefined;
  const currency = search.currency === "BRL" || search.currency === "USD" ? search.currency : undefined;
  const period = search.period === "monthly" || search.period === "annual" ? search.period : undefined;
  const status = search.status === "success" || search.status === "cancel" ? search.status : undefined;
  return { checkout, currency, period, status };
}

export const Route = createFileRoute("/app/plans")({
  validateSearch: readPlansSearch,
  component: PlansPage,
});
```

- [ ] **Step 2: Auto-checkout effect in PlansScreen**

At top of `PlansScreen`, after entitlement load:

```typescript
const search = useSearch({ from: "/app/plans" });
const autoCheckoutStarted = useRef(false);

useEffect(() => {
  if (!search.checkout || !entitlement || autoCheckoutStarted.current) {
    return;
  }

  const targetTier = search.checkout === "criador" ? "starter" : "pro";
  const alreadyOnPlan =
    entitlement.tier === targetTier && entitlement.status === "active";

  if (alreadyOnPlan) {
    return;
  }

  autoCheckoutStarted.current = true;
  const currency = search.currency ?? "BRL";
  const period = search.period ?? "monthly";
  void startCheckout("subscription", search.checkout, period, currency);
}, [entitlement, search.checkout, search.currency, search.period]);
```

Update `startCheckout` signature to accept optional `currency` override from search (use search currency when present instead of component state).

- [ ] **Step 3: Verify TypeScript**

Run: `pnpm --filter @my-ai-orchestrator/web lint`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/app/plans.tsx apps/web/src/app/plans/screens/PlansScreen.tsx
git commit -m "feat(web): auto-start checkout from plans search params"
```

---

## Task 5: i18n types and launch copy

**Files:**
- Modify: `apps/web/src/i18n/marketing/types.ts`
- Modify: `apps/web/src/i18n/marketing/locales/pt.ts`
- Modify: `apps/web/src/i18n/marketing/locales/en.ts`

- [ ] **Step 1: Update types — remove waitlist, add launchCta**

In `types.ts`:
- Replace `ctaWaitlist` with `ctaStartFree` and `ctaSignIn` and `ctaGoToApp` on `header`
- Remove entire `waitlist` namespace
- Add `launchCta` namespace: `eyebrow`, `title`, `description`, `ctaPrimary`
- Update `pricing`: add `periodMonthly`, `periodAnnual`, `currencyBrl`, `currencyUsd`, `quotaLabel`, `ctaFree`, `ctaSubscribe`, remove `cta: "Entrar na lista"`
- Update `hero.ctaPrimary` / `ctaSecondary` to launch strings
- Update `faq` items `pricing` and `access` for live product
- In `geo.llms.labels`, rename `waitlist` → `signup` (or repurpose label key)

- [ ] **Step 2: Update PT copy (key strings)**

```typescript
header: {
  ctaStartFree: "Começar grátis",
  ctaSignIn: "Entrar",
  ctaGoToApp: "Ir para o app",
  // remove ctaWaitlist
},
hero: {
  ctaPrimary: "Começar grátis",
  ctaSecondary: "Ver planos",
},
pricing: {
  ctaFree: "Começar grátis",
  ctaSubscribe: "Assinar",
  quotaLabel: "~{count} gerações/mês",
  // update plan footers — remove "Valor: em definição"
},
launchCta: {
  eyebrow: "Comece agora",
  title: "Sua voz merece um território próprio",
  description: "Crie sua conta grátis e comece a gerar textos com a sua assinatura.",
  ctaPrimary: "Começar grátis",
},
faq: {
  title: "Perguntas frequentes",
  // access answer: signup + login, not waitlist
},
```

- [ ] **Step 3: Mirror EN copy with structural parity**

- [ ] **Step 4: Run i18n catalog test**

Run: `pnpm vitest run tests/web/i18n-catalog.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/i18n/marketing/
git commit -m "content(web): launch marketing copy replaces waitlist messaging"
```

---

## Task 6: MarketingConversionLink + header CTAs

**Files:**
- Create: `apps/web/src/marketing/components/MarketingConversionLink.tsx`
- Modify: `apps/web/src/marketing/components/SiteHeader.tsx`
- Modify: `apps/web/src/marketing/components/SiteMobileNav.tsx`

- [ ] **Step 1: Create client conversion link**

```tsx
// apps/web/src/marketing/components/MarketingConversionLink.tsx
import { useAuth0 } from "@auth0/auth0-react";
import { ButtonLink, type ButtonLinkProps } from "@my-ai-orchestrator/ui";
import {
  buildMarketingConversionUrl,
  type MarketingAuthIntent,
} from "~/marketing/auth/marketing-auth-intent";

export function MarketingConversionLink(
  props: Omit<ButtonLinkProps, "href"> & { readonly intent: MarketingAuthIntent }
) {
  const { isAuthenticated } = useAuth0();
  const href = buildMarketingConversionUrl(props.intent, { isAuthenticated });
  const { intent: _intent, ...buttonProps } = props;
  return <ButtonLink href={href} {...buttonProps} />;
}
```

- [ ] **Step 2: Update SiteHeader**

- Import `useAuth0`, `MarketingConversionLink`, `defaultCurrencyForLocale`
- Anonymous: `MarketingConversionLink` free intent (compact primary) + `ButtonLink` `/login` ghost "Entrar"
- Authenticated: `ButtonLink` `/app/generate` "Ir para o app"
- Remove `#waitlist` button

- [ ] **Step 3: Update SiteMobileNav** — same CTA logic in drawer footer

- [ ] **Step 4: Build check**

Run: `pnpm --filter @my-ai-orchestrator/web build`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/marketing/components/MarketingConversionLink.tsx apps/web/src/marketing/components/SiteHeader.tsx apps/web/src/marketing/components/SiteMobileNav.tsx
git commit -m "feat(web): auth-aware marketing header CTAs"
```

---

## Task 7: PricingSection with real prices and toggles

**Files:**
- Modify: `apps/web/src/marketing/sections/PricingSection.tsx`
- Modify: `apps/web/src/marketing/sections/HeroSection.tsx`

- [ ] **Step 1: Hero CTAs**

Replace `ButtonLink href="#waitlist"` with:
- Primary: `MarketingConversionLink` free intent
- Secondary: `ButtonLink href="#preco"`

- [ ] **Step 2: Rebuild PricingSection**

- Add `useState` for `currency` (default `defaultCurrencyForLocale(locale)`) and `period`
- Render currency + period toggle row (reuse toggle styling from PlansScreen or `ToggleButton` pattern)
- For each plan in i18n `pricing.plans`:
  - Resolve price via `getMarketingDisplayPrice(planId, currency, period)`
  - Show `formatPlanPrice(...)`
  - Show quota via `getMarketingPlanQuotas(MARKETING_CANONICAL_CREDIT_COST)[planId]`
  - CTA: Free → `MarketingConversionLink` free intent; paid → criador/pro intent with current currency/period
- Remove `href="#waitlist"` from all cards

- [ ] **Step 3: Visual check** — `pnpm --filter @my-ai-orchestrator/web dev` and verify `/` pricing section

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/marketing/sections/PricingSection.tsx apps/web/src/marketing/sections/HeroSection.tsx
git commit -m "feat(web): marketing pricing section with live prices and conversion CTAs"
```

---

## Task 8: LaunchCtaSection + section reorder

**Files:**
- Create: `apps/web/src/marketing/sections/LaunchCtaSection.tsx`
- Modify: `apps/web/src/marketing/components/BelowFoldSections.tsx`
- Modify: `apps/web/src/marketing/components/MarketingSectionRail.tsx`
- Modify: `apps/web/src/marketing/navigation/marketing-nav-items.ts`

- [ ] **Step 1: Create LaunchCtaSection**

```tsx
// apps/web/src/marketing/sections/LaunchCtaSection.tsx
export function LaunchCtaSection({ locale }: { readonly locale: MarketingLocale }) {
  const { launchCta } = getLocaleMessages(locale);
  return (
    <section id="comecar" className="border-b border-ink-ghost/30">
      <CartographySurface variant="dark">
        <Container>
          <CoordinateLabel label={launchCta.eyebrow} />
          <Text variant="display">{launchCta.title}</Text>
          <Text variant="body-lg">{launchCta.description}</Text>
          <MarketingConversionLink
            intent={{ plan: "free", currency: defaultCurrencyForLocale(locale), period: "monthly" }}
          >
            {launchCta.ctaPrimary}
          </MarketingConversionLink>
        </Container>
      </CartographySurface>
    </section>
  );
}
```

Use existing dark-surface Cartography patterns from former waitlist section where applicable.

- [ ] **Step 2: Reorder BelowFoldSections**

```tsx
export function BelowFoldSections({ locale }: BelowFoldSectionsProps) {
  return (
    <>
      <ProblemSection locale={locale} />
      <ComparisonSection locale={locale} />
      <HowItWorksSection locale={locale} />
      <FormatsSection locale={locale} />
      <PricingSection locale={locale} />
      <TestimonialSection locale={locale} />
      <FaqSection locale={locale} />
      <LaunchCtaSection locale={locale} />
    </>
  );
}
```

- [ ] **Step 3: Update MarketingSectionRail**

Replace `SECTION_IDS` order:

```typescript
const SECTION_IDS = [
  "hero",
  "territorio",
  "comparacao",   // ComparisonSection
  "rota",         // HowItWorksSection
  "ferramentas",  // FormatsSection (existing id)
  "preco",
  "depoimento",
  "perguntas",
  "comecar",
] as const;
```

Existing section `id` values (do not rename without updating nav): `ComparisonSection` → `comparacao`, `FormatsSection` → `ferramentas`. Update `DARK_SURFACE_SECTIONS` to use `comecar` instead of `waitlist`.

- [ ] **Step 4: Add pricing to marketing-nav-items**

```typescript
export const marketingNavItems = [
  { key: "territory" as const, href: "#territorio" },
  { key: "route" as const, href: "#rota" },
  { key: "tools" as const, href: "#ferramentas" },
  { key: "pricing" as const, href: "#preco" },
  { key: "questions" as const, href: "#perguntas" },
] as const;
```

Add `pricing` key to i18n `header.nav`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/marketing/sections/LaunchCtaSection.tsx apps/web/src/marketing/components/BelowFoldSections.tsx apps/web/src/marketing/components/MarketingSectionRail.tsx apps/web/src/marketing/navigation/marketing-nav-items.ts
git commit -m "feat(web): launch CTA section and reordered marketing narrative"
```

---

## Task 9: Remove waitlist stack

**Files:**
- Delete: all waitlist files listed in File map
- Modify: `apps/web/src/routeTree.gen.ts` (regenerated on build)
- Delete: `tests/web/waitlist-service.test.ts`

- [ ] **Step 1: Delete waitlist source files**

```bash
rm apps/web/src/marketing/sections/WaitlistSection.tsx
rm apps/web/src/platform/server/waitlist-action.ts
rm apps/web/src/platform/server/handle-waitlist-request.ts
rm apps/web/src/platform/server/waitlist-rate-limit.ts
rm -r apps/web/src/platform/services/waitlist
rm apps/web/src/routes/api/waitlist.ts
rm tests/web/waitlist-service.test.ts
```

- [ ] **Step 2: Grep for remaining references**

Run: `rg -n "waitlist|Waitlist|LOOPS_" apps/web/src tests/web README.md docs/live/runbooks`

Fix any imports (route tree regenerates on dev/build).

- [ ] **Step 3: Run web tests**

Run: `pnpm test:web`

Expected: PASS (no waitlist tests)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(web): remove waitlist surface and Loops integration"
```

---

## Task 10: Blog, SEO, and docs cross-links

**Files:**
- Modify: `apps/web/src/blog/screens/BlogPostScreen.tsx`
- Modify: `apps/web/src/marketing/seo/geo/llms.ts`
- Modify: `apps/web/src/i18n/marketing/locales/pt.ts` (blog.cta → `ctaStartFree`)
- Modify: `apps/web/src/i18n/marketing/locales/en.ts`
- Modify: `README.md`
- Modify: `docs/live/runbooks/production-go-live.md`

- [ ] **Step 1: Blog post CTA**

Replace `#waitlist` with `/login?returnTo=%2Fapp%2Fgenerate` or use `buildMarketingConversionUrl` in a small helper imported from marketing auth (blog can import marketing module).

- [ ] **Step 2: llms.ts**

Change waitlist URL line to signup:

```typescript
`- ${llms.labels.signup}: ${homeUrl} (free account — ${locale === "pt" ? "Começar grátis" : "Start free"})`,
```

- [ ] **Step 3: README** — remove Waitlist flow section; add Launch conversion summary

- [ ] **Step 4: Run geo tests**

Run: `pnpm vitest run tests/web/geo.test.ts`

Expected: PASS (update snapshots/assertions if needed)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/blog/ apps/web/src/marketing/seo/geo/ README.md docs/live/runbooks/production-go-live.md
git commit -m "docs(web): point blog and GEO copy to product signup"
```

---

## Task 11: Production checkout success URL (ops)

**Files:**
- Modify: `docs/live/runbooks/production-go-live.md`

- [ ] **Step 1: Document env change**

```markdown
| `BILLING_CHECKOUT_SUCCESS_URL` | `https://<domain>/app/onboarding?from=checkout` |
| `BILLING_CHECKOUT_CANCEL_URL` | `https://<domain>/app/plans?status=cancel` |
```

Remove `LOOPS_API_KEY` and `LOOPS_WAITLIST_ID` rows.

- [ ] **Step 2: Commit**

```bash
git add docs/live/runbooks/production-go-live.md
git commit -m "docs: launch runbook drops Loops, sets checkout success URL"
```

---

## Task 12: QA gate

**Files:** (verification only)

- [ ] **Step 1: Full web test suite**

Run: `pnpm test:web`

Expected: all PASS

- [ ] **Step 2: Web production build**

Run: `pnpm --filter @my-ai-orchestrator/web build`

Expected: PASS

- [ ] **Step 3: Governance**

Run: `pnpm vitest run tests/governance/frontend-client-boundary.test.ts`

Expected: PASS

- [ ] **Step 4: Manual launch checklist**

1. `/` — no `#waitlist`; hero + pricing CTAs work
2. Logged out → Criador → Auth0 → auto redirect to Asaas/Stripe
3. Logged out → Começar grátis → Auth0 → onboarding → generate
4. Logged in on `/` → "Ir para o app"; plan button skips login
5. `/en` structural parity
6. Blog post CTA → signup path

- [ ] **Step 5: Update progress log**

Add entry to `docs/progress-log.md` for launch marketing implementation complete.

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Free signup flow | 1, 2, 6, 7, 8 |
| Paid checkout flow | 1, 2, 4, 7 |
| Pay-first onboarding bypass | 2 |
| Real prices BRL/USD + toggles | 3, 7 |
| Narrative restructure | 8 |
| Waitlist removal | 9 |
| Authenticated header | 6 |
| Blog + llms updates | 10 |
| Success URL ops | 11 |
| Tests + acceptance | 1–3, 5, 12 |

No TBD placeholders in task steps. Price amounts are explicit in `MARKETING_SUBSCRIPTION_PRICES` (adjust in Task 3 if gateway catalog differs).
