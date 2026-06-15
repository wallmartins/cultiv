import { describe, expect, it } from "vitest";
import {
  formatProseDocument,
  resolveDocumentFallbackTitle,
  sliceDocumentForPreview
} from "../../apps/web/src/marketing/content/showcase/format-prose-document.js";

describe("formatProseDocument", () => {
  it("parses a markdown title and body paragraphs", () => {
    const document = formatProseDocument(
      "# Sustainable productivity\n\nFirst paragraph.\n\nSecond paragraph.",
      "long-form-blog",
      "Fallback title"
    );

    expect(document.title).toBe("Sustainable productivity");
    expect(document.titleFromMarkdown).toBe(true);
    expect(document.paragraphs).toEqual(["First paragraph.", "Second paragraph."]);
  });

  it("uses the briefing topic as fallback title", () => {
    const document = formatProseDocument(
      "One long paragraph without markdown title.",
      "linkedin-post",
      "Aprendizado contínuo na carreira"
    );

    expect(document.title).toBe("Aprendizado contínuo na carreira");
    expect(document.titleFromMarkdown).toBe(false);
    expect(document.paragraphs.length).toBeGreaterThanOrEqual(1);
  });

  it("slices documents for preview while keeping the title", () => {
    const document = formatProseDocument(
      "# Title\n\nFirst paragraph.\n\nSecond paragraph.\n\nThird paragraph.\n\nFourth paragraph.",
      "long-form-blog",
      "Fallback title"
    );
    const preview = sliceDocumentForPreview(document, 2);

    expect(preview.title).toBe("Title");
    expect(preview.paragraphs).toHaveLength(2);
    expect(preview.hiddenParagraphCount).toBeGreaterThan(0);
  });
});

describe("resolveDocumentFallbackTitle", () => {
  it("prefers the briefing topic when available", () => {
    expect(
      resolveDocumentFallbackTitle({ topic: "Produtividade sustentável" }, "Blog post")
    ).toBe("Produtividade sustentável");
  });

  it("falls back to the content type label", () => {
    expect(resolveDocumentFallbackTitle({}, "Blog post")).toBe("Blog post");
  });
});
