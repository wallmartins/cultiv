import type { MarketingLocale } from "~/i18n/types";
import { JsonLd } from "~/components/JsonLd";
import { buildHomeJsonLdGraph } from "~/utils/geo/json-ld";

export interface GeoStructuredDataProps {
  readonly locale: MarketingLocale;
}

export function GeoStructuredData({ locale }: GeoStructuredDataProps) {
  return <JsonLd data={buildHomeJsonLdGraph(locale)} />;
}
