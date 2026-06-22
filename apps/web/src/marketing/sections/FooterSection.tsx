import { Container } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { BrandMark } from "~/marketing/components/BrandMark";
import { imprintNavItemClassName } from "~/marketing/components/SiteHeader";
import { LocaleToggle } from "~/marketing/components/LocaleToggle";
import { getHomePath, getLocaleMessages, getPrivacyPath, getTermsPath } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface FooterSectionProps {
  readonly locale: MarketingLocale;
}

export function FooterSection({ locale }: FooterSectionProps) {
  const messages = getLocaleMessages(locale);
  const privacyPath = getPrivacyPath(locale);
  const termsPath = getTermsPath(locale);

  return (
    <footer className="relative z-[1] flex items-center border-t border-ink-ghost bg-paper">
      <Container className="flex w-full flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-8 md:py-10">
        <Link
          to={getHomePath(locale)}
          aria-label={messages.header.brand}
          className="motion-hover inline-flex shrink-0 items-center"
        >
          <BrandMark variant="wordmark" />
        </Link>

        <nav
          aria-label={messages.header.navLabel}
          className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-x-6"
        >
          <a href={`mailto:${messages.footer.contact}`} className={imprintNavItemClassName}>
            {messages.footer.contact}
          </a>
          <Link to={privacyPath} className={imprintNavItemClassName}>
            {messages.footer.privacy}
          </Link>
          <Link to={termsPath} className={imprintNavItemClassName}>
            {messages.footer.terms}
          </Link>
          <LocaleToggle locale={locale} className={imprintNavItemClassName} />
        </nav>
      </Container>
    </footer>
  );
}
