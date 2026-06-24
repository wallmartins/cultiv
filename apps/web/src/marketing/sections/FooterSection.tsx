import { Container, IconPen, cn } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { BrandMark } from "~/marketing/components/BrandMark";
import { LocaleToggle } from "~/marketing/components/LocaleToggle";
import {
  getLocaleMessages,
  getPrivacyPath,
  getTermsPath
} from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { marketingNavItems } from "~/marketing/navigation/marketing-nav-items";
import { rebrandNavItemClassName } from "~/marketing/components/SiteHeader";

const footerLinkClassName = cn(
  rebrandNavItemClassName,
  "!text-off-white/60 hover:!text-ochre normal-case tracking-normal text-sm font-medium"
);

const footerNavLinkClassName = cn(
  footerLinkClassName,
  "block py-1"
);

const footerGroupLabels: Record<MarketingLocale, { product: string; legal: string; contact: string }> = {
  pt: { product: "Produto", legal: "Legal", contact: "Contato" },
  en: { product: "Product", legal: "Legal", contact: "Contact" }
};

export interface FooterSectionProps {
  readonly locale: MarketingLocale;
}

export function FooterSection({ locale }: FooterSectionProps) {
  const messages = getLocaleMessages(locale);
  const privacyPath = getPrivacyPath(locale);
  const termsPath = getTermsPath(locale);
  const groupLabels = footerGroupLabels[locale];

  return (
    <footer className="relative border-t border-deep-blue/20 bg-deep-blue text-off-white">
      <Container className="py-10 md:py-14">
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          <div className="space-y-4">
            <BrandMark
              locale={locale}
              brandLabel={messages.header.brand}
              size={28}
              color="white"
            />
            <p className="max-w-sm font-inter text-sm leading-relaxed text-off-white/60">
              {messages.footer.description}
            </p>
            <p className="font-caveat text-base text-off-white/45">
              {messages.footer.signature}
            </p>
          </div>

          <nav
            aria-label={messages.header.navLabel}
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            <div className="space-y-2">
              <p className="ui-type-mono text-[0.6875rem] uppercase tracking-widest text-off-white/40">
                {groupLabels.product}
              </p>
              <ul className="space-y-1">
                {marketingNavItems.map((item) => (
                  <li key={item.key}>
                    <a href={item.href} className={footerNavLinkClassName}>
                      {messages.header.nav[item.key]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="ui-type-mono text-[0.6875rem] uppercase tracking-widest text-off-white/40">
                {groupLabels.legal}
              </p>
              <ul className="space-y-1">
                <li>
                  <Link to={privacyPath} className={footerNavLinkClassName}>
                    {messages.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link to={termsPath} className={footerNavLinkClassName}>
                    {messages.footer.terms}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="ui-type-mono text-[0.6875rem] uppercase tracking-widest text-off-white/40">
                {groupLabels.contact}
              </p>
              <a href={`mailto:${messages.footer.contact}`} className={footerNavLinkClassName}>
                {messages.footer.contact}
              </a>
            </div>
          </nav>

          <div className="flex flex-col items-start justify-between gap-6 md:items-end md:text-right">
            <LocaleToggle
              locale={locale}
              invert
              className={cn(footerLinkClassName, "md:self-end")}
            />
            <div className="flex items-center gap-2 md:self-end">
              <IconPen size={14} className="text-off-white/35" />
              <span className="font-inter text-xs text-off-white/35">
                {messages.footer.seal}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
