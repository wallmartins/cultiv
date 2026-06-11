import { Container, Text } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/animations/use-section-reveal";
import { WaitlistForm } from "~/components/WaitlistForm";
import { getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";
import { StampBadge } from "~/visual/typography/StampBadge";

export interface WaitlistSectionProps {
  readonly locale: MarketingLocale;
}

export function WaitlistSection({ locale }: WaitlistSectionProps) {
  const { waitlist } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");
  const [titleLine1, titleLine2] = waitlist.titleLines;

  return (
    <section
      id="waitlist"
      className="editorial-rule relative overflow-hidden bg-invert py-[var(--spacing-section)] text-invert-foreground md:py-24"
    >
      <div
        aria-hidden
        className="organic-glow-invert pointer-events-none absolute inset-0"
      />

      <Container ref={sectionRef} className="relative w-full">
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
