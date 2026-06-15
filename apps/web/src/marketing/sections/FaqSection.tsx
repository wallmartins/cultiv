import { cn, Container, SectionHeader, Text } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface FaqSectionProps {
  readonly locale: MarketingLocale;
}

export function FaqSection({ locale }: FaqSectionProps) {
  const { faq } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");
  const lastIndex = faq.items.length - 1;

  return (
    <section
      id="faq"
      className="editorial-rule relative isolate bg-surface pt-[var(--spacing-section-sm)] pb-[calc(var(--spacing-section-sm)+2rem)] md:pt-[var(--spacing-section)] md:pb-[calc(var(--spacing-section)+2.5rem)]"
    >
      <Container ref={sectionRef}>
        <div data-section-item>
          <SectionHeader
            eyebrow={faq.eyebrow}
            title={faq.title}
            description={faq.description}
            className="mb-8 md:mb-10"
          />
        </div>
        <div className="grid gap-0 border border-foreground md:grid-cols-2">
          {faq.items.map((item, index) => {
            const isLast = index === lastIndex;
            const isRightColumn = index % 2 === 1;

            return (
              <article
                key={item.id}
                className={cn(
                  "flex flex-col p-6 md:p-8",
                  !isLast && "border-b border-foreground",
                  isLast && "md:col-span-2",
                  !isRightColumn && !isLast && "md:border-r md:border-foreground"
                )}
              >
                <div className="space-y-4">
                  <Text as="p" variant="meta" className="text-moss">
                    [{String(index + 1).padStart(2, "0")}]
                  </Text>
                  <Text as="h3" variant="h3" className="text-lg md:text-xl">
                    {item.question}
                  </Text>
                  <Text as="p" variant="body" className="text-muted">
                    {item.answer}
                  </Text>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
