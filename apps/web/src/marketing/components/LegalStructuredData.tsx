import { JsonLd } from "~/marketing/components/JsonLd";
import { buildLegalPageJsonLd } from "~/marketing/seo/geo/json-ld";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface LegalStructuredDataProps {
  readonly locale: MarketingLocale;
  readonly kind: "privacy" | "terms";
}

export function LegalStructuredData({ locale, kind }: LegalStructuredDataProps) {
  return <JsonLd data={buildLegalPageJsonLd(locale, kind)} />;
}
