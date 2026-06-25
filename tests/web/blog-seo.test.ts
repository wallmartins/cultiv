import { describe, expect, it } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getBlogIndexPath,
  getBlogPostPath,
  getBlogRssPath,
  getBlogTagPath
} from "../../apps/web/src/blog/seo/blog-paths.js";
import {
  buildBlogIndexJsonLd,
  buildBlogPostingJsonLd,
  buildBlogTagJsonLd
} from "../../apps/web/src/blog/seo/blog-json-ld.js";
import { buildBlogRssXml } from "../../apps/web/src/blog/seo/blog-rss.js";
import { buildBlogSitemapUrlEntries } from "../../apps/web/src/blog/seo/blog-sitemap.server.js";
import { loadBlogPostsFromDirectory } from "../../apps/web/src/blog/lib/load-posts.server.js";
import {
  resolveBlogIndexHead,
  resolveBlogPostHead,
  resolveBlogTagHead
} from "../../apps/web/src/blog/seo/resolve-blog-head.js";
import { buildFullSitemapXml } from "../../apps/web/src/marketing/seo/build-sitemap.server.js";
import { buildSitemapXml } from "../../apps/web/src/marketing/seo/resolve-page-seo.js";

const fixturesRoot = join(dirname(fileURLToPath(import.meta.url)), "../../apps/web/src/blog/__fixtures__");
const fixturesPt = join(fixturesRoot, "pt");
const fixturesPublic = join(fixturesRoot, "public");

describe("blog path helpers", () => {
  it("resolves pt and en blog paths", () => {
    expect(getBlogIndexPath("pt")).toBe("/blog");
    expect(getBlogIndexPath("en")).toBe("/en/blog");
    expect(getBlogPostPath("pt", "hello")).toBe("/blog/hello");
    expect(getBlogPostPath("en", "hello")).toBe("/en/blog/hello");
    expect(getBlogTagPath("pt", "voice")).toBe("/blog/tag/voice");
    expect(getBlogTagPath("en", "voice")).toBe("/en/blog/tag/voice");
    expect(getBlogRssPath("pt")).toBe("/blog/rss.xml");
    expect(getBlogRssPath("en")).toBe("/en/blog/rss.xml");
  });
});

describe("blog head resolvers", () => {
  it("pairs pt and en blog index routes with hreflang alternates", () => {
    const pt = resolveBlogIndexHead("pt");
    const en = resolveBlogIndexHead("en");

    expect(pt.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rel: "canonical", href: expect.stringMatching(/\/blog$/) }),
        expect.objectContaining({ hrefLang: "pt-BR", href: expect.stringMatching(/\/blog$/) }),
        expect.objectContaining({ hrefLang: "en", href: expect.stringMatching(/\/en\/blog$/) })
      ])
    );

    expect(en.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rel: "canonical", href: expect.stringMatching(/\/en\/blog$/) }),
        expect.objectContaining({ hrefLang: "en", href: expect.stringMatching(/\/en\/blog$/) }),
        expect.objectContaining({ hrefLang: "pt-BR", href: expect.stringMatching(/\/blog$/) })
      ])
    );
  });

  it("pairs tag routes across locales", () => {
    const pt = resolveBlogTagHead("pt", "voice", "Voz");
    const en = resolveBlogTagHead("en", "voice", "Voice");

    expect(pt.meta).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "og:title", content: "Posts sobre Voz — Cultiv" })
      ])
    );

    expect(en.meta).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "og:title", content: "Posts about Voice — Cultiv" })
      ])
    );

    expect(pt.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rel: "canonical", href: expect.stringMatching(/\/blog\/tag\/voice$/) }),
        expect.objectContaining({ hrefLang: "en", href: expect.stringMatching(/\/en\/blog\/tag\/voice$/) })
      ])
    );
  });

  it("sets article og:type on post head with absolute cover image", () => {
    const head = resolveBlogPostHead("pt", {
      title: "Hello",
      slug: "hello",
      excerpt: "Excerpt",
      coverImage: "/blog/covers/hello.webp",
      publishedAt: "2026-01-01T10:00:00-03:00",
      tags: ["voice"],
      locale: "pt",
      body: "",
      html: "",
      readingTimeMinutes: 1
    });

    expect(head.meta).toEqual(
      expect.arrayContaining([
        { name: "og:type", content: "article" },
        expect.objectContaining({ name: "og:title", content: "Hello — Cultiv" }),
        expect.objectContaining({ name: "description", content: "Excerpt" }),
        expect.objectContaining({
          name: "og:image",
          content: expect.stringMatching(/\/blog\/covers\/hello\.webp$/)
        })
      ])
    );

    expect(head.links).toEqual([
      expect.objectContaining({ rel: "canonical", href: expect.stringMatching(/\/blog\/hello$/) })
    ]);
    expect(head.links).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ rel: "alternate" })])
    );
  });
});

describe("blog JSON-LD, RSS, and sitemap", () => {
  const siteUrl = "https://cultiv.app";

  it("builds BlogPosting JSON-LD for a post", () => {
    const [post] = loadBlogPostsFromDirectory("pt", fixturesPt, {
      now: new Date("2026-01-01T00:00:00Z"),
      publicDir: fixturesPublic
    });

    const jsonLd = buildBlogPostingJsonLd(post!, siteUrl);

    expect(jsonLd).toEqual(
      expect.objectContaining({
        "@type": "BlogPosting",
        headline: "Post válido",
        url: `${siteUrl}/blog/post-valido`
      })
    );
  });

  it("builds blog index and tag JSON-LD", () => {
    const index = buildBlogIndexJsonLd("pt", siteUrl);
    const tag = buildBlogTagJsonLd("en", "voice", "Voice", siteUrl);

    expect(index["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "@type": "Blog" }),
        expect.objectContaining({ "@type": "CollectionPage" })
      ])
    );
    expect(tag).toEqual(
      expect.objectContaining({
        "@type": "CollectionPage",
        about: "Voice",
        url: `${siteUrl}/en/blog/tag/voice`
      })
    );
  });

  it("builds RSS 2.0 feed with items and enclosure", () => {
    const posts = loadBlogPostsFromDirectory("pt", fixturesPt, {
      now: new Date("2026-01-01T00:00:00Z"),
      publicDir: fixturesPublic
    });
    const rss = buildBlogRssXml("pt", posts, siteUrl);

    expect(rss).toContain("<item>");
    expect(rss).toContain("<enclosure");
    expect(rss).toContain("Post válido");
    expect(rss).toContain("type=\"image/webp\"");
  });

  it("includes blog index and post URLs in sitemap entries", () => {
    const entries = buildBlogSitemapUrlEntries(siteUrl, new Date("2026-01-01T00:00:00Z"));
    const xml = buildFullSitemapXml(siteUrl);

    expect(entries.join("\n")).toContain("<loc>https://cultiv.app/blog</loc>");
    expect(entries.join("\n")).toContain("<loc>https://cultiv.app/en/blog</loc>");
    expect(xml).toContain("https://cultiv.app/blog");
    expect(buildSitemapXml(siteUrl)).not.toContain("https://cultiv.app/blog");
  });
});
