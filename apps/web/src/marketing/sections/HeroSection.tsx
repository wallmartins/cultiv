import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { CompassRose, SectionHeader } from "~/marketing/components/icons";

export interface HeroSectionProps {
  readonly locale: MarketingLocale;
}

export function HeroSection({ locale }: HeroSectionProps) {
  const messages = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-hero-item]");

  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden bg-creme border-b border-borda/15 rebrand-paper-texture"
    >
      <div className="rebrand-vignette absolute inset-0 pointer-events-none" />

      <div
        ref={sectionRef}
        className="relative z-10 mx-auto flex min-h-[calc(100svh-var(--site-header-height))] w-full max-w-6xl flex-col justify-center px-[var(--spacing-gutter)] py-[var(--spacing-section-sm)] lg:max-w-7xl lg:py-[var(--spacing-section)]"
      >
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="flex flex-col justify-center gap-7">
            <div data-hero-item>
              <span className="inline-block rounded-full border border-azul/20 bg-azul/5 px-4 py-1.5 font-inter text-xs font-semibold uppercase tracking-widest text-azul">
                {messages.hero.badge}
              </span>
            </div>

            <h1
              data-hero-item
              className="font-playfair text-[clamp(2.25rem,5.5vw,4rem)] font-bold leading-[1.08] tracking-tight text-azul"
            >
              {messages.hero.headline}
            </h1>

            <div data-hero-item className="w-16 h-0.5 bg-gradient-to-r from-terracota to-transparent" />

            <p
              data-hero-item
              className="max-w-xl font-inter text-lg leading-relaxed text-texto-sec"
            >
              {messages.hero.subheadline}
            </p>

            <div data-hero-item className="flex flex-col gap-4 sm:flex-row sm:items-center pt-2">
              <a
                href="#waitlist"
                className="rebrand-hover inline-flex items-center justify-center rounded-sm bg-terracota px-7 py-3.5 font-inter text-sm font-semibold text-white shadow-[4px_4px_0px_rgba(26,46,60,0.15)] transition-all duration-300 hover:bg-terracota/90"
              >
                {messages.hero.ctaPrimary}
              </a>
              <a
                href="#rota"
                className="rebrand-nav-hover font-inter text-sm font-semibold text-azul"
              >
                {messages.hero.ctaSecondary} →
              </a>
            </div>
          </div>

          <div data-hero-item className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              <div className="rebrand-border-double rounded-sm bg-offwhite p-6 shadow-[4px_4px_0px_rgba(26,46,60,0.1)]">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-borda/20">
                  <div className="h-2 w-2 rounded-full bg-terracota" />
                    <span className="font-inter text-[0.65rem] font-semibold uppercase tracking-widest text-texto-sec">
                      {messages.hero.comparisonLabel}
                    </span>
                </div>

                <div className="space-y-4">
                  <div className="rounded-sm border border-borda/20 bg-creme p-4">
                    <span className="block font-inter text-[0.6rem] font-semibold uppercase tracking-widest text-texto-sec mb-2">
                      {messages.hero.genericLabel}
                    </span>
                    <p className="font-inter text-sm leading-relaxed text-texto-sec/70">
                      {messages.hero.genericLine1}
                      <br />
                      {messages.hero.genericLine2}
                    </p>
                  </div>

                  <div className="rounded-sm border border-terracota/30 bg-offwhite p-4 shadow-[2px_2px_0px_rgba(181,90,59,0.08)]">
                    <span className="block font-inter text-[0.6rem] font-semibold uppercase tracking-widest text-terracota mb-2">
                      {messages.hero.voiceLabel}
                    </span>
                    <p className="font-inter text-sm leading-relaxed text-texto">
                      {messages.hero.voiceLine1}
                      <br />
                      {messages.hero.voiceLine2}
                    </p>
                  </div>
                </div>
              </div>

              <CompassRose className="absolute -top-8 -right-8 h-24 w-24 text-azul/10 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
