import { describe, expect, it } from "vitest";
import { formatProseForDisplay } from "../../apps/web/src/marketing/content/showcase/format-prose-for-display.js";

const blogBlob =
  "First sentence about sustainable work and why limits matter in knowledge jobs. Second sentence expands the idea with a concrete example from a busy week. Third sentence adds context about how rest changed my output. Fourth sentence continues the narrative with another observation from practice. Fifth sentence introduces a new angle about curation and focus. Sixth sentence reinforces the point with a sharper takeaway. Seventh sentence wraps the section by naming what actually changed.";

describe("formatProseForDisplay", () => {
  it("splits existing line breaks into paragraphs", () => {
    const blocks = formatProseForDisplay("Opening paragraph.\n\nSecond paragraph.", "long-form-blog");

    expect(blocks).toEqual(["Opening paragraph.", "Second paragraph."]);
  });

  it("chunks blog prose into readable paragraphs", () => {
    const blocks = formatProseForDisplay(blogBlob, "long-form-blog");

    expect(blocks.length).toBeGreaterThan(1);
    expect(blocks.every((block) => block.length <= 420)).toBe(true);
  });

  it("chunks linkedin prose into shorter blocks", () => {
    const blocks = formatProseForDisplay(blogBlob, "linkedin-post");

    expect(blocks.length).toBeGreaterThanOrEqual(2);
    expect(blocks.every((block) => block.length <= 260)).toBe(true);
  });

  it("returns an empty array for blank input", () => {
    expect(formatProseForDisplay("   ", "linkedin-post")).toEqual([]);
  });
});
