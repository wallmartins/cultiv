import {
  CartographySurface,
  Container,
  CoordinateLabel,
  Text,
} from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { defaultCurrencyForLocale } from "~/marketing/auth/marketing-auth-intent";
import { MarketingConversionLink } from "~/marketing/components/MarketingConversionLink";

export interface LaunchCtaSectionProps {
  readonly locale: MarketingLocale;
}

export function LaunchCtaSection({ locale }: LaunchCtaSectionProps) {
  const { launchCta } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <section id="comecar" className="border-b border-deep-blue/20">
      <CartographySurface className="bg-deep-blue text-cream">
        <Container
          ref={sectionRef}
          className="py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
        >
          <header
            className="mx-auto mb-10 max-w-2xl text-center md:mb-14"
            data-section-item
          >
            <CoordinateLabel
              index={8}
              label={launchCta.eyebrow}
              className="mb-4 block text-cream/60"
            />
            <Text as="h2" variant="display" className="text-cream">
              {launchCta.title}
            </Text>
            <Text as="p" variant="body" className="mt-4 text-cream/70">
              {launchCta.description}
            </Text>
          </header>

          <div className="mx-auto flex max-w-md justify-center" data-section-item>
            <MarketingConversionLink
              intent={{
                plan: "free",
                currency: defaultCurrencyForLocale(locale),
                period: "monthly",
              }}
              className="w-full sm:w-auto"
            >
              {launchCta.ctaPrimary}
            </MarketingConversionLink>
          </div>
        </Container>
      </CartographySurface>
    </section>
  );
}
