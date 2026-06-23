import { Container, cn } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { LocaleToggle } from "~/marketing/components/LocaleToggle";
import { getHomePath, getLocaleMessages, getPrivacyPath, getTermsPath } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { CompassIcon, PenIcon } from "~/marketing/components/icons";
import { rebrandNavItemClassName } from "~/marketing/components/SiteHeader";

const footerLinkClassName = cn(rebrandNavItemClassName, "!text-creme/50 hover:!text-ocre");

export interface FooterSectionProps {
  readonly locale: MarketingLocale;
}

export function FooterSection({ locale }: FooterSectionProps) {
  const messages = getLocaleMessages(locale);
  const privacyPath = getPrivacyPath(locale);
  const termsPath = getTermsPath(locale);

  return (
    <footer className="relative bg-azul border-t border-azul/80">
      <Container className="py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div className="space-y-4">
            <Link
              to={getHomePath(locale)}
              aria-label={messages.header.brand}
              className="inline-flex items-center gap-2.5"
            >
              <CompassIcon className="h-6 w-6 text-creme/80" />
              <span className="font-playfair text-lg font-semibold text-creme">
                Cultiv
              </span>
            </Link>
            <p className="font-inter text-sm leading-relaxed text-creme/50 max-w-sm">
              {messages.footer.description}
            </p>
          </div>

          <div className="flex flex-col gap-6 md:items-end">
            <nav className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-x-6">
              <a href={`mailto:${messages.footer.contact}`} className={footerLinkClassName}>
                {messages.footer.contact}
              </a>
              <Link to={privacyPath} className={footerLinkClassName}>
                {messages.footer.privacy}
              </Link>
              <Link to={termsPath} className={footerLinkClassName}>
                {messages.footer.terms}
              </Link>
              <LocaleToggle locale={locale} className={footerLinkClassName} />
            </nav>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-creme/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-caveat text-base text-creme/40">
            {messages.footer.signature}
          </p>
          <div className="flex items-center gap-2">
            <PenIcon className="h-3.5 w-3.5 text-creme/30" />
            <span className="font-inter text-xs text-creme/30">
              {messages.footer.seal}
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
