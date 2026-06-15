import { describe, expect, it } from "vitest";
import { buildHomeJsonLdGraph, buildLegalPageJsonLd } from "../../apps/web/src/marketing/seo/geo/json-ld.js";
import { buildGeoRobotsTxt, buildLlmsFullTxt, buildLlmsTxt } from "../../apps/web/src/marketing/seo/geo/llms.js";
import { resolveHomePageHead } from "../../apps/web/src/marketing/seo/resolve-page-head.js";

describe("GEO package", () => {
  it("builds llms.txt with product facts and locale links", () => {
    const pt = buildLlmsTxt("pt");
    const en = buildLlmsTxt("en");

    expect(pt).toContain("# Cultiv");
    expect(pt).toContain("Textos que soam como você");
    expect(pt).toContain("/llms-full.txt");
    expect(pt).toContain("/en/llms.txt");
    expect(en).toContain("Text that sounds like you");
    expect(en).toContain("/llms.txt");
  });

  it("builds llms-full.txt with FAQ and method sections", () => {
    const full = buildLlmsFullTxt("pt");

    expect(full).toContain("documentação completa");
    expect(full).toContain("## Perguntas frequentes");
    expect(full).toContain("O que é o Cultiv?");
    expect(full).toContain("## Como funciona");
    expect(full).toContain("Entre na plataforma");
  });

  it("allows AI crawlers in robots.txt", () => {
    const robots = buildGeoRobotsTxt("https://cultiv.app");

    expect(robots).toContain("User-agent: GPTBot");
    expect(robots).toContain("User-agent: ClaudeBot");
    expect(robots).toContain("# LLM product documentation: https://cultiv.app/llms.txt");
  });

  it("builds JSON-LD graph for home and legal pages", () => {
    const home = buildHomeJsonLdGraph("pt");

    expect(home["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "@type": "Organization", name: "Cultiv" }),
        expect.objectContaining({ "@type": "WebSite" }),
        expect.objectContaining({ "@type": "SoftwareApplication" }),
        expect.objectContaining({
          "@type": "FAQPage",
          mainEntity: expect.arrayContaining([
            expect.objectContaining({ name: "O que é o Cultiv?" })
          ])
        })
      ])
    );

    const privacy = buildLegalPageJsonLd("en", "privacy");
    expect(privacy).toEqual(
      expect.objectContaining({
        "@type": "WebPage",
        url: expect.stringMatching(/\/en\/privacy$/)
      })
    );
  });

  it("links llms files from home page head", () => {
    const head = resolveHomePageHead("pt");

    expect(head.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "text/plain",
          href: expect.stringMatching(/\/llms\.txt$/)
        }),
        expect.objectContaining({
          type: "text/plain",
          href: expect.stringMatching(/\/llms-full\.txt$/)
        })
      ])
    );
  });
});
