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
import { HeroComparisonFrame } from "~/marketing/visual/HeroComparisonFrame";

const heroCoordinateLabels: Record<MarketingLocale, string> = {
  pt: "Entrada",
  en: "Entry",
};

export interface HeroSectionProps {
  readonly locale: MarketingLocale;
}

export function HeroSection({ locale }: HeroSectionProps) {
  const messages = getLocaleMessages(locale);
  const { hero } = messages;
  const sectionRef = useSectionReveal("[data-hero-item]");

  return (
    <section id="hero" className="border-b border-ink-ghost/30">
      <CartographySurface className="min-h-hero-viewport">
      <Container
        ref={sectionRef}
        className="flex flex-col justify-center py-[var(--spacing-section-sm)] lg:py-[var(--spacing-section)]"
      >
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div data-hero-item>
              <CoordinateLabel index={0} label={heroCoordinateLabels[locale]} />
            </div>

            <div data-hero-item>
              <span
                className={cn(
                  "inline-block rounded-[5px] border-dotted-cartography bg-off-white px-3 py-1.5",
                  "ui-type-mono text-[0.6875rem] uppercase tracking-widest text-ink-muted"
                )}
              >
                {hero.badge}
              </span>
            </div>

            <Text
              as="h1"
              variant="display-xl"
              data-hero-item
              className="text-deep-blue"
            >
              {hero.headline}
            </Text>

            <Text
              as="p"
              variant="body-lg"
              data-hero-item
              className="max-w-xl text-ink-muted"
            >
              {hero.subheadline}
            </Text>

            <div
              data-hero-item
              className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center"
            >
              <ButtonLink href="#waitlist">{hero.ctaPrimary}</ButtonLink>
              <ButtonLink href="#rota" variant="ghost">
                {hero.ctaSecondary}
              </ButtonLink>
            </div>
          </div>

          <div data-hero-item className="lg:col-span-7 lg:pl-4">
            <HeroComparisonFrame messages={hero} />
          </div>
        </div>
      </Container>
      </CartographySurface>
    </section>
  );
}
