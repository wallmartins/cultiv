import { Accordion, Container, PaperSurface, SectionHeader } from "@my-ai-orchestrator/ui";
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
    <PaperSurface
      id="faq"
      className="border-t border-ink-ghost pt-[var(--spacing-section-sm)] pb-[calc(var(--spacing-section-sm)+2rem)] md:pt-[var(--spacing-section)] md:pb-[calc(var(--spacing-section)+2.5rem)]"
    >
      <Container ref={sectionRef}>
        <div data-section-item>
          <SectionHeader
            eyebrow={faq.eyebrow}
            title={faq.title}
            description={faq.description}
            className="mb-8 md:mb-10"
          />
        </div>
        <div data-section-item>
          <Accordion
            items={faq.items.map((item) => ({
              id: item.id,
              question: item.question,
              answer: item.answer
            }))}
          />
        </div>
      </Container>
    </PaperSurface>
  );
}
