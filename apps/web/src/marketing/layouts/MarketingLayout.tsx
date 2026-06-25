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
  readonly showSectionRail?: boolean;
}

export function MarketingLayout({
  locale,
  children,
  showSectionRail = true
}: MarketingLayoutProps) {
  useDocumentLang(locale);
  usePaperParallax();

  return (
    <div
      className="rebrand flex min-h-screen flex-col overflow-x-clip bg-transparent font-inter"
      data-surface="marketing"
      data-paper-parallax=""
    >
      <SiteHeader locale={locale} />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="min-w-0 flex-1">{children}</div>
        {showSectionRail ? (
          <aside className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-12 bg-transparent lg:block">
            <MarketingSectionRail locale={locale} />
          </aside>
        ) : null}
      </div>
      <FooterSection locale={locale} />
    </div>
  );
}
