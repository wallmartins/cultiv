import { Container, SectionHeader, Text } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { WaitlistForm } from "~/marketing/components/WaitlistForm";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { StampBadge } from "~/marketing/visual/typography/StampBadge";

export interface WaitlistSectionProps {
  readonly locale: MarketingLocale;
}

export function WaitlistSection({ locale }: WaitlistSectionProps) {
  const { socialProof, waitlist } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");
  const [titleLine1, titleLine2] = waitlist.titleLines;

  return (
    <section
      id="waitlist"
      className="editorial-rule relative flex min-h-svh flex-col overflow-hidden bg-invert text-invert-foreground"
    >
      <div
        aria-hidden
        className="organic-glow-invert pointer-events-none absolute inset-0"
      />

      <Container
        ref={sectionRef}
        className="relative z-[3] flex w-full flex-1 flex-col justify-center py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
      >
        <div id="comunidade" data-section-item className="mx-auto max-w-2xl text-center">
          <SectionHeader
            invert
            eyebrow={socialProof.eyebrow}
            title={socialProof.title}
            description={socialProof.body}
            className="mx-auto mb-0 text-center md:mb-0"
          />
        </div>

        <div
          aria-hidden
          className="mx-auto my-10 h-px w-full max-w-xs bg-gradient-to-r from-transparent via-golden/45 to-transparent md:my-14"
        />

        <div className="grid items-start gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20 xl:gap-24">
          <div data-section-item className="space-y-12 lg:pr-6">
            <header className="max-w-5xl space-y-7 md:space-y-8">
              <Text as="p" variant="meta" className="text-showcase-muted">
                {waitlist.eyebrow}
              </Text>
              <div className="space-y-4 md:space-y-5">
                <Text
                  as="h2"
                  variant="chapter"
                  className="max-w-5xl text-showcase-foreground leading-[1.02]"
                >
                  {titleLine1}
                </Text>
                <Text
                  as="p"
                  variant="chapter"
                  className="max-w-5xl text-showcase-foreground leading-[1.02]"
                >
                  {titleLine2}
                </Text>
              </div>
              <Text
                as="p"
                variant="body-lg"
                className="max-w-2xl pt-1 text-showcase-muted leading-[1.85] md:pt-2"
              >
                {waitlist.description}
              </Text>
            </header>
            <StampBadge label={waitlist.stampLabel} value={waitlist.stampValue} />
          </div>

          <div data-section-item className="relative lg:pt-2">
            <div
              aria-hidden
              className="absolute top-3 bottom-3 left-0 hidden w-px bg-gradient-to-b from-transparent via-golden/50 to-transparent lg:block"
            />
            <WaitlistForm locale={locale} copy={waitlist} />
          </div>
        </div>
      </Container>
    </section>
  );
}
