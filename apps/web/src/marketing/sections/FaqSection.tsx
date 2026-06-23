import { Container } from "@my-ai-orchestrator/ui";
import { useState } from "react";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { ChevronIcon, SectionHeader } from "~/marketing/components/icons";

export interface FaqSectionProps {
  readonly locale: MarketingLocale;
}

export function FaqSection({ locale }: FaqSectionProps) {
  const { faq } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section
      id="perguntas"
      className="relative overflow-hidden bg-offwhite border-b border-borda/15 py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
    >
      <Container ref={sectionRef} className="relative z-10">
        <SectionHeader eyebrow={faq.eyebrow} title={faq.title} />

        <div className="mx-auto max-w-2xl space-y-3" data-section-item>
          {faq.items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-sm border border-borda/20 bg-creme overflow-hidden"
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-inter text-sm font-semibold text-azul">
                    {item.question}
                  </span>
                  <ChevronIcon open={isOpen} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-0">
                    <p className="font-inter text-sm leading-relaxed text-texto-sec">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
