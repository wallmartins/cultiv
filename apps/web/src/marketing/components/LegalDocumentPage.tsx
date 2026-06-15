import { Container, Text } from "@my-ai-orchestrator/ui";
import { LegalStructuredData } from "~/marketing/components/LegalStructuredData";
import type { LegalDocument } from "~/marketing/content/legal/types";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface LegalDocumentPageProps {
  readonly document: LegalDocument;
  readonly locale: MarketingLocale;
  readonly kind: "privacy" | "terms";
}

export function LegalDocumentPage({ document, locale, kind }: LegalDocumentPageProps) {
  return (
    <main className="editorial-rule py-[var(--spacing-section)]">
      <LegalStructuredData locale={locale} kind={kind} />
      <Container className="max-w-3xl">
        <Text as="p" variant="meta" className="mb-6">
          Legal
        </Text>
        <Text as="h1" variant="h1" className="mb-12">
          {document.title}
          <span className="text-muted">.</span>
        </Text>
        <div className="space-y-10 border-t border-foreground">
          {document.sections.map((section, index) => (
            <section
              key={section.heading}
              className="grid gap-4 border-b border-foreground py-8 md:grid-cols-[6rem_1fr]"
            >
              <Text as="p" variant="meta" className="text-foreground">
                [{String(index + 1).padStart(2, "0")}]
              </Text>
              <div className="space-y-3">
                <Text as="h2" variant="h2">
                  {section.heading}
                </Text>
                <Text as="p" variant="body-lg" className="text-muted">
                  {section.body}
                </Text>
              </div>
            </section>
          ))}
        </div>
      </Container>
    </main>
  );
}
