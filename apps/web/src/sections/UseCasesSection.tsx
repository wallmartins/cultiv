import { Container, SectionHeader, Text } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/animations/use-section-reveal";
import { FullScreenSection } from "~/components/FullScreenSection";
import { getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";

export interface UseCasesSectionProps {
  readonly locale: MarketingLocale;
}

export function UseCasesSection({ locale }: UseCasesSectionProps) {
  const { useCases } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <FullScreenSection id="casos-de-uso" className="editorial-rule">
      <Container ref={sectionRef}>
        <div data-section-item>
          <SectionHeader
            eyebrow={useCases.eyebrow}
            title={useCases.title}
            className="mb-10 md:mb-12"
          />
        </div>
        <div className="grid gap-0 border border-foreground md:grid-cols-3">
          {useCases.cases.map((useCase, index) => (
            <article
              key={useCase.title}
              data-section-item
              className="group flex min-h-52 flex-col justify-between border-b border-foreground p-6 md:border-r md:p-8 lg:min-h-56 [&:nth-child(3n)]:md:border-r-0"
            >
              <div className="space-y-4">
                <Text as="p" variant="meta" className="text-moss">
                  {useCase.badge}
                </Text>
                <Text
                  as="h3"
                  variant="h3"
                  className="text-lg transition-colors group-hover:text-moss md:text-xl"
                >
                  {useCase.title}
                </Text>
                <Text as="p" variant="body" className="text-muted">
                  {useCase.body}
                </Text>
              </div>
              <Text as="p" variant="mono" className="mt-6 opacity-60">
                [{String(index + 1).padStart(2, "0")}]
              </Text>
            </article>
          ))}
        </div>
        <Text as="p" variant="body" className="mt-8 text-muted" data-section-item>
          {useCases.footnote}
        </Text>
      </Container>
    </FullScreenSection>
  );
}
