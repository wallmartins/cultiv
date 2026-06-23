import {
  ButtonLink,
  CartographySurface,
  CoordinateLabel,
  Container,
  Text,
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
  const plan = pricing.plans[0];

  if (!plan) {
    return null;
  }

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

          <article
            className="mx-auto max-w-md rounded-[5px] border-double-cartography bg-off-white p-6 shadow-cartography md:p-8"
            data-section-item
          >
            <Text
              as="p"
              variant="mono"
              className="mb-5 text-center uppercase tracking-widest"
            >
              {plan.name}
            </Text>

            <Text as="p" variant="body" className="mb-6 text-ink-muted">
              {plan.description}
            </Text>

            <ul className="mb-8 space-y-3">
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

            <div className="border-t border-dotted-cartography pt-6">
              <Text as="p" variant="mono" className="mb-5 text-ink-muted">
                {plan.footer}
              </Text>
              <ButtonLink href="#waitlist" variant="primary" className="w-full">
                {pricing.cta}
              </ButtonLink>
            </div>
          </article>
        </Container>
      </CartographySurface>
    </section>
  );
}
