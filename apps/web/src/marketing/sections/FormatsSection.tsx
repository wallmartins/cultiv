import { Container } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { CompassRose, SectionHeader, intentionIcons } from "~/marketing/components/icons";

export interface FormatsSectionProps {
  readonly locale: MarketingLocale;
}

export function FormatsSection({ locale }: FormatsSectionProps) {
  const { tools } = getLocaleMessages(locale);
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

        <div className="relative mx-auto max-w-5xl">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-terracota/20 via-terracota/10 to-transparent md:left-1/2 md:-translate-x-px" />

          <div className="space-y-16 md:space-y-20">
            <div data-section-item className="relative">
              <div className="flex items-center gap-3 mb-6 md:justify-center">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-terracota/40 bg-creme font-mono text-xs font-bold text-terracota shadow-[2px_2px_0px_rgba(181,90,59,0.1)]">
                  01
                </div>
                <div>
                  <span className="block font-inter text-[0.6rem] font-semibold uppercase tracking-widest text-terracota/60">
                    {tools.step1Label}
                  </span>
                  <span className="block font-playfair text-lg font-semibold text-azul">
                    {tools.step1Title}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:pl-16">
                {tools.intentions.map((intention, index) => (
                  <div
                    key={index}
                    className="rebrand-hover group relative rounded-sm border border-borda/20 bg-offwhite p-5 shadow-[3px_3px_0px_rgba(26,46,60,0.06)] transition-all duration-300"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-sm border border-azul/12 bg-azul/5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5 text-azul">
                        <path d={intentionIcons[index]} />
                      </svg>
                    </div>
                    <h3 className="font-playfair text-sm font-semibold text-azul mb-1.5">
                      {intention.title}
                    </h3>
                    <p className="font-inter text-xs leading-relaxed text-texto-sec">
                      {intention.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div data-section-item className="relative">
              <div className="flex items-center gap-3 mb-6 md:justify-center">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-azul/30 bg-creme font-mono text-xs font-bold text-azul shadow-[2px_2px_0px_rgba(26,46,60,0.08)]">
                  02
                </div>
                <div>
                  <span className="block font-inter text-[0.6rem] font-semibold uppercase tracking-widest text-azul/50">
                    {tools.step2Label}
                  </span>
                  <span className="block font-playfair text-lg font-semibold text-azul">
                    {tools.step2Title}
                  </span>
                </div>
              </div>

              <div className="md:pl-16 space-y-5">
                <div>
                  <span className="block font-inter text-xs font-semibold text-texto-sec mb-3 uppercase tracking-wider">
                    {tools.sizeLabel}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tools.sizes.map((size, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-sm border border-azul/20 bg-azul/5 px-4 py-2 font-inter text-xs font-semibold text-azul"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block font-inter text-xs font-semibold text-texto-sec mb-3 uppercase tracking-wider">
                    {tools.channelLabel}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tools.channels.map((channel, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-sm border border-borda/25 bg-offwhite px-4 py-2 font-inter text-xs font-medium text-texto-sec"
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div data-section-item className="relative">
              <div className="flex items-center gap-3 mb-6 md:justify-center">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-musgo/30 bg-creme font-mono text-xs font-bold text-musgo shadow-[2px_2px_0px_rgba(74,93,78,0.08)]">
                  03
                </div>
                <div>
                  <span className="block font-inter text-[0.6rem] font-semibold uppercase tracking-widest text-musgo/60">
                    {tools.step3Label}
                  </span>
                  <span className="block font-playfair text-lg font-semibold text-azul">
                    {tools.step3Title}
                  </span>
                </div>
              </div>

              <div className="md:pl-16">
                <div className="rebrand-border-double rounded-sm bg-offwhite p-6 shadow-[4px_4px_0px_rgba(26,46,60,0.06)]">
                  <p className="font-inter text-sm text-texto-sec mb-5">
                    {tools.step3Description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tools.briefingFields.map((field, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-borda/20 bg-creme px-3 py-1.5 font-inter text-xs font-medium text-texto-sec"
                      >
                        <span className="h-1 w-1 rounded-full bg-terracota/50" />
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <CompassRose className="absolute -top-4 -right-4 h-16 w-16 text-azul/8 pointer-events-none hidden lg:block" />
        </div>
      </Container>
    </section>
  );
}
