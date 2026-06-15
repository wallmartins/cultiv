import type { ReactNode } from "react";
import { SiteHeader } from "~/marketing/components/SiteHeader";
import { useDocumentLang } from "~/hooks/use-document-lang";
import { FooterSection } from "~/marketing/sections/FooterSection";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface MarketingLayoutProps {
  readonly locale: MarketingLocale;
  readonly children: ReactNode;
}

export function MarketingLayout({ locale, children }: MarketingLayoutProps) {
  useDocumentLang(locale);

  return (
    <div className="min-h-screen overflow-x-clip">
      <SiteHeader locale={locale} />
      {children}
      <FooterSection locale={locale} />
    </div>
  );
}
