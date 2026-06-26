import { useState } from "react";
import {
  CartographySurface,
  CoordinateLabel,
  Container,
  Text,
  cn,
} from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import {
  defaultCurrencyForLocale,
  type MarketingBillingCurrency,
  type MarketingBillingPeriod,
  type MarketingPlanIntent,
} from "~/marketing/auth/marketing-auth-intent";
import { formatPlanPrice } from "~/marketing/auth/format-plan-price";
import { MarketingConversionLink } from "~/marketing/components/MarketingConversionLink";
import {
  getMarketingDisplayPrice,
  getMarketingPlanQuotas,
  MARKETING_CANONICAL_CREDIT_COST,
} from "~/marketing/content/plans/marketing-plan-catalog";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

const MARKETING_PLAN_IDS = ["free", "criador", "pro"] as const satisfies ReadonlyArray<MarketingPlanIntent>;

export interface PricingSectionProps {
  readonly locale: MarketingLocale;
}

function PricingToggle({
  active,
  label,
  onClick,
}: {
  readonly active: boolean;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "ui-type-mono rounded-[3px] px-2.5 py-1 text-[0.625rem] uppercase tracking-widest transition-colors",
        active ? "bg-deep-blue text-off-white" : "text-ink-muted hover:text-ink"
      )}
    >
      {label}
    </button>
  );
}

export function PricingSection({ locale }: PricingSectionProps) {
  const { pricing } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");
  const [currency, setCurrency] = useState<MarketingBillingCurrency>(() =>
    defaultCurrencyForLocale(locale)
  );
  const [period, setPeriod] = useState<MarketingBillingPeriod>("monthly");
  const quotas = getMarketingPlanQuotas(MARKETING_CANONICAL_CREDIT_COST);

  return (
    <section id="preco" className="border-b border-ink-ghost/30">
      <CartographySurface>
        <Container
          ref={sectionRef}
          className="py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
        >
          <header
            className="mx-auto mb-10 max-w-3xl text-center md:mb-14"
            data-section-item
          >
            <CoordinateLabel
              index={6}
              label={pricing.eyebrow}
              className="mb-4 block"
            />
            <Text as="h2" variant="display" className="text-deep-blue">
              {pricing.title}
            </Text>
          </header>

          <div
            className="mx-auto mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row md:mb-14"
            data-section-item
          >
            <div
              role="group"
              aria-label={`${pricing.currencyBrl} / ${pricing.currencyUsd}`}
              className="flex gap-1 rounded-[5px] border-dotted-cartography bg-off-white p-1 shadow-cartography"
            >
              <PricingToggle
                active={currency === "BRL"}
                label={pricing.currencyBrl}
                onClick={() => setCurrency("BRL")}
              />
              <PricingToggle
                active={currency === "USD"}
                label={pricing.currencyUsd}
                onClick={() => setCurrency("USD")}
              />
            </div>
            <div
              role="group"
              aria-label={`${pricing.periodMonthly} / ${pricing.periodAnnual}`}
              className="flex gap-1 rounded-[5px] border-dotted-cartography bg-off-white p-1 shadow-cartography"
            >
              <PricingToggle
                active={period === "monthly"}
                label={pricing.periodMonthly}
                onClick={() => setPeriod("monthly")}
              />
              <PricingToggle
                active={period === "annual"}
                label={pricing.periodAnnual}
                onClick={() => setPeriod("annual")}
              />
            </div>
          </div>

          <div
            className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3 md:gap-6"
            data-section-item
          >
            {pricing.plans.map((plan, index) => {
              const planId = MARKETING_PLAN_IDS[index] ?? "free";
              const price = getMarketingDisplayPrice(planId, currency, period);
              const quota = quotas[planId];
              const formattedPrice = formatPlanPrice(price, currency, period, locale);
              const quotaLabel = pricing.quotaLabel.replace("{count}", String(quota));

              return (
                <article
                  key={plan.name}
                  className={cn(
                    "flex flex-col rounded-[5px] bg-off-white p-6 shadow-cartography md:p-7",
                    plan.recommended && "md:-translate-y-1 md:shadow-[6px_6px_0_rgba(26,46,60,0.1)]"
                  )}
                >
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Text as="h3" variant="heading" className="text-deep-blue">
                      {plan.name}
                    </Text>
                    {plan.badge ? (
                      <span
                        className={cn(
                          "rounded-[5px] px-2 py-0.5 ui-type-mono text-[0.625rem] uppercase tracking-widest",
                          plan.recommended
                            ? "bg-terracotta/10 text-terracotta"
                            : "bg-cream text-ink-muted"
                        )}
                      >
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>

                  <div className="mb-4">
                    <Text as="p" variant="display" className="text-deep-blue">
                      {formattedPrice}
                    </Text>
                    <Text as="p" variant="body" className="mt-1 text-ink-muted">
                      {quotaLabel}
                    </Text>
                  </div>

                  <Text as="p" variant="body" className="mb-6 text-ink-muted">
                    {plan.description}
                  </Text>

                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span
                          aria-hidden
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta"
                        />
                        <Text as="span" variant="body" className="text-ink-muted">
                          {feature}
                        </Text>
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-center pt-2">
                    <MarketingConversionLink
                      intent={{ plan: planId, currency, period }}
                      variant="primary"
                    >
                      {planId === "free" ? pricing.ctaFree : pricing.ctaSubscribe}
                    </MarketingConversionLink>
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </CartographySurface>
    </section>
  );
}
