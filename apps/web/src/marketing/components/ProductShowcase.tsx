import { GeoStructuredData } from "~/marketing/components/GeoStructuredData";
import { ViewportBelowFoldSections } from "~/marketing/components/ViewportBelowFoldSections";
import { HeroSection } from "~/marketing/sections/HeroSection";
import type { MarketingLocale } from "~/i18n/marketing/types";

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
