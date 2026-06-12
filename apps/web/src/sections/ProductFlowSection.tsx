import { Container, SectionHeader } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/animations/use-section-reveal";
import { FullScreenSection } from "~/components/FullScreenSection";
import { VoiceRootTimeline } from "~/components/VoiceRootTimeline";
import { getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";

export interface ProductFlowSectionProps {
  readonly locale: MarketingLocale;
}

export function ProductFlowSection({ locale }: ProductFlowSectionProps) {
  const { productFlow } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <FullScreenSection id="fluxo" className="editorial-rule">
      <Container ref={sectionRef}>
        <div data-section-item>
          <SectionHeader
            eyebrow={productFlow.eyebrow}
            title={productFlow.title}
            className="mb-8 md:mb-12"
          />
        </div>
      </Container>
      <div data-section-item className="w-full px-[var(--spacing-gutter)]">
        <VoiceRootTimeline outputLabel={productFlow.outputLabel} steps={productFlow.steps} />
      </div>
    </FullScreenSection>
  );
}
