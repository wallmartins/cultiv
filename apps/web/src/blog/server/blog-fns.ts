import { createServerFn } from "@tanstack/react-start";
import { join } from "node:path";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { resolveBlogContentRoot, resolveBlogPublicDir } from "../lib/blog-content-root.js";
import { getBlogPostBySlug, loadBlogPostsFromDirectory } from "../lib/load-posts.js";
import { getBlogTag } from "../../../content/blog/tags.js";

function getDirs() {
  const contentRoot = resolveBlogContentRoot();
  const publicDir = resolveBlogPublicDir();
  return { contentRoot, publicDir };
}

export const fetchBlogPosts = createServerFn({ method: "GET" })
  .validator((input: { locale: MarketingLocale; tagSlug?: string; includeScheduled?: boolean }) => input)
  .handler(({ data }) => {
    const { contentRoot, publicDir } = getDirs();
    return loadBlogPostsFromDirectory(data.locale, join(contentRoot, data.locale), {
      tagSlug: data.tagSlug,
      includeScheduled: data.includeScheduled ?? false,
      publicDir
    });
  });

export const fetchBlogPost = createServerFn({ method: "GET" })
  .validator((input: { locale: MarketingLocale; slug: string; includeScheduled?: boolean }) => input)
  .handler(({ data }) => {
    const { contentRoot, publicDir } = getDirs();
    const post = getBlogPostBySlug(
      data.locale,
      data.slug,
      join(contentRoot, data.locale),
      { includeScheduled: data.includeScheduled ?? false, publicDir }
    );
    if (!post) {
      throw new Response("Not Found", { status: 404 });
    }
    return post;
  });

export const fetchBlogTagPage = createServerFn({ method: "GET" })
  .validator((input: { locale: MarketingLocale; tagSlug: string; includeScheduled?: boolean }) => input)
  .handler(({ data }) => {
    const tag = getBlogTag(data.tagSlug);
    if (!tag) {
      throw new Response("Not Found", { status: 404 });
    }
    const { contentRoot, publicDir } = getDirs();
    const posts = loadBlogPostsFromDirectory(data.locale, join(contentRoot, data.locale), {
      tagSlug: data.tagSlug,
      includeScheduled: data.includeScheduled ?? false,
      publicDir
    });
    if (posts.length === 0) {
      throw new Response("Not Found", { status: 404 });
    }
    return { tag, posts };
  });
