import {
  CartographySurface,
  CoordinateLabel,
  Container,
  Text,
} from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { ComparisonFrame } from "~/marketing/visual/ComparisonFrame";

export interface ComparisonSectionProps {
  readonly locale: MarketingLocale;
}

export function ComparisonSection({ locale }: ComparisonSectionProps) {
  const { comparison } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <section id="comparacao" className="border-b border-ink-ghost/30">
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
              index={4}
              label={comparison.eyebrow}
              className="mb-4 block"
            />
            <Text as="h2" variant="display" className="text-deep-blue">
              {comparison.title}
            </Text>
          </header>

          <div className="mx-auto max-w-4xl space-y-10 md:space-y-12" data-section-item>
            <ComparisonFrame
              idPrefix="comparison"
              messages={{
                comparisonLabel: comparison.comparisonLabel,
                genericLabel: comparison.genericLabel,
                voiceLabel: comparison.voiceLabel,
                genericLine1: comparison.genericLine1,
                genericLine2: comparison.genericLine2,
                voiceLine1: comparison.voiceLine1,
                voiceLine2: comparison.voiceLine2,
                genericNote: comparison.genericNote,
                voiceNote: comparison.voiceNote,
              }}
            />

            <div className="text-center">
              <Text as="p" variant="display-sm" className="mb-3 text-deep-blue">
                {comparison.verdict}
              </Text>
              <Text as="p" variant="margem" className="text-terracotta">
                {comparison.signature}
              </Text>
            </div>
          </div>
        </Container>
      </CartographySurface>
    </section>
  );
}
