import {
  ButtonLink,
  InkBleed,
  PaperSurface,
  PressMark,
  Text
} from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { useStampReveal } from "~/marketing/animations/use-stamp-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface HeroSectionProps {
  readonly locale: MarketingLocale;
}

export function HeroSection({ locale }: HeroSectionProps) {
  const { hero } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-hero-item]");
  const stampRef = useStampReveal<HTMLDivElement>();
  const heroTagline =
    "tagline" in hero && typeof hero.tagline === "string" ? hero.tagline : undefined;

  return (
    <PaperSurface
      id="hero"
      className="relative isolate flex h-hero-viewport items-center justify-center overflow-hidden"
    >
      <InkBleed />

      <div
        ref={sectionRef}
        className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-[var(--spacing-gutter)] text-center"
      >
        <div ref={stampRef} className="mb-8">
          <PressMark size={64} />
        </div>

        <Text as="h1" variant="display-xl" data-hero-item className="text-ink">
          {hero.headline}
        </Text>

        {heroTagline ? (
          <Text as="p" variant="imprint" data-hero-item className="mt-4 text-ink-muted">
            {heroTagline}
          </Text>
        ) : null}

        <Text
          as="p"
          variant="body-lg"
          data-hero-item
          className="mx-auto mt-6 max-w-xl text-ink-muted md:mt-8"
        >
          {hero.subheadline}
        </Text>

        <div
          data-hero-item
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center md:mt-12"
        >
          <ButtonLink href="#waitlist" variant="primary">
            {hero.ctaPrimary}
          </ButtonLink>
          <a
            href="#problema"
            className="motion-hover font-conducao text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-pigment-terracotta hover:text-ink"
          >
            {hero.ctaSecondary} →
          </a>
        </div>
      </div>
    </PaperSurface>
  );
}
