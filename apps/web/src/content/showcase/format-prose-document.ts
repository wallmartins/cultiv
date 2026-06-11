import type { MarketingContentTypeId } from "../content-types/catalog.js";
import type { ShowcasePostDocument } from "./types.js";
import { formatProseForDisplay } from "./format-prose-for-display.js";
import { SHOWCASE_CONTENT_PREVIEW_BLOCK_COUNT, sliceContentBlocksForPreview } from "./format-thread.js";

const MARKDOWN_TITLE_PATTERN = /^#\s+(.+?)(?:\n+([\s\S]*))?$/;

export function formatProseDocument(
  raw: string,
  contentTypeId: MarketingContentTypeId,
  fallbackTitle: string
): ShowcasePostDocument {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) {
    return {
      title: fallbackTitle,
      paragraphs: [],
      titleFromMarkdown: false
    };
  }

  const markdownMatch = normalized.match(MARKDOWN_TITLE_PATTERN);
  if (markdownMatch) {
    const title = markdownMatch[1].trim();
    const body = (markdownMatch[2] ?? "").trim();
    return {
      title,
      paragraphs: formatProseForDisplay(body, contentTypeId),
      titleFromMarkdown: true
    };
  }

  return {
    title: fallbackTitle,
    paragraphs: formatProseForDisplay(normalized, contentTypeId),
    titleFromMarkdown: false
  };
}

export function sliceDocumentForPreview(
  document: ShowcasePostDocument,
  limit = SHOWCASE_CONTENT_PREVIEW_BLOCK_COUNT
): ShowcasePostDocument & { readonly hiddenParagraphCount: number } {
  const preview = sliceContentBlocksForPreview(document.paragraphs, limit);

  return {
    title: document.title,
    paragraphs: preview.visible,
    titleFromMarkdown: document.titleFromMarkdown,
    hiddenParagraphCount: preview.hiddenCount
  };
}

export function resolveDocumentFallbackTitle(
  briefingInput: Readonly<Record<string, string | readonly string[]>>,
  contentTypeLabel: string
): string {
  const topic = briefingInput.topic;
  return typeof topic === "string" && topic.trim().length > 0 ? topic.trim() : contentTypeLabel;
}
