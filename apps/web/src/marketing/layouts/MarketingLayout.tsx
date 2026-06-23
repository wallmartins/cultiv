import type { ReactNode } from "react";
import { CartographySurface, RouteLine } from "@my-ai-orchestrator/ui";
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
    <CartographySurface
      className="rebrand min-h-screen overflow-x-clip font-inter"
      data-surface="marketing"
    >
      <SiteHeader locale={locale} />
      <div className="relative flex">
        <aside className="hidden w-12 shrink-0 lg:block" aria-hidden="true">
          <RouteLine
            orientation="vertical"
            className="sticky top-24 h-[calc(100vh-6rem)]"
          />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <FooterSection locale={locale} />
    </CartographySurface>
  );
}
