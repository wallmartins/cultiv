import { createServerFn } from "@tanstack/react-start";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { getBlogTag } from "../../../content/blog/tags.js";

export const fetchBlogPosts = createServerFn({ method: "GET" })
  .validator((input: { locale: MarketingLocale; tagSlug?: string; includeScheduled?: boolean }) => input)
  .handler(async ({ data }) => {
    const { resolveBlogPublicDir } = await import("../lib/blog-content-root.server.js");
    const { loadBlogPostsFromDirectory } = await import("../lib/load-posts.server.js");
    const publicDir = resolveBlogPublicDir();
    return loadBlogPostsFromDirectory(data.locale, {
      tagSlug: data.tagSlug,
      includeScheduled: data.includeScheduled ?? false,
      publicDir
    });
  });

export const fetchBlogPost = createServerFn({ method: "GET" })
  .validator((input: { locale: MarketingLocale; slug: string; includeScheduled?: boolean }) => input)
  .handler(async ({ data }) => {
    const { resolveBlogPublicDir } = await import("../lib/blog-content-root.server.js");
    const { getBlogPostBySlug } = await import("../lib/load-posts.server.js");
    const publicDir = resolveBlogPublicDir();
    const post = getBlogPostBySlug(data.locale, data.slug, {
      includeScheduled: data.includeScheduled ?? false,
      publicDir
    });
    if (!post) {
      throw new Response("Not Found", { status: 404 });
    }
    return post;
  });

export const fetchBlogTagPage = createServerFn({ method: "GET" })
  .validator((input: { locale: MarketingLocale; tagSlug: string; includeScheduled?: boolean }) => input)
  .handler(async ({ data }) => {
    const tag = getBlogTag(data.tagSlug);
    if (!tag) {
      throw new Response("Not Found", { status: 404 });
    }
    const { resolveBlogPublicDir } = await import("../lib/blog-content-root.server.js");
    const { loadBlogPostsFromDirectory } = await import("../lib/load-posts.server.js");
    const publicDir = resolveBlogPublicDir();
    const posts = loadBlogPostsFromDirectory(data.locale, {
      tagSlug: data.tagSlug,
      includeScheduled: data.includeScheduled ?? false,
      publicDir
    });
    if (posts.length === 0) {
      throw new Response("Not Found", { status: 404 });
    }
    return { tag, posts };
  });
