import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { aeoAstroIntegration } from "aeo.js/astro";

// TODO: confirm https://cultiv.app as the production marketing origin before
// launch — Layout.astro (canonical/og) and the aeo.js config below derive from it.
const SITE = "https://cultiv.app";

export default defineConfig({
  site: SITE,
  build: { inlineStylesheets: "always" },
  integrations: [
    sitemap({
      // The 404 page is served for missing routes, never crawled as content.
      filter: (page) => !page.includes("/404"),
    }),
    // AEO (Answer Engine Optimization): generates robots.txt (AI-crawler
    // allowances), llms.txt / llms-full.txt, per-page markdown mirrors,
    // docs.json and ai-index.json from the built HTML, and injects the
    // <link rel="alternate"> discovery tags. Our hand-written canonical/OG/
    // JSON-LD win — aeo.js only fills gaps (its injection is presence-guarded).
    aeoAstroIntegration({
      title: "Cultiv",
      description:
        "Cultiv é um motor de escrita com IA que aprende a sua voz — tom, ritmo, vocabulário e raciocínio — e gera textos que só poderiam ser seus.",
      url: SITE,
      generators: {
        robotsTxt: true,
        llmsTxt: true,
        llmsFullTxt: true,
        rawMarkdown: true,
        manifest: true,
        aiIndex: true,
        schema: true,
        // @astrojs/sitemap already emits sitemap-index.xml; two sitemaps
        // disagreeing is worse than one.
        sitemap: false,
      },
      robots: {
        sitemap: `${SITE}/sitemap-index.xml`,
      },
      schema: {
        enabled: true,
        organization: {
          name: "Cultiv",
          url: SITE,
          logo: `${SITE}/brand/icon-dark-bg.svg`,
        },
        defaultType: "WebPage",
      },
      og: {
        enabled: true,
        image: `${SITE}/og-image.png`,
        type: "website",
      },
      // The human/AI toggle widget is a demo gimmick, not discoverability —
      // and it would float over the constellation legend.
      widget: { enabled: false },
    }),
  ],
});
