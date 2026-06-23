import { Container } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getMarketingContentTypes } from "~/marketing/content/content-types/catalog";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { CompassRose, SectionHeader } from "~/marketing/components/icons";

export interface FormatsSectionProps {
  readonly locale: MarketingLocale;
}

export function FormatsSection({ locale }: FormatsSectionProps) {
  const messages = getLocaleMessages(locale);
  const { tools, contentTypes } = messages;
  const formats = getMarketingContentTypes(locale, contentTypes);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <section
      id="ferramentas"
      className="relative overflow-hidden bg-creme border-b border-borda/15 py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
    >
      <div className="rebrand-vignette absolute inset-0 pointer-events-none" />

      <Container ref={sectionRef} className="relative z-10">
        <SectionHeader
          eyebrow={tools.eyebrow}
          title={tools.title}
          description={tools.subtitle}
        />

        <div className="relative mx-auto max-w-5xl" data-section-item>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {formats.map((format, index) => (
              <div
                key={format.id}
                className={`rebrand-hover group relative rounded-sm border border-borda/20 bg-offwhite p-5 shadow-[3px_3px_0px_rgba(26,46,60,0.06)] transition-all duration-300 ${
                  index === 0 ? "sm:col-span-2 lg:col-span-1 lg:row-span-1" : ""
                }`}
              >
                <span className="mb-3 block font-mono text-[0.65rem] font-medium uppercase tracking-widest text-azul/50">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-playfair text-base font-semibold text-azul mb-2">
                  {format.label}
                </h3>
                <p className="font-inter text-sm leading-relaxed text-texto-sec">
                  {format.description}
                </p>
              </div>
            ))}
          </div>

          <CompassRose className="absolute -top-4 -right-4 h-16 w-16 text-azul/8 pointer-events-none hidden lg:block" />
        </div>
      </Container>
    </section>
  );
}
