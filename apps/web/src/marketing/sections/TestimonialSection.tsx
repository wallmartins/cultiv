import { Container } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { QuoteIcon } from "~/marketing/components/icons";

export interface TestimonialSectionProps {
  readonly locale: MarketingLocale;
}

export function TestimonialSection({ locale }: TestimonialSectionProps) {
  const { testimonial } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <section className="relative overflow-hidden bg-offwhite border-b border-borda/15 py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]">
      <Container ref={sectionRef} className="relative z-10">
        <div className="mx-auto max-w-2xl text-center" data-section-item>
          <QuoteIcon className="mx-auto mb-6 text-terracota/30" />

          <blockquote className="font-playfair text-[clamp(1.25rem,3vw,1.75rem)] font-medium leading-snug text-azul mb-6">
            {testimonial.quote}
          </blockquote>

          <p className="font-caveat text-base text-terracota/70">
            {testimonial.ps}
          </p>
        </div>
      </Container>
    </section>
  );
}
