import {
  CartographySurface,
  CoordinateLabel,
  Container,
  Text,
  cn,
} from "@my-ai-orchestrator/ui";
import { Blend, RefreshCwOff, UserRoundX } from "lucide-react";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

const territoryIcons = [UserRoundX, RefreshCwOff, Blend] as const;

export interface ProblemSectionProps {
  readonly locale: MarketingLocale;
}

export function ProblemSection({ locale }: ProblemSectionProps) {
  const { territory } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <section id="territorio" className="border-b border-ink-ghost/30">
      <CartographySurface className="bg-off-white">
        <Container
          ref={sectionRef}
          className="py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
        >
          <header
            className="mx-auto mb-10 max-w-3xl text-center md:mb-14"
            data-section-item
          >
            <CoordinateLabel
              index={1}
              label={territory.eyebrow}
              className="mb-4 block"
            />
            <Text as="h2" variant="display" className="text-deep-blue">
              {territory.title}
            </Text>
          </header>

          <div
            className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3 md:gap-6"
            data-section-item
          >
            {territory.cards.map((card, index) => {
              const Icon = territoryIcons[index];

              return (
                <article
                  key={card.title}
                  className="flex h-full flex-col rounded-[5px] border-dotted-cartography bg-off-white p-6 shadow-cartography md:p-7"
                >
                  <div
                    className={cn(
                      "mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px]",
                      "border-dotted-cartography bg-cream text-terracotta"
                    )}
                  >
                    <Icon size={20} strokeWidth={1.75} aria-hidden />
                  </div>
                  <Text as="h3" variant="heading" className="mb-2 text-deep-blue">
                    {card.title}
                  </Text>
                  <Text as="p" variant="body" className="flex-1 text-ink-muted">
                    {card.body}
                  </Text>
                </article>
              );
            })}
          </div>
        </Container>
      </CartographySurface>
    </section>
  );
}
