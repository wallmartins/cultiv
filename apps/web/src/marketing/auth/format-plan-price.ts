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
