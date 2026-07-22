import { countEmDashes } from "./em-dash.js";

const STOPWORDS = new Set([
  "a",
  "o",
  "os",
  "as",
  "um",
  "uma",
  "uns",
  "umas",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "por",
  "para",
  "com",
  "sem",
  "sobre",
  "que",
  "e",
  "ou",
  "se",
  "the",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "is",
  "are",
  "was",
  "were",
  "be",
  "this",
  "that",
  "it",
  "as",
  "at",
  "by",
  "an",
  "from",
  "eu",
  "me",
  "meu",
  "minha",
  "meus",
  "minhas",
  "isso",
  "essa",
  "esse",
  "como",
  "mais",
  "muito",
  "quando",
  "onde",
  "porque",
  "mas",
  "ainda",
  "já",
  "ja",
  "só",
  "so",
  "não",
  "nao"
]);

export interface LexicalQualityMetrics {
  readonly typeTokenRatio: number;
  readonly topTermConcentration: number;
  readonly repeatedBigramCount: number;
  readonly spacedLemmaRepeats: number;
  readonly emDashCount: number;
}

export interface LexicalQualityEvaluation {
  readonly metrics: LexicalQualityMetrics;
  readonly findings: readonly string[];
  readonly penalty: number;
}

export function evaluateLexicalQuality(
  text: string,
  hookText?: string
): LexicalQualityEvaluation {
  const metrics = measureLexicalQuality(text, hookText);
  const findings: string[] = [];
  let penalty = 0;

  if (metrics.topTermConcentration > 0.08) {
    findings.push("Top term concentration is too high");
    penalty += metrics.topTermConcentration > 0.12 ? 24 : 14;
  }

  if (metrics.typeTokenRatio < 0.45 && countContentTokens(text) >= 80) {
    findings.push("Vocabulary diversity is too low");
    penalty += 16;
  }

  if (metrics.repeatedBigramCount > 0) {
    findings.push("Repeated bigrams detected");
    penalty += Math.min(24, metrics.repeatedBigramCount * 8);
  }

  if (metrics.spacedLemmaRepeats > 0) {
    findings.push("Same word repeated too often across the text");
    penalty += Math.min(28, metrics.spacedLemmaRepeats * 10);
  }

  if (hookText && hookText.trim().length > 0) {
    const overlap = hookBodyOverlap(hookText, text);
    if (overlap > 0.35) {
      findings.push("Hook opening is echoed too closely in the body");
      penalty += 12;
    }
  }

  if (metrics.emDashCount > 0) {
    findings.push("Text uses em dashes instead of commas or periods");
    penalty += Math.min(24, metrics.emDashCount * 12);
  }

  return {
    metrics,
    findings,
    penalty
  };
}

export function measureLexicalQuality(
  text: string,
  hookText?: string
): LexicalQualityMetrics {
  const tokens = tokenizeContent(text);
  const uniqueTokens = new Set(tokens);
  const frequencies = countFrequencies(tokens);
  const topFrequency = frequencies.size === 0
    ? 0
    : Math.max(...frequencies.values()) / Math.max(1, tokens.length);

  return {
    typeTokenRatio: tokens.length === 0 ? 1 : uniqueTokens.size / tokens.length,
    topTermConcentration: topFrequency,
    repeatedBigramCount: countRepeatedBigrams(text),
    spacedLemmaRepeats: countSpacedLemmaRepeats(frequencies),
    emDashCount: countEmDashes(text)
  };
}

export function hookBodyOverlap(hookText: string, bodyText: string): number {
  const hookTokens = new Set(tokenizeContent(hookText));
  const bodyTokens = tokenizeContent(bodyText);
  if (hookTokens.size === 0 || bodyTokens.length === 0) {
    return 0;
  }

  const shared = bodyTokens.filter((token) => hookTokens.has(token)).length;
  return shared / hookTokens.size;
}

function countContentTokens(text: string): number {
  return tokenizeContent(text).length;
}

function tokenizeContent(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}0-9]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function countFrequencies(tokens: readonly string[]): Map<string, number> {
  const frequencies = new Map<string, number>();
  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }
  return frequencies;
}

function countSpacedLemmaRepeats(frequencies: Map<string, number>): number {
  let repeats = 0;
  for (const count of frequencies.values()) {
    if (count >= 3) {
      repeats += 1;
    }
  }
  return repeats;
}

function countRepeatedBigrams(text: string): number {
  const tokens = tokenizeContent(text);
  const bigramCounts = new Map<string, number>();

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const bigram = `${tokens[index]} ${tokens[index + 1]}`;
    bigramCounts.set(bigram, (bigramCounts.get(bigram) ?? 0) + 1);
  }

  let repeated = 0;
  for (const count of bigramCounts.values()) {
    if (count >= 3) {
      repeated += 1;
    }
  }
  return repeated;
}
