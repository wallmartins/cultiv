import { describe, expect, it } from "vitest";
import {
  getBlogIndexPath,
  getBlogPostPath,
  getBlogRssPath,
  getBlogTagPath
} from "../../apps/web/src/blog/seo/blog-paths.js";
import {
  resolveBlogIndexHead,
  resolveBlogPostHead,
  resolveBlogTagHead
} from "../../apps/web/src/blog/seo/resolve-blog-head.js";

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
