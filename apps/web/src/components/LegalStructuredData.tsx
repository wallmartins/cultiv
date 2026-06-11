import { JsonLd } from "~/components/JsonLd";
import { buildLegalPageJsonLd } from "~/utils/geo/json-ld";
import type { MarketingLocale } from "~/i18n/types";

export interface LegalStructuredDataProps {
  readonly locale: MarketingLocale;
  readonly kind: "privacy" | "terms";
}

export function LegalStructuredData({ locale, kind }: LegalStructuredDataProps) {
  return <JsonLd data={buildLegalPageJsonLd(locale, kind)} />;
}
