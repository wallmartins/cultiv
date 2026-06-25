import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import type { BlogPost } from "../lib/post-schema";
import { getBlogIndexPath, getBlogPostPath } from "./blog-paths";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildBlogRssXml(
  locale: MarketingLocale,
  posts: ReadonlyArray<BlogPost>,
  siteUrl: string
): string {
  const messages = getLocaleMessages(locale);
  const channelUrl = `${siteUrl}${getBlogIndexPath(locale)}`;
  const language = locale === "pt" ? "pt-br" : "en";

  const items = posts
    .map((post) => {
      const link = `${siteUrl}${getBlogPostPath(locale, post.slug)}`;
      const pubDate = new Date(post.publishedAt).toUTCString();
      const coverUrl = `${siteUrl}${post.coverImage}`;

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <enclosure url="${escapeXml(coverUrl)}" type="image/webp" />
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(messages.blog.rssTitle)}</title>
    <link>${escapeXml(channelUrl)}</link>
    <description>${escapeXml(messages.blog.indexDescription)}</description>
    <language>${language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}
