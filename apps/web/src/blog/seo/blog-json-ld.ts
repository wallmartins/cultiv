import { blogAuthor } from "../../../content/blog/author.js";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import type { BlogPost } from "../lib/post-schema";
import { getBlogIndexPath, getBlogPostPath, getBlogTagPath } from "./blog-paths";

function toSchemaLanguage(locale: MarketingLocale): string {
  return locale === "pt" ? "pt-BR" : "en";
}

export function buildBlogIndexJsonLd(locale: MarketingLocale, siteUrl: string) {
  const messages = getLocaleMessages(locale);
  const url = `${siteUrl}${getBlogIndexPath(locale)}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${url}#blog`,
        url,
        name: messages.blog.indexTitle,
        description: messages.blog.indexDescription,
        inLanguage: toSchemaLanguage(locale),
        publisher: { "@id": `${siteUrl}/#organization` }
      },
      {
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        url,
        name: messages.blog.indexTitle,
        description: messages.blog.indexDescription,
        inLanguage: toSchemaLanguage(locale),
        isPartOf: { "@id": `${siteUrl}/#website` },
        publisher: { "@id": `${siteUrl}/#organization` }
      }
    ]
  };
}

export function buildBlogPostingJsonLd(post: BlogPost, siteUrl: string) {
  const url = `${siteUrl}${getBlogPostPath(post.locale, post.slug)}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    image: `${siteUrl}${post.coverImage}`,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: blogAuthor.name[post.locale]
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Cultiv"
    },
    inLanguage: toSchemaLanguage(post.locale),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url
    },
    url
  };
}

export function buildBlogTagJsonLd(
  locale: MarketingLocale,
  tagSlug: string,
  tagLabel: string,
  siteUrl: string
) {
  const messages = getLocaleMessages(locale);
  const url = `${siteUrl}${getBlogTagPath(locale, tagSlug)}`;
  const title = messages.blog.tagPageTitle.replace("{tag}", tagLabel);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description: messages.blog.indexDescription,
    about: tagLabel,
    inLanguage: toSchemaLanguage(locale),
    isPartOf: { "@id": `${siteUrl}/#website` },
    publisher: { "@id": `${siteUrl}/#organization` }
  };
}
