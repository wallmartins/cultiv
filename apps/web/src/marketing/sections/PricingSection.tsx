import {
  ButtonLink,
  CartographySurface,
  CoordinateLabel,
  Container,
  Text,
  cn,
} from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface PricingSectionProps {
  readonly locale: MarketingLocale;
}

export function PricingSection({ locale }: PricingSectionProps) {
  const { pricing } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

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
            className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3 md:gap-6"
            data-section-item
          >
            {pricing.plans.map((plan) => (
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
                  <ButtonLink href="/login" variant="primary">
                    {plan.name.includes("Free") ? pricing.ctaFree : pricing.ctaSubscribe}
                  </ButtonLink>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </CartographySurface>
    </section>
  );
}
