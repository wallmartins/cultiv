import { describe, expect, it } from "vitest";
import { getShowcaseSamples } from "../../apps/web/src/marketing/content/showcase/get-samples.js";

describe("showcase content catalog", () => {
  it("provides exactly three samples per locale", () => {
    expect(getShowcaseSamples("pt")).toHaveLength(3);
    expect(getShowcaseSamples("en")).toHaveLength(3);
  });

  it("covers blog, linkedin, and thread content types", () => {
    const ids = getShowcaseSamples("pt").map((sample) => sample.id).sort();
    expect(ids).toEqual(["blog-post", "linkedin-post", "thread"]);
  });

  it("formats thread samples with multiple posts", () => {
    for (const locale of ["pt", "en"] as const) {
      const thread = getShowcaseSamples(locale).find((sample) => sample.id === "thread");
      expect(thread?.genericPosts?.length).toBeGreaterThanOrEqual(3);
      expect(thread?.voicePosts?.length).toBeGreaterThanOrEqual(3);
      expect(thread?.genericDocument).toBeUndefined();
    }
  });

  it("formats blog and linkedin samples into post documents", () => {
    for (const locale of ["pt", "en"] as const) {
      const blog = getShowcaseSamples(locale).find((sample) => sample.id === "blog-post");
      const linkedin = getShowcaseSamples(locale).find((sample) => sample.id === "linkedin-post");

      expect(blog?.genericDocument?.title.length).toBeGreaterThan(0);
      expect(blog?.genericDocument?.paragraphs.length).toBeGreaterThanOrEqual(2);
      expect(linkedin?.genericDocument?.paragraphs.length).toBeGreaterThanOrEqual(2);
      expect(blog?.genericPosts).toBeUndefined();
      expect(linkedin?.genericPosts).toBeUndefined();
    }
  });
});
