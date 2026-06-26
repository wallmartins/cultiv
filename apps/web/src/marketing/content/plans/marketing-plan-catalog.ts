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

export function resolveMarketingAnnualSavingsPercent(
  planId: Exclude<keyof typeof MARKETING_SUBSCRIPTION_PRICES, "free">,
  currency: MarketingBillingCurrency
): number | null {
  const monthly = MARKETING_SUBSCRIPTION_PRICES[planId][currency].monthly;
  const annual = MARKETING_SUBSCRIPTION_PRICES[planId][currency].annual;
  if (monthly <= 0 || annual <= 0) {
    return null;
  }

  const fullYearAtMonthly = monthly * 12;
  if (annual >= fullYearAtMonthly) {
    return null;
  }

  return Math.round((1 - annual / fullYearAtMonthly) * 100);
}

export function resolveMarketingQuotaMultiplier(
  planId: Exclude<keyof typeof MARKETING_SUBSCRIPTION_PRICES, "free">,
  canonicalCreditCost: number
): number {
  const quotas = getMarketingPlanQuotas(canonicalCreditCost);
  return quotas[planId] / quotas.free;
}

export function formatQuotaMultiplier(value: number, locale: "pt" | "en"): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return locale === "pt" ? text.replace(".", ",") : text;
}
