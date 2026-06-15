import type { MarketingContentTypeId } from "../content-types/catalog.js";
import { chunkSentences, parseNonEmptyLines } from "./prose-blocks.js";

const LINKEDIN_MAX_CHARS = 260;
const BLOG_MAX_CHARS = 420;

export function formatProseForDisplay(
  raw: string,
  contentTypeId: MarketingContentTypeId
): readonly string[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) {
    return [];
  }

  const paragraphs = parseNonEmptyLines(normalized);
  if (paragraphs.length > 1) {
    return paragraphs;
  }

  const maxChars = contentTypeId === "linkedin-post" ? LINKEDIN_MAX_CHARS : BLOG_MAX_CHARS;
  const chunked = chunkSentences(normalized, maxChars);
  return chunked.length > 0 ? chunked : [normalized];
}
