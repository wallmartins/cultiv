import { createFileRoute } from "@tanstack/react-router";
import { buildBlogRssXml } from "~/blog/seo/blog-rss";
import { fetchBlogPosts } from "~/blog/server/blog-fns";
import { getSiteUrl } from "~/marketing/seo/site-url";

export const Route = createFileRoute("/blog/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const posts = await fetchBlogPosts({ data: { locale: "pt" } });
        return new Response(buildBlogRssXml("pt", posts, getSiteUrl()), {
          headers: { "Content-Type": "application/rss+xml; charset=utf-8" }
        });
      }
    }
  }
});
