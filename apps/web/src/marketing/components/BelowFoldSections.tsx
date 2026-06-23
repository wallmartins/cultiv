import { ProblemSection } from "~/marketing/sections/ProblemSection";
import { HowItWorksSection } from "~/marketing/sections/HowItWorksSection";
import { FormatsSection } from "~/marketing/sections/FormatsSection";
import { ComparisonSection } from "~/marketing/sections/ComparisonSection";
import { TestimonialSection } from "~/marketing/sections/TestimonialSection";
import { PricingSection } from "~/marketing/sections/PricingSection";
import { FaqSection } from "~/marketing/sections/FaqSection";
import { WaitlistSection } from "~/marketing/sections/WaitlistSection";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface BelowFoldSectionsProps {
  readonly locale: MarketingLocale;
}

export function BelowFoldSections({ locale }: BelowFoldSectionsProps) {
  return (
    <>
      <ProblemSection locale={locale} />
      <HowItWorksSection locale={locale} />
      <FormatsSection locale={locale} />
      <ComparisonSection locale={locale} />
      <TestimonialSection locale={locale} />
      <PricingSection locale={locale} />
      <FaqSection locale={locale} />
      <WaitlistSection locale={locale} />
    </>
  );
}
