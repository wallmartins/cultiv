import { GeoStructuredData } from "~/components/GeoStructuredData";
import { ViewportBelowFoldSections } from "~/components/ViewportBelowFoldSections";
import { HeroSection } from "~/sections/HeroSection";
import type { MarketingLocale } from "~/i18n/types";

export interface ProductShowcaseProps {
  readonly locale: MarketingLocale;
}

export function ProductShowcase({ locale }: ProductShowcaseProps) {
  return (
    <main>
      <GeoStructuredData locale={locale} />
      <HeroSection locale={locale} />
      <ViewportBelowFoldSections locale={locale} />
    </main>
  );
}
