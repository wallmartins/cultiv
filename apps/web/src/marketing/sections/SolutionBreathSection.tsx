import { useRef } from "react";
import { useMobileBreathBeatsReveal } from "~/marketing/animations/use-mobile-breath-beats-reveal";
import { SolutionBreathScrolly } from "~/marketing/components/SolutionBreathScrolly";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface SolutionBreathSectionProps {
  readonly locale: MarketingLocale;
}

export function SolutionBreathSection({ locale }: SolutionBreathSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { solutionBreath, header } = getLocaleMessages(locale);

  useMobileBreathBeatsReveal(sectionRef);

  return (
    <section
      ref={sectionRef}
      id="solucao"
      className="solution-breath-section bg-showcase text-showcase-foreground"
    >
      <SolutionBreathScrolly brand={header.brand} copy={solutionBreath} />
    </section>
  );
}
