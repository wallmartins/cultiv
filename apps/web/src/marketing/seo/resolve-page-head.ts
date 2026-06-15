import type { MarketingLocale } from "../../i18n/marketing/types.js";
import { llmsPath } from "./geo/llms-path.js";
import { resolvePageSeo, type PublicPage } from "./resolve-page-seo.js";
import { getSiteUrl } from "./site-url.js";

export function resolveHomePageHead(locale: MarketingLocale) {
  const seo = resolvePageSeo({ kind: "home", locale });
  const siteUrl = getSiteUrl();

  return {
    ...seo,
    links: [
      ...seo.links,
      {
        rel: "alternate",
        type: "text/plain",
        href: `${siteUrl}${llmsPath(locale, false)}`,
        title: "LLM documentation"
      },
      {
        rel: "alternate",
        type: "text/plain",
        href: `${siteUrl}${llmsPath(locale, true)}`,
        title: "LLM full documentation"
      }
    ]
  };
}

export function resolvePublicPageHead(page: PublicPage) {
  if (page.kind === "home") {
    return resolveHomePageHead(page.locale);
  }

  return resolvePageSeo(page);
}
