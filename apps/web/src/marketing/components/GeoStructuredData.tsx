import type { MarketingLocale } from "~/i18n/marketing/types";
import { JsonLd } from "~/marketing/components/JsonLd";
import { buildHomeJsonLdGraph } from "~/marketing/seo/geo/json-ld";

export interface GeoStructuredDataProps {
  readonly locale: MarketingLocale;
}

export function GeoStructuredData({ locale }: GeoStructuredDataProps) {
  return <JsonLd data={buildHomeJsonLdGraph(locale)} />;
}
