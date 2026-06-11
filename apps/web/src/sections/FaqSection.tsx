import { Accordion, Container, SectionHeader } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/animations/use-section-reveal";
import { FullScreenSection } from "~/components/FullScreenSection";
import { FallingLeavesLayer } from "~/visual/FallingLeavesLayer";
import { getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";

export interface FaqSectionProps {
  readonly locale: MarketingLocale;
}

export function FaqSection({ locale }: FaqSectionProps) {
  const { faq } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <FullScreenSection id="faq" className="editorial-rule relative overflow-hidden">
      <FallingLeavesLayer density="whisper" className="z-[2]" />
      <Container ref={sectionRef} className="relative z-[3]">
        <div data-section-item>
          <SectionHeader eyebrow={faq.eyebrow} title={faq.title} description={faq.description} />
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
    </FullScreenSection>
  );
}
