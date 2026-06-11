import { createFileRoute } from "@tanstack/react-router";
import { buildRobotsTxt } from "~/utils/resolve-page-seo";
import { getSiteUrl } from "~/utils/site-url";

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
