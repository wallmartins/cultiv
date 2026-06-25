import { buildBlogSitemapUrlEntries } from "~/blog/seo/blog-sitemap.server";
import { buildSitemapXml } from "./resolve-page-seo";

export function buildFullSitemapXml(siteUrl: string): string {
  const staticXml = buildSitemapXml(siteUrl);
  const blogUrls = buildBlogSitemapUrlEntries(siteUrl);
  if (blogUrls.length === 0) {
    return staticXml;
  }

  const closingIndex = staticXml.lastIndexOf("</urlset>");
  if (closingIndex === -1) {
    return staticXml;
  }

  return `${staticXml.slice(0, closingIndex)}\n${blogUrls.join("\n")}\n${staticXml.slice(closingIndex)}`;
}
