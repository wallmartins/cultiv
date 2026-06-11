import { createFileRoute } from "@tanstack/react-router";
import { buildSitemapXml } from "~/utils/resolve-page-seo";
import { getSiteUrl } from "~/utils/site-url";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildSitemapXml(getSiteUrl()), {
          headers: { "Content-Type": "application/xml; charset=utf-8" }
        })
    }
  }
});
