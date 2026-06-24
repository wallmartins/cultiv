import type { ReactNode } from "react";
import { usePaperParallax } from "~/marketing/animations/use-paper-parallax";
import { MarketingSectionRail } from "~/marketing/components/MarketingSectionRail";
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
  usePaperParallax();

  return (
    <div
      className="rebrand min-h-screen overflow-x-clip bg-transparent font-inter"
      data-surface="marketing"
      data-paper-parallax=""
    >
      <SiteHeader locale={locale} />
      <div className="relative">
        <div className="min-w-0">{children}</div>
        <aside className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-12 bg-transparent lg:block">
          <MarketingSectionRail locale={locale} />
        </aside>
      </div>
      <FooterSection locale={locale} />
    </div>
  );
}
