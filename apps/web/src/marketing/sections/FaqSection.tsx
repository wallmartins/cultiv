import {
  Accordion,
  CartographySurface,
  CoordinateLabel,
  Container,
  Text,
} from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface FaqSectionProps {
  readonly locale: MarketingLocale;
}

export function FaqSection({ locale }: FaqSectionProps) {
  const { faq } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <section id="perguntas" className="border-b border-ink-ghost/30">
      <CartographySurface className="bg-off-white">
        <Container
          ref={sectionRef}
          className="py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
        >
          <header
            className="mx-auto mb-10 max-w-3xl text-center md:mb-14"
            data-section-item
          >
            <CoordinateLabel
              index={7}
              label={faq.eyebrow}
              className="mb-4 block"
            />
            <Text as="h2" variant="display" className="text-deep-blue">
              {faq.title}
            </Text>
          </header>

          <div className="mx-auto max-w-2xl" data-section-item>
            <Accordion
              items={faq.items.map((item) => ({
                id: item.id,
                question: item.question,
                answer: item.answer,
              }))}
            />
          </div>
        </Container>
      </CartographySurface>
    </section>
  );
}
