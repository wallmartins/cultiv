import { AboutSection } from "~/sections/AboutSection";
import { FaqSection } from "~/sections/FaqSection";
import { FormatsSection } from "~/sections/FormatsSection";
import { ShowcaseSection } from "~/sections/ShowcaseSection";
import { WaitlistSection } from "~/sections/WaitlistSection";
import type { MarketingLocale } from "~/i18n/types";

export interface BelowFoldSectionsProps {
  readonly locale: MarketingLocale;
}

export function BelowFoldSections({ locale }: BelowFoldSectionsProps) {
  return (
    <>
      <AboutSection locale={locale} />
      <FormatsSection locale={locale} />
      <ShowcaseSection locale={locale} />
      <FaqSection locale={locale} />
      <WaitlistSection locale={locale} />
    </>
  );
}
