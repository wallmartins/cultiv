import { ButtonLink, Text } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/animations/use-section-reveal";
import { useDrawStroke } from "~/animations/use-draw-stroke";
import { useBotanicalUpright } from "~/animations/use-botanical-upright";
import { getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";
import { FallingLeavesLayer } from "~/visual/FallingLeavesLayer";
import { IllustrationFrame } from "~/visual/IllustrationFrame";
import { BotanicalTree } from "~/visual/illustrations/BotanicalTree";
import { WordReveal } from "~/visual/typography/WordReveal";

export interface HeroSectionProps {
  readonly locale: MarketingLocale;
}

export function HeroSection({ locale }: HeroSectionProps) {
  const { hero } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-hero-item]");
  const drawRef = useDrawStroke<HTMLDivElement>();
  const uprightRef = useBotanicalUpright<HTMLDivElement>();

  return (
    <section
      id="hero"
      className="organic-glow-hero relative isolate h-hero-viewport overflow-hidden"
    >
      <IllustrationFrame
        ref={(node) => {
          drawRef.current = node;
          uprightRef.current = node;
        }}
        grain={false}
        className="hero-tree-layer absolute bottom-[-8%] left-1/2 z-0 h-[112%] w-[min(92vw,40rem)] -translate-x-1/2 text-moss opacity-[0.44] sm:opacity-[0.48] md:bottom-[-6%] md:h-[108%] md:w-[min(78vw,44rem)] md:opacity-[0.52]"
      >
        <BotanicalTree className="h-full w-full" />
      </IllustrationFrame>

      <FallingLeavesLayer density="hero" className="z-[3]" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_52%_58%_at_50%_44%,color-mix(in_srgb,var(--color-surface)_68%,transparent),color-mix(in_srgb,var(--color-surface)_32%,transparent)_62%,transparent_100%)]"
      />

      <div
        ref={sectionRef}
        className="relative z-10 mx-auto flex h-full w-full max-w-6xl items-center justify-center px-[var(--spacing-gutter)] lg:max-w-7xl"
      >
        <div className="flex w-full max-w-4xl flex-col items-center text-center">
          <WordReveal
            text={hero.headline}
            as="h1"
            className="mx-auto w-full text-center font-handwritten text-[clamp(2.5rem,8vw,5.25rem)] font-medium leading-[1.02] tracking-handwritten text-foreground"
          />

          <Text
            as="p"
            variant="body-lg"
            data-hero-item
            className="mx-auto mt-6 max-w-xl text-center text-muted md:mt-8"
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
              className="motion-hover font-body text-[0.6875rem] font-semibold uppercase tracking-editorial-wide text-moss hover:text-foreground"
            >
              {hero.ctaSecondary} →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
