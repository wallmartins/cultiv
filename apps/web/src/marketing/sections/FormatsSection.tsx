import {
  CartographySurface,
  CoordinateLabel,
  Container,
  Text,
} from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { ToolsCompositorDemo } from "~/marketing/visual/ToolsCompositorDemo";

export interface FormatsSectionProps {
  readonly locale: MarketingLocale;
}

export function FormatsSection({ locale }: FormatsSectionProps) {
  const messages = getLocaleMessages(locale);
  const { tools } = messages;
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

          <div data-section-item>
            <ToolsCompositorDemo demo={tools.demo} />
          </div>
        </Container>
      </CartographySurface>
    </section>
  );
}
