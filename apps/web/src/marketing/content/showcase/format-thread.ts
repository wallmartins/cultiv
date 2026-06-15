import { chunkSentences, parseNonEmptyLines } from "./prose-blocks.js";

export const SHOWCASE_THREAD_PREVIEW_POST_COUNT = 4;
export const SHOWCASE_CONTENT_PREVIEW_BLOCK_COUNT = SHOWCASE_THREAD_PREVIEW_POST_COUNT;

const DEFAULT_MAX_CHARS = 240;
const NUMBERED_SEGMENT_SPLIT = /\s+(?=\d+\/)/;
const NUMBERED_PREFIX = /^\d+\/\s*/;

export function sliceThreadPostsForPreview(
  posts: readonly string[],
  limit = SHOWCASE_THREAD_PREVIEW_POST_COUNT
): { readonly visible: readonly string[]; readonly hiddenCount: number } {
  if (posts.length <= limit) {
    return { visible: posts, hiddenCount: 0 };
  }

  return {
    visible: posts.slice(0, limit),
    hiddenCount: posts.length - limit
  };
}

export function sliceContentBlocksForPreview(
  blocks: readonly string[],
  limit = SHOWCASE_CONTENT_PREVIEW_BLOCK_COUNT
): { readonly visible: readonly string[]; readonly hiddenCount: number } {
  return sliceThreadPostsForPreview(blocks, limit);
}

export function formatThreadForDisplay(
  raw: string,
  options: { readonly maxChars?: number } = {}
): readonly string[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) {
    return [];
  }

  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const numbered = parseNumberedSegments(normalized);
  if (numbered.length > 1) {
    return numbered;
  }

  const lines = parseNonEmptyLinesWithNumberedPrefix(normalized);
  if (lines.length > 1) {
    return lines;
  }

  const chunked = chunkSentences(normalized, maxChars);
  return chunked.length > 0 ? chunked : [normalized];
}

function parseNumberedSegments(text: string): readonly string[] {
  if (!/\d+\//.test(text)) {
    return [];
  }

  const segments = text
    .split(NUMBERED_SEGMENT_SPLIT)
    .map((segment) => segment.replace(NUMBERED_PREFIX, "").trim())
    .filter((segment) => segment.length > 0);

  return segments.length > 1 ? segments : [];
}

function parseNonEmptyLinesWithNumberedPrefix(text: string): readonly string[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(NUMBERED_PREFIX, "").trim())
    .filter((line) => line.length > 0);

  return lines.length > 1 ? lines : [];
}
