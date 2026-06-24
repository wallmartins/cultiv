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
          className="py-16 md:py-24 lg:py-28"
        >
          <figure className="mx-auto max-w-5xl text-center" data-section-item>
            <Text
              as="blockquote"
              variant="display-xl"
              className="text-balance italic text-deep-blue text-[clamp(2.1rem,5.6vw,3.5rem)] leading-[1.1] tracking-[-0.03em]"
            >
              &ldquo;{testimonial.quote}&rdquo;
            </Text>
            <Text
              as="figcaption"
              variant="margem"
              className="mt-8 block text-right text-[clamp(1.125rem,2.5vw,1.5rem)] text-terracotta"
            >
              {testimonial.ps}
            </Text>
          </figure>
        </Container>
      </CartographySurface>
    </section>
  );
}
