import {
  CartographySurface,
  Container,
  Text,
} from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface TestimonialSectionProps {
  readonly locale: MarketingLocale;
}

export function TestimonialSection({ locale }: TestimonialSectionProps) {
  const { testimonial } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <section id="depoimento" className="border-b border-ink-ghost/30">
      <CartographySurface className="bg-off-white">
        <Container
          ref={sectionRef}
          className="py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
        >
          <figure className="mx-auto max-w-[640px] text-center" data-section-item>
            <Text
              as="blockquote"
              variant="display-sm"
              className="italic text-deep-blue"
            >
              &ldquo;{testimonial.quote}&rdquo;
            </Text>
            <Text
              as="figcaption"
              variant="margem"
              className="mt-6 block text-right text-terracotta"
            >
              {testimonial.ps}
            </Text>
          </figure>
        </Container>
      </CartographySurface>
    </section>
  );
}
