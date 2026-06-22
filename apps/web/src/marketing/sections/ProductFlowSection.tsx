import { Container, SectionHeader, Text } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { FullScreenSection } from "~/marketing/components/FullScreenSection";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface ProductFlowSectionProps {
  readonly locale: MarketingLocale;
}

export function ProductFlowSection({ locale }: ProductFlowSectionProps) {
  const { productFlow } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <FullScreenSection
      id="fluxo"
      className="imprint-grain bg-paper press-edge border-t border-ink-ghost"
    >
      <Container ref={sectionRef}>
        <div data-section-item>
          <SectionHeader
            eyebrow={productFlow.eyebrow}
            title={productFlow.title}
            className="mb-8 md:mb-12"
          />
        </div>
        <div
          data-section-item
          className="grid gap-0 border border-ink-ghost md:grid-cols-5"
        >
          {productFlow.steps.map((step, index) => (
            <article
              key={step.index}
              className="flex flex-col gap-4 border-b border-ink-ghost p-6 last:border-b-0 md:border-r md:border-b-0 md:p-8 md:last:border-r-0"
            >
              <Text as="p" variant="mono" className="text-pigment-indigo">
                [{step.index}]
              </Text>
              <Text as="h3" variant="heading" className="text-ink">
                {step.title}
              </Text>
              <Text as="p" variant="body" className="text-ink-muted">
                {step.body}
              </Text>
              {index === productFlow.steps.length - 1 ? (
                <Text as="p" variant="caption" className="mt-auto text-pigment-terracotta">
                  {productFlow.outputLabel}
                </Text>
              ) : null}
            </article>
          ))}
        </div>
      </Container>
    </FullScreenSection>
  );
}
