import type { MarketingLocale } from "~/i18n/marketing/types";
import { loadBlogPostsFromDirectory } from "../lib/load-posts.server.js";
import { getBlogIndexPath, getBlogPostPath, getBlogTagPath } from "./blog-paths";

const BLOG_LOCALES: readonly MarketingLocale[] = ["pt", "en"];

function formatLastmod(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildUrlEntry(
  siteUrl: string,
  path: string,
  priority: string,
  changefreq: string,
  lastmod?: string
): string {
  const lastmodLine = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  return `  <url>
    <loc>${siteUrl}${path}</loc>${lastmodLine}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export function buildBlogSitemapUrlEntries(siteUrl: string, now = new Date()): string[] {
  const buildDate = formatLastmod(now);
  const entries: string[] = [];

  for (const locale of BLOG_LOCALES) {
    entries.push(
      buildUrlEntry(siteUrl, getBlogIndexPath(locale), "0.8", "weekly", buildDate)
    );

    const posts = loadBlogPostsFromDirectory(locale, { now });

    for (const post of posts) {
      entries.push(
        buildUrlEntry(
          siteUrl,
          getBlogPostPath(locale, post.slug),
          "0.7",
          "monthly",
          formatLastmod(new Date(post.publishedAt))
        )
      );
    }

    const tagsWithPosts = new Set<string>();
    for (const post of posts) {
      for (const tag of post.tags) {
        tagsWithPosts.add(tag);
      }
    }

    for (const tagSlug of tagsWithPosts) {
      entries.push(
        buildUrlEntry(
          siteUrl,
          getBlogTagPath(locale, tagSlug),
          "0.5",
          "weekly",
          buildDate
        )
      );
    }
  }

  return entries;
}
