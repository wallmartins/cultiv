import { Container } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { MapPinIcon, SectionHeader } from "~/marketing/components/icons";

export interface HowItWorksSectionProps {
  readonly locale: MarketingLocale;
}

export function HowItWorksSection({ locale }: HowItWorksSectionProps) {
  const { route } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <section
      id="rota"
      className="relative overflow-hidden bg-creme border-b border-borda/15 py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
    >
      <Container ref={sectionRef} className="relative z-10">
        <SectionHeader eyebrow={route.eyebrow} title={route.title} />

        <div className="relative mx-auto max-w-3xl">
          <div className="absolute left-[1.05rem] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-terracota/25 to-transparent md:left-1/2 md:-translate-x-px" />

          <div className="space-y-8 md:space-y-0">
            {route.steps.map((step, index) => (
              <div
                key={step.index}
                data-section-item
                className={`relative flex items-start gap-6 md:gap-0 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-terracota/40 bg-creme font-mono text-xs font-semibold text-terracota">
                  {step.index}
                </div>

                <div
                  className={`flex-1 md:w-1/2 ${
                    index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"
                  }`}
                >
                  <div className="rebrand-hover rounded-sm border border-borda/20 bg-offwhite p-5 shadow-[3px_3px_0px_rgba(26,46,60,0.06)]">
                    <div className="mb-2 flex items-center gap-2 md:justify-end" style={index % 2 !== 0 ? { justifyContent: "flex-start" } : undefined}>
                      <MapPinIcon className="h-4 w-4 text-terracota/60" />
                      <h3 className="font-playfair text-base font-semibold text-azul">
                        {step.title}
                      </h3>
                    </div>
                    <p className="font-inter text-sm leading-relaxed text-texto-sec">
                      {step.body}
                    </p>
                  </div>
                </div>

                <div className="hidden md:block md:w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
