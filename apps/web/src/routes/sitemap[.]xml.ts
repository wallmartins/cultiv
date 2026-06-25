import { createFileRoute } from "@tanstack/react-router";
import { getSiteUrl } from "~/marketing/seo/site-url";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { buildFullSitemapXml } = await import("~/marketing/seo/build-sitemap.server");
        return new Response(buildFullSitemapXml(getSiteUrl()), {
          headers: { "Content-Type": "application/xml; charset=utf-8" }
        });
      }
    }
  }
});
