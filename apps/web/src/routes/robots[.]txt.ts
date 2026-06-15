import { createFileRoute } from "@tanstack/react-router";
import { buildRobotsTxt } from "~/marketing/seo/resolve-page-seo";
import { getSiteUrl } from "~/marketing/seo/site-url";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildRobotsTxt(getSiteUrl()), {
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
    }
  }
});
