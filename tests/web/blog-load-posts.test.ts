import { describe, expect, it } from "vitest";
import { blogFrontmatterSchema } from "../../apps/web/src/blog/lib/post-schema.js";
import { estimateReadingTimeMinutes } from "../../apps/web/src/blog/lib/reading-time.js";

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
