import type { QuantitativeSignals } from "@my-ai-orchestrator/contracts";
import type { OutputWordTarget } from "../format/word-targets.js";
import { countWords } from "../format/output-length.js";

export interface ReadabilityLimits {
  readonly maxSentenceWords: number;
  readonly maxParagraphWords: number;
  readonly maxCommasPerSentence: number;
}

export interface ReadabilityFinding {
  readonly message: string;
  readonly severity: "medium" | "high";
}

function splitSentences(text: string): readonly string[] {
  return text
    .split(/[.!?]+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function splitParagraphs(text: string): readonly string[] {
  return text
    .split(/\n\s*\n+/u)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function tokenizeWords(text: string): readonly string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9à-ú]+/iu)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function resolveReadabilityLimits(args: {
  readonly target: OutputWordTarget;
  readonly quantitativeSignals?: QuantitativeSignals;
}): ReadabilityLimits {
  const authorSentence = args.quantitativeSignals?.aggregate.avgSentenceLength ?? 18;
  const authorParagraph = args.quantitativeSignals?.aggregate.avgParagraphLength ?? 60;
  const isShortForm = args.target.maxWords <= 350;

  const channelSentenceCap = isShortForm ? 35 : 45;
  const channelParagraphCap = isShortForm ? 95 : 130;

  return {
    maxSentenceWords: Math.min(Math.round(authorSentence * 1.4), channelSentenceCap),
    maxParagraphWords: Math.min(Math.round(authorParagraph * 1.35), channelParagraphCap),
    maxCommasPerSentence: authorSentence >= 22 ? 4 : 3
  };
}

export function collectReadabilityFindings(
  text: string,
  limits: ReadabilityLimits
): readonly ReadabilityFinding[] {
  const findings: ReadabilityFinding[] = [];

  for (const sentence of splitSentences(text)) {
    const words = tokenizeWords(sentence);
    const commas = (sentence.match(/,/g) ?? []).length;

    if (words.length > limits.maxSentenceWords) {
      findings.push({
        severity: words.length > limits.maxSentenceWords * 1.25 ? "high" : "medium",
        message: `Sentence exceeds readability cap (${words.length} words, max ${limits.maxSentenceWords})`
      });
    }

    if (commas > limits.maxCommasPerSentence) {
      findings.push({
        severity: "medium",
        message: `Sentence is too dense with commas (${commas}, max ${limits.maxCommasPerSentence})`
      });
    }
  }

  for (const paragraph of splitParagraphs(text)) {
    const words = countWords(paragraph);
    if (words > limits.maxParagraphWords) {
      findings.push({
        severity: words > limits.maxParagraphWords * 1.2 ? "high" : "medium",
        message: `Paragraph exceeds readability cap (${words} words, max ${limits.maxParagraphWords})`
      });
    }
  }

  const trigramHits = countCrossParagraphTrigramRepeats(text);
  if (trigramHits >= 3) {
    findings.push({
      severity: trigramHits >= 5 ? "high" : "medium",
      message: "Text repeats phrasing across paragraphs"
    });
  }

  return findings;
}

function countCrossParagraphTrigramRepeats(text: string): number {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length < 2) {
    return 0;
  }

  const seen = new Map<string, number>();
  let repeats = 0;

  for (const paragraph of paragraphs) {
    const words = tokenizeWords(paragraph);
    const local = new Set<string>();

    for (let index = 0; index < words.length - 2; index += 1) {
      const trigram = `${words[index]} ${words[index + 1]} ${words[index + 2]}`;
      if (local.has(trigram)) {
        continue;
      }
      local.add(trigram);
      const total = (seen.get(trigram) ?? 0) + 1;
      seen.set(trigram, total);
      if (total > 1) {
        repeats += 1;
      }
    }
  }

  return repeats;
}
