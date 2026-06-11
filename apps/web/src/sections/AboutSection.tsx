import { Container, SectionHeader, Text } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/animations/use-section-reveal";
import { FullScreenSection } from "~/components/FullScreenSection";
import { PracticesAccordion } from "~/components/PracticesAccordion";
import { getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";
import { GeoCitationBlock } from "~/components/GeoCitationBlock";
import { FallingLeavesLayer } from "~/visual/FallingLeavesLayer";
import { TypeVine } from "~/visual/typography/TypeVine";

export interface AboutSectionProps {
  readonly locale: MarketingLocale;
}

export function AboutSection({ locale }: AboutSectionProps) {
  const { about, method } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");
  const vineWords = method.steps.map((step) => step.title.split(" ")[0] ?? step.title);

  return (
    <FullScreenSection id="about" className="editorial-rule relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_55%,color-mix(in_srgb,var(--color-moss)_14%,transparent),transparent)]"
      />
      <FallingLeavesLayer density="sparse" className="z-[2]" />

      <Container ref={sectionRef} className="relative z-[3]">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div className="space-y-8" data-section-item>
            <SectionHeader
              eyebrow={about.eyebrow}
              title={about.title}
              highlight={about.highlight}
              className="mb-8 md:mb-10"
            />

            <div className="space-y-3">
              <Text as="p" variant="meta" className="text-moss">
                {method.eyebrow}
              </Text>
              <TypeVine words={vineWords} className="max-w-2xl" />
            </div>

            <GeoCitationBlock locale={locale} />
            <Text as="p" variant="body-lg" className="max-w-xl text-muted">
              {about.intro}
            </Text>
            <Text as="p" variant="body" className="max-w-xl text-muted">
              {about.detail}
            </Text>
          </div>

          <div data-section-item>
            <PracticesAccordion steps={method.steps} />
          </div>
        </div>
      </Container>
    </FullScreenSection>
  );
}
