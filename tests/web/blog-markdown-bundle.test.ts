import { describe, expect, it } from "vitest";
import { listBundledBlogMarkdown } from "../../apps/web/src/blog/lib/blog-markdown-bundle.server.js";

describe("listBundledBlogMarkdown", () => {
  it("includes shipped pt blog markdown in the server bundle", () => {
    const files = listBundledBlogMarkdown("pt");
    const slugs = files.map((file) => file.file);

    expect(slugs.some((name) => name.endsWith(".md"))).toBe(true);
    expect(files.some((file) => file.raw.includes("slug:"))).toBe(true);
  });
});
