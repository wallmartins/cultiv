import { describe, expect, it } from "vitest";
import {
  buildRobotsTxt,
  buildSitemapXml,
  getAlternatePagePath,
  resolvePageSeo
} from "../../apps/web/src/marketing/seo/resolve-page-seo.js";

describe("seo meta resolver", () => {
  it("pairs pt and en home routes with hreflang alternates", () => {
    const pt = resolvePageSeo({ kind: "home", locale: "pt" });
    const en = resolvePageSeo({ kind: "home", locale: "en" });

    expect(getAlternatePagePath({ kind: "home", locale: "pt" })).toBe("/en");
    expect(getAlternatePagePath({ kind: "home", locale: "en" })).toBe("/");

    expect(pt.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rel: "canonical", href: expect.stringMatching(/\/$/) }),
        expect.objectContaining({ hrefLang: "pt-BR", href: expect.stringMatching(/\/$/) }),
        expect.objectContaining({ hrefLang: "en", href: expect.stringMatching(/\/en$/) })
      ])
    );

    expect(en.meta).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "description" }),
        expect.objectContaining({ name: "og:site_name", content: "Cultiv" }),
        expect.objectContaining({ name: "og:title" }),
        expect.objectContaining({ name: "og:url" }),
        expect.objectContaining({ name: "og:image", content: expect.stringMatching(/\/cultiv-og-cartography\.svg$/) }),
        expect.objectContaining({ name: "og:image:width", content: "1200" }),
        expect.objectContaining({ name: "og:image:height", content: "630" }),
        expect.objectContaining({ name: "twitter:card", content: "summary_large_image" }),
        expect.objectContaining({ name: "twitter:image", content: expect.stringMatching(/\/cultiv-og-cartography\.svg$/) })
      ])
    );
  });

  it("builds robots.txt and sitemap.xml for public routes", () => {
    const siteUrl = "https://cultiv.app";

    expect(buildRobotsTxt(siteUrl)).toContain("Sitemap: https://cultiv.app/sitemap.xml");
    expect(buildRobotsTxt(siteUrl)).toContain("User-agent: GPTBot");
    expect(buildRobotsTxt(siteUrl)).toContain("# LLM product documentation: https://cultiv.app/llms.txt");

    const sitemap = buildSitemapXml(siteUrl);
    expect(sitemap).toContain("<loc>https://cultiv.app/</loc>");
    expect(sitemap).toContain("<loc>https://cultiv.app/en</loc>");
    expect(sitemap).toContain("<loc>https://cultiv.app/privacy</loc>");
    expect(sitemap).toContain("<loc>https://cultiv.app/en/terms</loc>");
    expect(sitemap).toContain("<loc>https://cultiv.app/llms.txt</loc>");
    expect(sitemap).toContain("<loc>https://cultiv.app/en/llms-full.txt</loc>");
  });

  it("pairs legal routes across locales", () => {
    expect(getAlternatePagePath({ kind: "privacy", locale: "pt" })).toBe("/en/privacy");
    expect(getAlternatePagePath({ kind: "terms", locale: "en" })).toBe("/terms");

    const privacy = resolvePageSeo({ kind: "privacy", locale: "pt" });
    expect(privacy.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rel: "canonical", href: expect.stringMatching(/\/privacy$/) }),
        expect.objectContaining({ hrefLang: "en", href: expect.stringMatching(/\/en\/privacy$/) })
      ])
    );
  });
});
