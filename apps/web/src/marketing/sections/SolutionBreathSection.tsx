import { useRef } from "react";
import { Text } from "@my-ai-orchestrator/ui";
import { useMobileBreathBeatsReveal } from "~/marketing/animations/use-mobile-breath-beats-reveal";
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
      <div
        data-section-item
        className="mx-auto max-w-4xl space-y-8 px-[var(--spacing-gutter)] py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
      >
        <div className="space-y-4">
          <Text as="p" variant="body-lg" className="text-showcase-accent">
            {solutionBreath.handwrittenNote}
          </Text>
          <Text as="p" variant="display-sm" className="text-showcase-foreground">
            {header.brand}
          </Text>
        </div>
        <ul className="space-y-4">
          {solutionBreath.keywords.map((keyword) => (
            <li key={keyword.phrase}>
              <Text as="p" variant="heading" className="text-showcase-foreground">
                {keyword.phrase}
              </Text>
              <Text as="p" variant="body" className="text-showcase-muted">
                {keyword.microcopy}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
