import { DEFAULT_BILLING_PLANS, resolveQuotaLimit } from "@my-ai-orchestrator/payments";
import type { MarketingBillingCurrency, MarketingBillingPeriod } from "~/marketing/auth/marketing-auth-intent";

export const MARKETING_CANONICAL_CREDIT_COST = 2.5;

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
