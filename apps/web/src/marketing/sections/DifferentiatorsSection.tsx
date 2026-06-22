import { Container, PaperSurface, PressMark, SectionHeader, Text } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { ShowcaseTeaserPanel } from "~/marketing/components/differentiators/ShowcaseTeaserPanel";
import { getLinkedInShowcaseSample } from "~/marketing/content/showcase/get-linkedin-sample";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface DifferentiatorsSectionProps {
  readonly locale: MarketingLocale;
}

export function DifferentiatorsSection({ locale }: DifferentiatorsSectionProps) {
  const messages = getLocaleMessages(locale);
  const { differentiators, showcase } = messages;
  const linkedInSample = getLinkedInShowcaseSample(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <PaperSurface
      id="diferenciais"
      className="border-t border-ink-ghost py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
    >
      <Container ref={sectionRef} className="space-y-12">
        <div data-section-item>
          <SectionHeader
            eyebrow={differentiators.eyebrow}
            title={differentiators.title}
            className="mb-0"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {differentiators.chapters.map((chapter, chapterIndex) => (
            <article
              key={chapter.index}
              data-section-item
              className="press-edge flex flex-col gap-5 border border-ink-ghost bg-paper-elevated p-6 md:p-8"
            >
              {chapterIndex === 0 ? <PressMark size={40} className="text-ink" /> : null}
              <Text as="p" variant="meta" className="text-ink-muted">
                [{chapter.index}]
              </Text>
              <Text as="h3" variant="heading" className="text-ink">
                {chapter.title}
              </Text>
              <Text as="p" variant="body-lg" className="text-ink-muted">
                {chapter.body}
              </Text>
              {chapterIndex === 0 ? (
                <ShowcaseTeaserPanel sample={linkedInSample} showcase={showcase} />
              ) : null}
            </article>
          ))}
        </div>
      </Container>
    </PaperSurface>
  );
}
