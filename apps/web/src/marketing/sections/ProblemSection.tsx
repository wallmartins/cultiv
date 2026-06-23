import { Container } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { SectionHeader } from "~/marketing/components/icons";

export interface ProblemSectionProps {
  readonly locale: MarketingLocale;
}

export function ProblemSection({ locale }: ProblemSectionProps) {
  const { territory } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <section
      id="territorio"
      className="relative overflow-hidden bg-offwhite border-b border-borda/15 py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
    >
      <Container ref={sectionRef} className="relative z-10">
        <SectionHeader eyebrow={territory.eyebrow} title={territory.title} />

        <div className="grid gap-6 md:grid-cols-3" data-section-item>
          {territory.cards.map((card, index) => (
            <div
              key={index}
              className="rebrand-hover group relative rounded-sm border border-borda/25 bg-creme p-6 md:p-8 shadow-[3px_3px_0px_rgba(26,46,60,0.08)] transition-all duration-300"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-terracota/30 bg-terracota/5">
                <span className="font-caveat text-lg text-terracota">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-playfair text-lg font-semibold text-azul mb-3">
                {card.title}
              </h3>
              <p className="font-inter text-sm leading-relaxed text-texto-sec">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
