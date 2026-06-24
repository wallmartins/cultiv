import { useEffect, useRef, useState } from "react";
import {
  CartographySurface,
  CoordinateLabel,
  Container,
  Text,
  cn,
} from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface HowItWorksSectionProps {
  readonly locale: MarketingLocale;
}

export function HowItWorksSection({ locale }: HowItWorksSectionProps) {
  const { route } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    stepRefs.current.forEach((element, index) => {
      if (!element) {
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setActiveIndex(index);
          }
        },
        { rootMargin: "-35% 0px -35% 0px", threshold: 0.1 }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [route.steps.length]);

  return (
    <section id="rota" className="border-b border-ink-ghost/30">
      <CartographySurface className="bg-off-white">
        <Container
          ref={sectionRef}
          className="py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
        >
          <header
            className="mx-auto mb-10 max-w-3xl text-center md:mb-14"
            data-section-item
          >
            <CoordinateLabel index={2} label={route.eyebrow} className="mb-4 block" />
            <Text as="h2" variant="display" className="text-deep-blue">
              {route.title}
            </Text>
          </header>

          <div className="mx-auto max-w-2xl" data-section-item>
            <ol className="space-y-8 md:space-y-10">
              {route.steps.map((step, index) => {
                const isActive = index <= activeIndex;

                return (
                  <li key={step.index} className="flex gap-5 md:gap-6">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        "border-2 transition-colors duration-300 motion-reduce:transition-none",
                        isActive
                          ? "border-terracotta bg-terracotta text-off-white"
                          : "border-ink-ghost/60 bg-off-white text-ink-muted"
                      )}
                    >
                      <span className="ui-type-mono text-[0.6875rem] font-medium">
                        {step.index}
                      </span>
                    </div>

                    <article
                      ref={(element) => {
                        stepRefs.current[index] = element;
                      }}
                      className="min-w-0 flex-1 rounded-[5px] border-dotted-cartography bg-off-white p-5 shadow-cartography"
                    >
                      <Text as="h3" variant="heading" className="mb-2 text-deep-blue">
                        {step.title}
                      </Text>
                      <Text as="p" variant="body" className="text-ink-muted">
                        {step.body}
                      </Text>
                    </article>
                  </li>
                );
              })}
            </ol>
          </div>
        </Container>
      </CartographySurface>
    </section>
  );
}
