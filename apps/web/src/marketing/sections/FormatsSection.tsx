import type { ComponentType } from "react";
import {
  CartographySurface,
  CoordinateLabel,
  Container,
  IconLetter,
  IconMap,
  IconPen,
  IconPin,
  IconRoute,
  IconScroll,
  Text,
  cn,
  type CartographyIconProps,
} from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import {
  getMarketingContentTypes,
  type MarketingContentTypeId,
} from "~/marketing/content/content-types/catalog";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

const formatIcons: Record<
  MarketingContentTypeId,
  ComponentType<CartographyIconProps>
> = {
  "long-form-blog": IconScroll,
  "validation-post": IconPin,
  "architecture-post": IconMap,
  "linkedin-post": IconPen,
  "twitter-thread": IconRoute,
  newsletter: IconLetter,
};

const formatTags: Record<MarketingContentTypeId, string> = {
  "long-form-blog": "long-form",
  "validation-post": "validation",
  "architecture-post": "architecture",
  "linkedin-post": "linkedin",
  "twitter-thread": "thread",
  newsletter: "newsletter",
};

export interface FormatsSectionProps {
  readonly locale: MarketingLocale;
}

export function FormatsSection({ locale }: FormatsSectionProps) {
  const messages = getLocaleMessages(locale);
  const { tools, contentTypes } = messages;
  const formats = getMarketingContentTypes(locale, contentTypes);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <section id="ferramentas" className="border-b border-ink-ghost/30">
      <CartographySurface vignette>
        <Container
          ref={sectionRef}
          className="py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
        >
          <header
            className="mx-auto mb-10 max-w-3xl text-center md:mb-14"
            data-section-item
          >
            <CoordinateLabel index={3} label={tools.eyebrow} className="mb-4 block" />
            <Text as="h2" variant="display" className="mb-4 text-deep-blue">
              {tools.title}
            </Text>
            <Text as="p" variant="body-lg" className="text-ink-muted">
              {tools.subtitle}
            </Text>
          </header>

          <div
            className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-4"
            data-section-item
          >
            {formats.map((format, index) => {
              const Icon = formatIcons[format.id];
              const isFeatured = index === 0;

              return (
                <article
                  key={format.id}
                  className={cn(
                    "rounded-[5px] border-dotted-cartography bg-off-white p-5 shadow-cartography",
                    "transition duration-250 motion-reduce:transition-none",
                    "hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
                    isFeatured && "md:col-span-2 md:row-span-2 md:p-7"
                  )}
                >
                  <span className="mb-3 block ui-type-mono text-[0.6875rem] uppercase tracking-widest text-ink-muted">
                    {formatTags[format.id]}
                  </span>
                  <div
                    className={cn(
                      "mb-4 flex items-center justify-center rounded-[5px]",
                      "border-dotted-cartography bg-cream text-terracotta",
                      isFeatured ? "h-11 w-11" : "h-9 w-9"
                    )}
                  >
                    <Icon size={isFeatured ? 24 : 20} aria-hidden />
                  </div>
                  <Text
                    as="h3"
                    variant="heading"
                    className={cn("mb-2 text-deep-blue", isFeatured && "text-xl")}
                  >
                    {format.label}
                  </Text>
                  <Text as="p" variant="body" className="text-ink-muted">
                    {format.description}
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
