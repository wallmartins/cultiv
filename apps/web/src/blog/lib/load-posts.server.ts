import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { listBundledBlogMarkdown, type BlogMarkdownFile } from "./blog-markdown-bundle.server.js";
import { blogFrontmatterSchema, type BlogPost } from "./post-schema.js";
import { renderMarkdownToHtml } from "./render-markdown.js";
import { estimateReadingTimeMinutes } from "./reading-time.js";

export type LoadBlogPostsOptions = {
  readonly now?: Date;
  readonly includeScheduled?: boolean;
  readonly tagSlug?: string;
  readonly publicDir?: string;
  readonly contentLocaleDir?: string;
};

function assertCoverExists(coverImage: string, publicDir: string | undefined) {
  if (!publicDir || !existsSync(publicDir)) {
    return;
  }

  const filePath = join(publicDir, coverImage.replace(/^\//, ""));
  if (!existsSync(filePath)) {
    throw new Error(`Missing cover image: ${coverImage} (expected at ${filePath})`);
  }
}

function readMarkdownFiles(
  locale: MarketingLocale,
  contentLocaleDir: string | undefined
): BlogMarkdownFile[] {
  if (contentLocaleDir) {
    if (!existsSync(contentLocaleDir)) {
      return [];
    }

    return readdirSync(contentLocaleDir)
      .filter((file) => file.endsWith(".md"))
      .map((file) => ({
        file,
        raw: readFileSync(join(contentLocaleDir, file), "utf8")
      }));
  }

  return listBundledBlogMarkdown(locale);
}

export function loadBlogPostsFromDirectory(
  locale: MarketingLocale,
  options: LoadBlogPostsOptions = {}
): BlogPost[] {
  const now = options.now ?? new Date();
  const includeScheduled = options.includeScheduled ?? false;
  const files = readMarkdownFiles(locale, options.contentLocaleDir);
  const posts: BlogPost[] = [];
  const seenSlugs = new Set<string>();

  for (const { raw } of files) {
    const { data, content } = matter(raw);
    const frontmatter = blogFrontmatterSchema.parse(data);

    if (seenSlugs.has(frontmatter.slug)) {
      throw new Error(`Duplicate blog slug in ${locale}: ${frontmatter.slug}`);
    }
    seenSlugs.add(frontmatter.slug);

    assertCoverExists(frontmatter.coverImage, options.publicDir);

    const publishedAt = new Date(frontmatter.publishedAt);
    if (!includeScheduled && publishedAt > now) {
      continue;
    }

    if (options.tagSlug && !frontmatter.tags.includes(options.tagSlug as never)) {
      continue;
    }

    posts.push({
      ...frontmatter,
      locale,
      body: content.trim(),
      html: renderMarkdownToHtml(content),
      readingTimeMinutes: estimateReadingTimeMinutes(content)
    });
  }

  return posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getBlogPostBySlug(
  locale: MarketingLocale,
  slug: string,
  options: LoadBlogPostsOptions = {}
): BlogPost | undefined {
  return loadBlogPostsFromDirectory(locale, {
    ...options,
    includeScheduled: options.includeScheduled ?? false
  }).find((post) => post.slug === slug);
}
