import { getMarketingContentTypes } from "../../content/content-types/catalog.js";
import {
  getHomePath,
  getLocaleMessages,
  getPrivacyPath,
  getTermsPath
} from "../../../i18n/marketing/get-locale.js";
import type { MarketingLocale } from "../../../i18n/marketing/types.js";
import { getBrandIconUrl } from "../../../brand/assets.js";
import { getOgImageUrl } from "../og-image.js";
import { getSiteUrl } from "../site-url.js";

export function buildHomeJsonLdGraph(locale: MarketingLocale) {
  const siteUrl = getSiteUrl();
  const messages = getLocaleMessages(locale);
  const homeUrl = `${siteUrl}${getHomePath(locale)}`;
  const contentTypes = getMarketingContentTypes(locale, messages.contentTypes);

  const ogImageUrl = getOgImageUrl(siteUrl);
  const brandIconUrl = getBrandIconUrl(siteUrl);

  const organization = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: messages.geo.brand,
    url: siteUrl,
    email: messages.footer.contact,
    description: messages.geo.productDefinition,
    areaServed: messages.geo.llms.headquarters,
    knowsLanguage: ["pt-BR", "en"],
    logo: brandIconUrl,
    image: ogImageUrl
  };

  const website = {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: messages.geo.brand,
    description: messages.seo.homeDescription,
    inLanguage: locale === "pt" ? "pt-BR" : "en",
    publisher: { "@id": `${siteUrl}/#organization` }
  };

  const softwareApplication = {
    "@type": "SoftwareApplication",
    "@id": `${homeUrl}#product`,
    name: messages.geo.brand,
    applicationCategory: messages.geo.llms.category,
    operatingSystem: "Web",
    url: homeUrl,
    description: messages.geo.productDefinition,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: messages.geo.llms.pricing
    },
    featureList: contentTypes.map((type) => type.label)
  };

  const faqPage = {
    "@type": "FAQPage",
    "@id": `${homeUrl}#faq`,
    url: `${homeUrl}#faq`,
    inLanguage: locale === "pt" ? "pt-BR" : "en",
    mainEntity: messages.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, softwareApplication, faqPage]
  };
}

export function buildLegalPageJsonLd(
  locale: MarketingLocale,
  kind: "privacy" | "terms"
) {
  const siteUrl = getSiteUrl();
  const messages = getLocaleMessages(locale);
  const path = kind === "privacy" ? getPrivacyPath(locale) : getTermsPath(locale);
  const url = `${siteUrl}${path}`;
  const title =
    kind === "privacy" ? messages.legal.privacyTitle : messages.legal.termsTitle;
  const description =
    kind === "privacy" ? messages.seo.privacyDescription : messages.seo.termsDescription;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: locale === "pt" ? "pt-BR" : "en",
    isPartOf: { "@id": `${siteUrl}/#website` },
    publisher: { "@id": `${siteUrl}/#organization` }
  };
}
