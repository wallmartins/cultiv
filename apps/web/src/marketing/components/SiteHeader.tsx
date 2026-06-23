import { Container, cn } from "@my-ai-orchestrator/ui";
import { useHeaderScrolled } from "~/marketing/animations/use-header-scrolled";
import { Link } from "@tanstack/react-router";
import { SiteMobileNav } from "~/marketing/components/SiteMobileNav";
import { LocaleToggle } from "~/marketing/components/LocaleToggle";
import { getHomePath, getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { marketingNavItems } from "~/marketing/navigation/marketing-nav-items";

function CompassIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.15" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

export const rebrandNavItemClassName =
  "rebrand-nav-hover font-inter text-xs font-semibold uppercase tracking-widest text-texto-sec";

export interface SiteHeaderProps {
  readonly locale: MarketingLocale;
}

export function SiteHeader({ locale }: SiteHeaderProps) {
  const messages = getLocaleMessages(locale);
  const scrolled = useHeaderScrolled();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex min-h-[var(--site-header-height)] items-center border-b bg-creme/95 backdrop-blur-sm transition-[border-color] duration-500 ease-in-out motion-reduce:transition-none",
        scrolled ? "border-borda/30" : "border-transparent"
      )}
    >
      <Container className="flex w-full items-center justify-between gap-4 py-3 md:gap-6 md:py-3.5">
        <Link
          to={getHomePath(locale)}
          aria-label={messages.header.brand}
          className="rebrand-logo-hover shrink-0 flex items-center gap-2.5"
        >
          <CompassIcon className="rebrand-logo-icon h-7 w-7 text-azul rebrand-logo-breathe" />
          <span className="rebrand-logo-text font-playfair text-xl font-semibold text-azul hidden sm:inline">
            Cultiv
          </span>
        </Link>

        <nav
          aria-label={messages.header.navLabel}
          className="hidden items-center justify-end gap-x-6 md:flex"
        >
          {marketingNavItems.map((item) => (
            <a key={item.key} href={item.href} className={rebrandNavItemClassName}>
              {messages.header.nav[item.key]}
            </a>
          ))}
          <LocaleToggle locale={locale} className={rebrandNavItemClassName} />
        </nav>

        <SiteMobileNav locale={locale} messages={messages.header} />
      </Container>
    </header>
  );
}
