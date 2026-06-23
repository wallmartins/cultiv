import { Container } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { SectionHeader } from "~/marketing/components/icons";

export interface ComparisonSectionProps {
  readonly locale: MarketingLocale;
}

export function ComparisonSection({ locale }: ComparisonSectionProps) {
  const { comparison } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <section
      id="comparacao"
      className="relative overflow-hidden bg-creme border-b border-borda/15 py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
    >
      <Container ref={sectionRef} className="relative z-10">
        <SectionHeader eyebrow={comparison.eyebrow} title={comparison.title} />

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2" data-section-item>
          <div className="rebrand-border-double rounded-sm bg-offwhite p-6 md:p-8">
            <span className="block font-inter text-[0.65rem] font-semibold uppercase tracking-widest text-texto-sec mb-4">
              {comparison.genericLabel}
            </span>
            <div className="space-y-3 border-l-2 border-borda/30 pl-4">
              <p className="font-inter text-sm leading-relaxed text-texto-sec/60 italic">
                {comparison.genericLine1}
              </p>
              <p className="font-inter text-sm leading-relaxed text-texto-sec/60 italic">
                {comparison.genericLine2}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-borda/15">
              <span className="font-caveat text-sm text-borda">
                {comparison.genericNote}
              </span>
            </div>
          </div>

          <div className="rebrand-border-double rounded-sm bg-offwhite p-6 md:p-8 border-terracota/30 shadow-[4px_4px_0px_rgba(181,90,59,0.1)]">
            <span className="block font-inter text-[0.65rem] font-semibold uppercase tracking-widest text-terracota mb-4">
              {comparison.voiceLabel}
            </span>
            <div className="space-y-3 border-l-2 border-terracota/40 pl-4">
              <p className="font-inter text-sm leading-relaxed text-texto">
                {comparison.voiceLine1}
              </p>
              <p className="font-inter text-sm leading-relaxed text-texto">
                {comparison.voiceLine2}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-terracota/15">
              <span className="font-caveat text-sm text-terracota">
                {comparison.voiceNote}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl mt-12 text-center" data-section-item>
          <p className="font-playfair text-lg italic text-azul mb-3">
            {comparison.verdict}
          </p>
          <p className="font-caveat text-base text-terracota/70">
            {comparison.signature}
          </p>
        </div>
      </Container>
    </section>
  );
}
