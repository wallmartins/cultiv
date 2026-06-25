import {
  getAlternateLocale,
  getHomePath,
  getLocaleMessages
} from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import type { BlogPost } from "../lib/post-schema";
import { getSiteUrl } from "~/marketing/seo/site-url";
import { seo } from "~/marketing/seo/seo";
import {
  getBlogIndexPath,
  getBlogPostPath,
  getBlogTagPath
} from "./blog-paths";

function toHrefLang(locale: MarketingLocale): string {
  return locale === "pt" ? "pt-BR" : "en";
}

function buildAlternateLinks(
  locale: MarketingLocale,
  path: string,
  alternatePath: string
) {
  const siteUrl = getSiteUrl();
  const alternateLocale = getAlternateLocale(locale);
  const canonicalUrl = `${siteUrl}${path}`;

  return [
    { rel: "canonical", href: canonicalUrl },
    { rel: "alternate", hrefLang: toHrefLang(locale), href: canonicalUrl },
    {
      rel: "alternate",
      hrefLang: toHrefLang(alternateLocale),
      href: `${siteUrl}${alternatePath}`
    },
    { rel: "alternate", hrefLang: "x-default", href: `${siteUrl}${getHomePath("pt")}` }
  ];
}

export function resolveBlogIndexHead(locale: MarketingLocale) {
  const messages = getLocaleMessages(locale);
  const path = getBlogIndexPath(locale);
  const alternatePath = getBlogIndexPath(getAlternateLocale(locale));
  const canonicalUrl = `${getSiteUrl()}${path}`;

  return {
    meta: seo({
      title: messages.blog.indexTitle,
      description: messages.blog.indexDescription,
      url: canonicalUrl,
      locale
    }),
    links: buildAlternateLinks(locale, path, alternatePath)
  };
}

export function resolveBlogPostHead(locale: MarketingLocale, post: BlogPost) {
  const path = getBlogPostPath(locale, post.slug);
  const canonicalUrl = `${getSiteUrl()}${path}`;
  const title = `${post.title} — Cultiv`;
  const image = `${getSiteUrl()}${post.coverImage}`;

  return {
    meta: seo({
      title,
      description: post.excerpt,
      url: canonicalUrl,
      locale,
      image,
      imageAlt: post.title,
      type: "article"
    }),
    links: [{ rel: "canonical", href: canonicalUrl }]
  };
}

export function resolveBlogTagHead(
  locale: MarketingLocale,
  tagSlug: string,
  tagLabel: string
) {
  const messages = getLocaleMessages(locale);
  const path = getBlogTagPath(locale, tagSlug);
  const alternatePath = getBlogTagPath(getAlternateLocale(locale), tagSlug);
  const title = messages.blog.tagPageTitle.replace("{tag}", tagLabel);
  const canonicalUrl = `${getSiteUrl()}${path}`;

  return {
    meta: seo({
      title,
      description: messages.blog.indexDescription,
      url: canonicalUrl,
      locale
    }),
    links: buildAlternateLinks(locale, path, alternatePath)
  };
}
