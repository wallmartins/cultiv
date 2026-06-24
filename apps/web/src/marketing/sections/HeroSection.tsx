import { Fragment } from "react";
import {
  ButtonLink,
  CartographySurface,
  CoordinateLabel,
  Container,
  Text,
  cn,
} from "@my-ai-orchestrator/ui";
import { useHeroHeadlineWords } from "~/marketing/animations/use-hero-headline-words";
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

function HeroHeadline({ text }: { readonly text: string }) {
  const headlineRef = useHeroHeadlineWords();
  const words = text.split(/\s+/);

  return (
    <h1
      ref={headlineRef}
      className={cn("ui-type-display-xl text-deep-blue")}
    >
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          {index > 0 ? " " : null}
          <span data-hero-word className="inline-block">
            {word}
          </span>
        </Fragment>
      ))}
    </h1>
  );
}

export function HeroSection({ locale }: HeroSectionProps) {
  const messages = getLocaleMessages(locale);
  const { hero } = messages;
  const sectionRef = useSectionReveal("[data-hero-item]");

  return (
    <section id="hero" className="border-b border-ink-ghost/30">
      <CartographySurface className="min-h-hero-viewport [&>div]:flex [&>div]:min-h-[inherit] [&>div]:items-center">
      <Container
        ref={sectionRef}
        className="w-full px-[clamp(1.75rem,5.5vw,4rem)] py-6 md:py-10"
      >
        <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-2 lg:gap-10 xl:max-w-[68rem]">
          <div className="flex flex-col gap-5">
            <div
              data-hero-item
              className="flex flex-wrap items-baseline gap-x-4 gap-y-2"
            >
              <CoordinateLabel index={0} label={heroCoordinateLabels[locale]} />
              <span
                className={cn(
                  "inline-block rounded-[5px] border-dotted-cartography bg-off-white px-3 py-1.5",
                  "ui-type-mono text-[0.6875rem] uppercase tracking-widest text-ink-muted"
                )}
              >
                {hero.badge}
              </span>
            </div>

            <HeroHeadline text={hero.headline} />

            <Text
              as="p"
              variant="body-lg"
              data-hero-item
              className="max-w-lg text-ink-muted"
            >
              {hero.subheadline}
            </Text>

            <div
              data-hero-item
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <ButtonLink href="#waitlist">{hero.ctaPrimary}</ButtonLink>
              <ButtonLink href="#rota" variant="ghost">
                {hero.ctaSecondary}
              </ButtonLink>
            </div>
          </div>

          <div data-hero-item className="w-full">
            <HeroComparisonFrame messages={hero} />
          </div>
        </div>
      </Container>
      </CartographySurface>
    </section>
  );
}
