import type {
  BillingCurrency,
  BillingEntitlementView,
  BillingPlanView,
  BillingTopUpPackage,
  CheckoutStatusView,
  PlanCatalogView
} from "@my-ai-orchestrator/contracts";
import type { BillingCurrencyUI, BillingPeriodUI, PaywallTrigger, PlanCardData } from "@my-ai-orchestrator/ui/app/plans";

const KNOWN_TRIGGERS: ReadonlySet<string> = new Set([
  "trial_expired",
  "usage_restricted",
  "low_balance",
  "calibration_limit"
]);

// `?trigger=` is an external URL param — narrow it defensively instead of trusting a cast.
export function parseTrigger(raw: unknown): PaywallTrigger | undefined {
  return typeof raw === "string" && KNOWN_TRIGGERS.has(raw) ? (raw as PaywallTrigger) : undefined;
}

// Mirrors apps/landing/scripts/sync-plans.mjs's formatBRL/formatUSD — same rounding/decimal
// convention across both surfaces, now applied to the real per-request `amountCents` (backend
// already baked the annual −20% in; this never recomputes a discount).
export function formatCents(cents: number, currency: BillingCurrency): string {
  const value = cents / 100;
  if (currency === "BRL") {
    return Number.isInteger(value) ? `R$ ${value}` : `R$ ${value.toFixed(2).replace(".", ",")}`;
  }
  return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
}

export function mapPlanToCard(
  plan: BillingPlanView,
  period: BillingPeriodUI,
  currency: BillingCurrencyUI,
  checkoutInFlight: boolean,
  onSelect: () => void
): PlanCardData {
  const priceEntry = plan.prices[currency][period];
  const billNote =
    period === "annual" && priceEntry.annualTotalCents !== undefined
      ? ` · ${formatCents(priceEntry.annualTotalCents, currency)} cobrado no ano`
      : "";
  const current = plan.current === true;

  return {
    id: plan.id,
    name: plan.name,
    tag: plan.tag,
    featured: plan.featured,
    current,
    priceLabel: formatCents(priceEntry.amountCents, currency),
    billNote,
    generations: plan.monthlyGenerations,
    features: plan.features,
    ctaLabel: current ? "Plano atual" : `Assinar ${plan.name} →`,
    ctaDisabled: current || checkoutInFlight,
    onSelect
  };
}

export function mapCatalogToCards(
  catalog: PlanCatalogView,
  period: BillingPeriodUI,
  currency: BillingCurrencyUI,
  checkoutInFlight: boolean,
  onSelectPlan: (plan: BillingPlanView) => void
): PlanCardData[] {
  return catalog.plans.map((plan) => mapPlanToCard(plan, period, currency, checkoutInFlight, () => onSelectPlan(plan)));
}

// Top-up packages are currency-scoped in the real catalog (no cross-currency fallback exists
// server-side) — picking packages[0] when the selected currency has no match paired a mismatched
// currency+internalRef and the checkout call failed server-side (BillingCheckoutCatalogNotFoundError).
export function findTopUpPackage(
  packages: readonly BillingTopUpPackage[] | undefined,
  currency: BillingCurrencyUI
): BillingTopUpPackage | undefined {
  return packages?.find((pkg) => pkg.currency === currency);
}

export interface TrialBannerData {
  readonly used: number;
  readonly remaining: number;
  readonly totalGenerations: number;
  readonly daysRemaining: number;
}

// Trial's "5 gerações" pool rides on the same quotaLimit/quotaRemaining fields the paid plans
// use for quota — no separate trial-generations contract needed (GAP #8 mitigation, ticket 12 §2).
export function trialBannerData(entitlement: BillingEntitlementView, now: Date): TrialBannerData | undefined {
  if (entitlement.status !== "trialing") return undefined;

  return {
    used: Math.max(0, entitlement.quotaLimit - entitlement.quotaRemaining),
    remaining: entitlement.quotaRemaining,
    totalGenerations: entitlement.quotaLimit,
    daysRemaining: entitlement.trialEndsAt ? daysRemaining(entitlement.trialEndsAt, now) : 0
  };
}

export function daysRemaining(deadlineIso: string, now: Date): number {
  const ms = new Date(deadlineIso).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function gatewayLabel(gateway: "stripe" | "asaas"): string {
  return gateway === "stripe" ? "Stripe" : "ASAAS";
}

// 2e — DowngradeSurplus (breakdown-15 §1). BillingPlanView ships no rolloverCap field (GAP #6:
// that lives server-side on BillingCreditPolicy, never exposed to the catalog) — monthlyCredits
// (the plan's real monthly grant) is the closest honest proxy for the post-switch ceiling.
export interface DowngradeSurplusCheck {
  readonly keptCredits: number;
  readonly surplusCredits: number;
}

export function checkDowngradeSurplus(
  targetPlan: BillingPlanView,
  currentPlan: BillingPlanView | undefined,
  balance: number
): DowngradeSurplusCheck | undefined {
  if (!currentPlan || targetPlan.monthlyCredits >= currentPlan.monthlyCredits) return undefined;
  if (balance <= targetPlan.monthlyCredits) return undefined;
  return { keptCredits: targetPlan.monthlyCredits, surplusCredits: balance - targetPlan.monthlyCredits };
}

export type CheckoutKind = "redirecting" | "checking" | CheckoutStatusView["status"] | undefined;

export interface CheckoutFlowInputs {
  readonly intentId: string | undefined;
  readonly isCreatingCheckout: boolean;
  readonly checkoutStatus: CheckoutStatusView | undefined;
  readonly checkoutStatusLoading: boolean;
}

// Pure state machine for the overlay: creating a session ("redirecting") always wins; otherwise,
// an ?intentId= in the URL means we're back from the gateway and re-consulting server truth
// ("checking" while in flight, then the status itself) — no intentId + no mutation = no overlay.
export function deriveCheckoutKind(input: CheckoutFlowInputs): CheckoutKind {
  if (input.isCreatingCheckout) return "redirecting";
  if (!input.intentId) return undefined;
  if (input.checkoutStatusLoading || !input.checkoutStatus) return "checking";
  return input.checkoutStatus.status;
}
