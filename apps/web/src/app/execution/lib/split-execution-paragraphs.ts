import { chunkSentences, parseNonEmptyLines } from "~/marketing/content/showcase/prose-blocks";

const EXECUTION_PARAGRAPH_MAX_CHARS = 420;

export function splitExecutionContentParagraphs(content: string): readonly string[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) {
    return [];
  }

  const byBlankLine = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (byBlankLine.length > 1) {
    return byBlankLine;
  }

  const single = byBlankLine[0] ?? normalized;
  const byLine = parseNonEmptyLines(single);
  if (byLine.length > 1) {
    return byLine;
  }

  const chunked = chunkSentences(single, EXECUTION_PARAGRAPH_MAX_CHARS);
  return chunked.length > 0 ? chunked : [single];
}
