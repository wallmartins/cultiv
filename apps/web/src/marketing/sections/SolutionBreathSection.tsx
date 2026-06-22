import { Container, PaperSurface, Text } from "@my-ai-orchestrator/ui";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface SolutionBreathSectionProps {
  readonly locale: MarketingLocale;
}

export function SolutionBreathSection({ locale }: SolutionBreathSectionProps) {
  const { solutionBreath, header } = getLocaleMessages(locale);

  return (
    <PaperSurface id="solucao" className="border-t border-ink-ghost">
      <Container className="py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="space-y-4 text-center">
            <Text as="p" variant="imprint" className="text-pigment-terracotta">
              {solutionBreath.handwrittenNote}
            </Text>
            <Text as="p" variant="display-sm" className="text-ink">
              {header.brand}
            </Text>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {solutionBreath.keywords.map((keyword) => (
              <li
                key={keyword.phrase}
                className="press-edge border border-ink-ghost bg-paper-elevated px-5 py-4"
              >
                <Text as="p" variant="caption" className="text-ink">
                  {keyword.phrase}
                </Text>
                <Text as="p" variant="body" className="mt-2 text-ink-muted">
                  {keyword.microcopy}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </PaperSurface>
  );
}
