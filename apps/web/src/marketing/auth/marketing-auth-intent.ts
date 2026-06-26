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
