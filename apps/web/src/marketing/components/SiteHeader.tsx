import { ButtonLink, cn } from "@my-ai-orchestrator/ui";
import { BrandMark } from "~/marketing/components/BrandMark";
import { SiteMobileNav } from "~/marketing/components/SiteMobileNav";
import { LocaleToggle } from "~/marketing/components/LocaleToggle";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { marketingNavItems } from "~/marketing/navigation/marketing-nav-items";

export const rebrandNavItemClassName =
  "rebrand-nav-hover font-inter text-xs font-semibold uppercase tracking-widest text-ink-muted";

export interface SiteHeaderProps {
  readonly locale: MarketingLocale;
}

export function SiteHeader({ locale }: SiteHeaderProps) {
  const messages = getLocaleMessages(locale);

  return (
    <>
      <div
        className="marketing-header-spacer"
        aria-hidden="true"
      />
      <header className="fixed top-4 left-0 right-0 z-50 px-[var(--spacing-gutter)]">
        <div
          className={cn(
            "mx-auto flex w-full max-w-[60rem] items-center justify-between gap-3 rounded-[5px]",
            "border-dotted-cartography bg-off-white/92 px-3 py-2.5 shadow-cartography backdrop-blur-sm",
            "md:gap-4 md:px-5 md:py-3"
          )}
        >
          <BrandMark locale={locale} brandLabel={messages.header.brand} size={32} />

          <nav
            aria-label={messages.header.navLabel}
            className="hidden items-center justify-end gap-x-5 md:flex"
          >
            {marketingNavItems.map((item) => (
              <a key={item.key} href={item.href} className={rebrandNavItemClassName}>
                {messages.header.nav[item.key]}
              </a>
            ))}
            <LocaleToggle locale={locale} className={rebrandNavItemClassName} />
            <ButtonLink href="#waitlist" size="compact" className="ml-1">
              {messages.header.ctaWaitlist}
            </ButtonLink>
          </nav>

          <SiteMobileNav locale={locale} messages={messages.header} />
        </div>
      </header>
    </>
  );
}
