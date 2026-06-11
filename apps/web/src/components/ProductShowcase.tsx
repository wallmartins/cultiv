import { GeoStructuredData } from "~/components/GeoStructuredData";
import { AboutSection } from "~/sections/AboutSection";
import { FaqSection } from "~/sections/FaqSection";
import { FormatsSection } from "~/sections/FormatsSection";
import { HeroSection } from "~/sections/HeroSection";
import { ShowcaseSection } from "~/sections/ShowcaseSection";
import { WaitlistSection } from "~/sections/WaitlistSection";
import type { MarketingLocale } from "~/i18n/types";

export interface ProductShowcaseProps {
  readonly locale: MarketingLocale;
}

export function ProductShowcase({ locale }: ProductShowcaseProps) {
  return (
    <main>
      <GeoStructuredData locale={locale} />
      <HeroSection locale={locale} />
      <AboutSection locale={locale} />
      <FormatsSection locale={locale} />
      <ShowcaseSection locale={locale} />
      <FaqSection locale={locale} />
      <WaitlistSection locale={locale} />
    </main>
  );
}
