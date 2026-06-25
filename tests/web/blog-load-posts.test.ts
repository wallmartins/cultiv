import { describe, expect, it } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { blogFrontmatterSchema } from "../../apps/web/src/blog/lib/post-schema.js";
import { estimateReadingTimeMinutes } from "../../apps/web/src/blog/lib/reading-time.js";
import { loadBlogPostsFromDirectory } from "../../apps/web/src/blog/lib/load-posts.js";

const fixturesRoot = join(dirname(fileURLToPath(import.meta.url)), "../../apps/web/src/blog/__fixtures__");
const fixturesPt = join(fixturesRoot, "pt");
const fixturesPublic = join(fixturesRoot, "public");

describe("blogFrontmatterSchema", () => {
  const base = {
    title: "Título",
    slug: "titulo",
    publishedAt: "2026-01-01T10:00:00-03:00",
    excerpt: "Resumo curto.",
    coverImage: "/blog/covers/titulo.webp",
    tags: ["voice"] as const
  };

  it("accepts valid frontmatter", () => {
    expect(blogFrontmatterSchema.parse(base).slug).toBe("titulo");
  });

  it("rejects unknown tag", () => {
    expect(() => blogFrontmatterSchema.parse({ ...base, tags: ["nope"] })).toThrow();
  });

  it("rejects excerpt over 200 chars", () => {
    expect(() =>
      blogFrontmatterSchema.parse({ ...base, excerpt: "x".repeat(201) })
    ).toThrow();
  });
});

describe("estimateReadingTimeMinutes", () => {
  it("returns at least 1 minute", () => {
    expect(estimateReadingTimeMinutes("hello world")).toBe(1);
  });
});

describe("loadBlogPostsFromDirectory", () => {
  it("filters future publishedAt when includeScheduled is false", () => {
    const posts = loadBlogPostsFromDirectory("pt", fixturesPt, {
      now: new Date("2026-01-01T00:00:00Z"),
      includeScheduled: false,
      publicDir: fixturesPublic
    });
    expect(posts.map((p) => p.slug)).toEqual(["post-valido"]);
  });

  it("includes scheduled posts when includeScheduled is true", () => {
    const posts = loadBlogPostsFromDirectory("pt", fixturesPt, {
      now: new Date("2026-01-01T00:00:00Z"),
      includeScheduled: true,
      publicDir: fixturesPublic
    });
    expect(posts.map((p) => p.slug).sort()).toEqual(["post-futuro", "post-valido"]);
  });

  it("filters by tagSlug", () => {
    const posts = loadBlogPostsFromDirectory("pt", fixturesPt, {
      now: new Date("2026-01-01T00:00:00Z"),
      includeScheduled: true,
      tagSlug: "product",
      publicDir: fixturesPublic
    });
    expect(posts.map((p) => p.slug)).toEqual(["post-futuro"]);
  });
});
