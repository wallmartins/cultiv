import { Container } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { BrandMark } from "~/components/BrandMark";
import { LocaleToggle, navItemClassName } from "~/components/LocaleToggle";
import { getLocaleMessages, getPrivacyPath, getTermsPath } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";

export interface FooterSectionProps {
  readonly locale: MarketingLocale;
}

export function FooterSection({ locale }: FooterSectionProps) {
  const messages = getLocaleMessages(locale);
  const privacyPath = getPrivacyPath(locale);
  const termsPath = getTermsPath(locale);

  return (
    <footer className="border-t border-foreground">
      <div className="h-2 bg-foreground" aria-hidden />

      <Container className="flex flex-col gap-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <BrandMark variant="icon" />

        <nav
          aria-label={messages.header.navLabel}
          className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-x-6"
        >
          <a href={`mailto:${messages.footer.contact}`} className={navItemClassName}>
            {messages.footer.contact}
          </a>
          <Link to={privacyPath} className={navItemClassName}>
            {messages.footer.privacy}
          </Link>
          <Link to={termsPath} className={navItemClassName}>
            {messages.footer.terms}
          </Link>
          <LocaleToggle locale={locale} />
        </nav>
      </Container>
    </footer>
  );
}
