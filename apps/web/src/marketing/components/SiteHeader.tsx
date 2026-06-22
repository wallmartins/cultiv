import { Container, cn } from "@my-ai-orchestrator/ui";
import { useHeaderScrolled } from "~/marketing/animations/use-header-scrolled";
import { Link } from "@tanstack/react-router";
import { BrandMark } from "~/marketing/components/BrandMark";
import { SiteMobileNav } from "~/marketing/components/SiteMobileNav";
import { LocaleToggle } from "~/marketing/components/LocaleToggle";
import { getHomePath, getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { marketingNavItems } from "~/marketing/navigation/marketing-nav-items";

export const imprintNavItemClassName =
  "motion-hover font-conducao text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-ink hover:text-pigment-terracotta";

export interface SiteHeaderProps {
  readonly locale: MarketingLocale;
}

export function SiteHeader({ locale }: SiteHeaderProps) {
  const messages = getLocaleMessages(locale);
  const scrolled = useHeaderScrolled();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex min-h-[var(--site-header-height)] items-center border-b bg-paper/95 backdrop-blur-sm transition-[border-color] duration-500 ease-in-out motion-reduce:transition-none",
        scrolled ? "border-ink-ghost" : "border-transparent"
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
            <a key={item.key} href={item.href} className={imprintNavItemClassName}>
              {messages.header.nav[item.key]}
            </a>
          ))}
          <LocaleToggle locale={locale} className={imprintNavItemClassName} />
        </nav>

        <SiteMobileNav locale={locale} messages={messages.header} />
      </Container>
    </header>
  );
}
