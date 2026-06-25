import {
  getAlternateLocale,
  getHomePath,
  getLocaleMessages,
  getPrivacyPath,
  getTermsPath
} from "../../i18n/marketing/get-locale.js";
import type { MarketingLocale } from "../../i18n/marketing/types.js";
import { buildBlogSitemapUrlEntries } from "../../blog/seo/blog-sitemap.js";
import { buildGeoRobotsTxt } from "./geo/llms.js";
import { getOgImageUrl } from "./og-image.js";
import { getSiteUrl } from "./site-url";
import { seo } from "./seo";

export type PublicPage =
  | { readonly kind: "home"; readonly locale: MarketingLocale }
  | { readonly kind: "privacy"; readonly locale: MarketingLocale }
  | { readonly kind: "terms"; readonly locale: MarketingLocale };

const PUBLIC_PAGE_PATHS = [
  { path: "/", locale: "pt" as const, priority: "1.0" },
  { path: "/en", locale: "en" as const, priority: "1.0" },
  { path: "/privacy", locale: "pt" as const, priority: "0.4" },
  { path: "/terms", locale: "pt" as const, priority: "0.4" },
  { path: "/en/privacy", locale: "en" as const, priority: "0.4" },
  { path: "/en/terms", locale: "en" as const, priority: "0.4" },
  { path: "/llms.txt", locale: "pt" as const, priority: "0.6" },
  { path: "/llms-full.txt", locale: "pt" as const, priority: "0.5" },
  { path: "/en/llms.txt", locale: "en" as const, priority: "0.6" },
  { path: "/en/llms-full.txt", locale: "en" as const, priority: "0.5" }
] as const;

function getPagePath(page: PublicPage): string {
  if (page.kind === "home") {
    return getHomePath(page.locale);
  }

  if (page.kind === "privacy") {
    return getPrivacyPath(page.locale);
  }

  return getTermsPath(page.locale);
}

export function getAlternatePagePath(page: PublicPage): string {
  const alternate = getAlternateLocale(page.locale);
  if (page.kind === "home") {
    return getHomePath(alternate);
  }

  if (page.kind === "privacy") {
    return getPrivacyPath(alternate);
  }

  return getTermsPath(alternate);
}

function getPageCopy(page: PublicPage): {
  readonly title: string;
  readonly description: string;
  readonly imageAlt: string;
} {
  const messages = getLocaleMessages(page.locale);

  if (page.kind === "home") {
    return {
      title: messages.seo.homeTitle,
      description: messages.seo.homeDescription,
      imageAlt: messages.seo.ogImageAlt
    };
  }

  if (page.kind === "privacy") {
    return {
      title: messages.legal.privacyTitle,
      description: messages.seo.privacyDescription,
      imageAlt: messages.seo.ogImageAlt
    };
  }

  return {
    title: messages.legal.termsTitle,
    description: messages.seo.termsDescription,
    imageAlt: messages.seo.ogImageAlt
  };
}

function toHrefLang(locale: MarketingLocale): string {
  return locale === "pt" ? "pt-BR" : "en";
}

export function resolvePageSeo(page: PublicPage) {
  const siteUrl = getSiteUrl();
  const path = getPagePath(page);
  const alternatePath = getAlternatePagePath(page);
  const alternateLocale = getAlternateLocale(page.locale);
  const copy = getPageCopy(page);
  const canonicalUrl = `${siteUrl}${path}`;
  const ogImageUrl = getOgImageUrl(siteUrl);

  return {
    meta: seo({
      title: copy.title,
      description: copy.description,
      url: canonicalUrl,
      locale: page.locale,
      image: ogImageUrl,
      imageAlt: copy.imageAlt
    }),
    links: [
      { rel: "canonical", href: canonicalUrl },
      { rel: "alternate", hrefLang: toHrefLang(page.locale), href: canonicalUrl },
      {
        rel: "alternate",
        hrefLang: toHrefLang(alternateLocale),
        href: `${siteUrl}${alternatePath}`
      },
      { rel: "alternate", hrefLang: "x-default", href: `${siteUrl}${getHomePath("pt")}` }
    ]
  };
}

export function buildRobotsTxt(siteUrl: string): string {
  return buildGeoRobotsTxt(siteUrl);
}

export function buildSitemapXml(siteUrl: string): string {
  const urls = PUBLIC_PAGE_PATHS.map((entry) => {
    return `  <url>
    <loc>${siteUrl}${entry.path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  });

  const blogUrls = buildBlogSitemapUrlEntries(siteUrl);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls, ...blogUrls].join("\n")}
</urlset>
`;
}
