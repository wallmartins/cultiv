import type { MarketingLocale } from "~/i18n/marketing/types";

export function getBlogIndexPath(locale: MarketingLocale): string {
  return locale === "pt" ? "/blog" : "/en/blog";
}

export function getBlogPostPath(locale: MarketingLocale, slug: string): string {
  return `${getBlogIndexPath(locale)}/${slug}`;
}

export function getBlogTagPath(locale: MarketingLocale, tagSlug: string): string {
  return `${getBlogIndexPath(locale)}/tag/${tagSlug}`;
}

export function getBlogRssPath(locale: MarketingLocale): string {
  return `${getBlogIndexPath(locale)}/rss.xml`;
}
