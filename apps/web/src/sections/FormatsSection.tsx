import { Container, SectionHeader, Text } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/animations/use-section-reveal";
import { FullScreenSection } from "~/components/FullScreenSection";
import { getMarketingContentTypes } from "~/content/content-types/catalog";
import { getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";
import { FallingLeavesLayer } from "~/visual/FallingLeavesLayer";
import { StampBadge } from "~/visual/typography/StampBadge";

export interface FormatsSectionProps {
  readonly locale: MarketingLocale;
}

export function FormatsSection({ locale }: FormatsSectionProps) {
  const { formats } = getLocaleMessages(locale);
  const contentTypes = getMarketingContentTypes(locale, formats.types);
  const sectionRef = useSectionReveal("[data-format-item]");

  return (
    <FullScreenSection id="formats" className="editorial-rule organic-glow relative overflow-hidden">
      <FallingLeavesLayer density="sparse" className="z-[2]" />
      <Container ref={sectionRef} className="relative z-[3]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6" data-format-item>
          <SectionHeader
            eyebrow={formats.eyebrow}
            title={formats.title}
            description={formats.description}
            className="mb-0"
          />
          <StampBadge label={formats.stampLabel} value={formats.stampValue} />
        </div>

        <div className="grid gap-0 border border-foreground md:grid-cols-2 lg:grid-cols-3">
          {contentTypes.map((contentType, index) => (
            <article
              key={contentType.id}
              data-format-item
              className="flex min-h-44 flex-col justify-between border-b border-foreground p-6 md:border-r md:p-8 lg:min-h-52 [&:nth-child(2n)]:md:border-r-0 [&:nth-child(3n)]:lg:border-r-0"
            >
              <div className="space-y-3">
                <Text as="p" variant="meta">
                  [{String(index + 1).padStart(2, "0")}]
                </Text>
                <Text as="h3" variant="h3" className="text-lg md:text-xl">
                  {contentType.label}
                </Text>
                <Text as="p" variant="body" className="text-muted">
                  {contentType.description}
                </Text>
              </div>
              <Text as="p" variant="mono" className="mt-6">
                {contentType.id}
              </Text>
            </article>
          ))}
        </div>

        <Text as="p" variant="body-lg" className="mt-10 max-w-3xl text-muted" data-format-item>
          {formats.note}
        </Text>
      </Container>
    </FullScreenSection>
  );
}
