import { Container } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { CheckIcon, SectionHeader } from "~/marketing/components/icons";

export interface PricingSectionProps {
  readonly locale: MarketingLocale;
}

export function PricingSection({ locale }: PricingSectionProps) {
  const { pricing } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <section
      id="preco"
      className="relative overflow-hidden bg-creme border-b border-borda/15 py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
    >
      <Container ref={sectionRef} className="relative z-10">
        <SectionHeader eyebrow={pricing.eyebrow} title={pricing.title} />

        <div
          className={`mx-auto grid max-w-5xl gap-5 ${
            pricing.plans.length === 1 ? "max-w-md" : "lg:grid-cols-3"
          }`}
          data-section-item
        >
          {pricing.plans.map((plan) => {
            const isRecommended = plan.recommended === true;
            return (
              <div
                key={plan.name}
                className={`rebrand-hover relative flex flex-col rounded-sm border bg-offwhite p-6 transition-all duration-300 ${
                  isRecommended
                    ? "border-terracota/30 shadow-[5px_5px_0px_rgba(181,90,59,0.1)] lg:-translate-y-2"
                    : "border-borda/20 shadow-[3px_3px_0px_rgba(26,46,60,0.06)]"
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-6">
                    <span className="inline-block rounded-sm bg-terracota px-3 py-1 font-inter text-[0.6rem] font-bold uppercase tracking-widest text-white shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
                      {pricing.recommendedBadge}
                    </span>
                  </div>
                )}

                <div className="mb-1">
                  {plan.badge && (
                    <span className={`inline-block font-inter text-[0.6rem] font-semibold uppercase tracking-widest mb-2 ${
                      isRecommended ? "text-terracota" : "text-azul/50"
                    }`}>
                      {plan.badge}
                    </span>
                  )}
                  <h3 className="font-playfair text-xl font-bold text-azul">
                    {plan.name}
                  </h3>
                </div>

                <p className="font-inter text-sm text-texto-sec mt-2 mb-5">
                  {plan.description}
                </p>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2.5">
                      <CheckIcon className={isRecommended ? "text-terracota" : "text-musgo"} />
                      <span className="font-inter text-sm text-texto-sec">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t border-borda/15">
                  <p className="font-inter text-xs text-borda mb-4">
                    {plan.footer}
                  </p>
                  <a
                    href="#waitlist"
                    className={`rebrand-hover block w-full text-center rounded-sm px-6 py-3 font-inter text-sm font-semibold transition-all duration-300 ${
                      isRecommended
                        ? "bg-terracota text-white shadow-[3px_3px_0px_rgba(0,0,0,0.15)] hover:bg-terracota/90"
                        : "bg-azul text-white shadow-[3px_3px_0px_rgba(26,46,60,0.12)] hover:bg-azul/90"
                    }`}
                  >
                    {pricing.cta}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
