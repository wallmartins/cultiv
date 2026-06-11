import { lazy, Suspense } from "react";
import { GeoStructuredData } from "~/components/GeoStructuredData";
import { HeroSection } from "~/sections/HeroSection";
import type { MarketingLocale } from "~/i18n/types";

const BelowFoldSections = lazy(async () => {
  const module = await import("~/components/BelowFoldSections");
  return { default: module.BelowFoldSections };
});

export interface ProductShowcaseProps {
  readonly locale: MarketingLocale;
}

export function ProductShowcase({ locale }: ProductShowcaseProps) {
  return (
    <main>
      <GeoStructuredData locale={locale} />
      <HeroSection locale={locale} />
      <Suspense fallback={null}>
        <BelowFoldSections locale={locale} />
      </Suspense>
    </main>
  );
}
