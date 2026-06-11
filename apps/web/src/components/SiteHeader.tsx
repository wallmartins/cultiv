import { Container, cn } from "@my-ai-orchestrator/ui";
import { useHeaderScrolled } from "~/animations/use-header-scrolled";
import { Link } from "@tanstack/react-router";
import { BrandMark } from "~/components/BrandMark";
import { SiteMobileNav } from "~/components/SiteMobileNav";
import { LocaleToggle, navItemClassName } from "~/components/LocaleToggle";
import { getHomePath, getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";
import { marketingNavItems } from "~/navigation/marketing-nav-items";

export interface SiteHeaderProps {
  readonly locale: MarketingLocale;
}

export function SiteHeader({ locale }: SiteHeaderProps) {
  const messages = getLocaleMessages(locale);
  const scrolled = useHeaderScrolled();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex min-h-[var(--site-header-height)] items-center border-b bg-surface/95 backdrop-blur-sm transition-[border-color] duration-500 ease-in-out motion-reduce:transition-none",
        scrolled ? "border-foreground" : "border-transparent"
      )}
    >
      <Container className="flex w-full items-center justify-between gap-4 py-3 md:gap-6 md:py-3.5">
        <Link
          to={getHomePath(locale)}
          aria-label={messages.header.brand}
          className="motion-hover shrink-0"
        >
          <BrandMark variant="icon" />
        </Link>

        <nav
          aria-label={messages.header.navLabel}
          className="hidden items-center justify-end gap-x-6 md:flex"
        >
          {marketingNavItems.map((item) => (
            <a key={item.key} href={item.href} className={navItemClassName}>
              {messages.header.nav[item.key]}
            </a>
          ))}
          <LocaleToggle locale={locale} />
        </nav>

        <SiteMobileNav locale={locale} messages={messages.header} />
      </Container>
    </header>
  );
}
