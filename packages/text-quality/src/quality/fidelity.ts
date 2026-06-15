import type { FidelityResult } from "../types.js";

const STOPWORDS = new Set([
  "para",
  "com",
  "uma",
  "um",
  "uns",
  "umas",
  "como",
  "mais",
  "isso",
  "essa",
  "esse",
  "sobre",
  "quando",
  "muito",
  "pouco",
  "entre",
  "depois",
  "antes",
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "your",
  "you",
  "are",
  "was",
  "were",
  "have",
  "has",
  "will",
  "into",
  "about",
  "over",
  "under",
  "texto",
  "text",
  "post",
  "artigo",
  "article",
  "escreva",
  "write",
  "crie",
  "create"
]);

export function evaluateFidelity(reference: string, candidate: string, options?: { readonly lexicalQualityV2?: boolean }): FidelityResult {
  if (!options?.lexicalQualityV2) {
    return evaluateLegacyFidelity(reference, candidate);
  }

  const referenceTokens = tokenizeContent(reference);
  const candidateTokens = tokenizeContent(candidate);
  const sharedTokens = referenceTokens.filter((token) => candidateTokens.includes(token));
  const overlapRatio = referenceTokens.length === 0 ? 1 : sharedTokens.length / referenceTokens.length;
  const verbatimPenalty = measureVerbatimPhrasePenalty(reference, candidate);
  const rawScore = Math.round(overlapRatio * 100) - verbatimPenalty;
  const score = Math.max(0, Math.min(100, rawScore));

  const notes: string[] = [];
  if (verbatimPenalty > 0) {
    notes.push("Candidate copied briefing phrases too literally");
  }
  if (score < 65) {
    notes.push("Candidate drifted from the reference intent");
  }

  return {
    passed: score >= 65,
    score,
    notes
  };
}

function evaluateLegacyFidelity(reference: string, candidate: string): FidelityResult {
  const referenceTokens = tokenizeLegacy(reference);
  const candidateTokens = tokenizeLegacy(candidate);
  const sharedTokens = referenceTokens.filter((token) => candidateTokens.includes(token));
  const ratio = referenceTokens.length === 0 ? 1 : sharedTokens.length / referenceTokens.length;
  const score = Math.max(0, Math.min(100, Math.round(ratio * 100)));

  return {
    passed: score >= 65,
    score,
    notes: score >= 65 ? [] : ["Candidate drifted from the reference intent"]
  };
}

function tokenizeLegacy(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9À-ÿ]+/u)
        .filter((word) => word.length > 2)
    )
  );
}

function tokenizeContent(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9À-ÿ]+/u)
        .filter((word) => word.length > 2 && !STOPWORDS.has(word))
    )
  );
}

function measureVerbatimPhrasePenalty(reference: string, candidate: string): number {
  const phrases = extractPhrases(reference, 4);
  const normalizedCandidate = normalizeForMatch(candidate);
  let penalty = 0;

  for (const phrase of phrases) {
    if (normalizedCandidate.includes(phrase)) {
      penalty += 12;
    }
  }

  return Math.min(36, penalty);
}

function extractPhrases(text: string, minWords: number): string[] {
  const sentences = text
    .split(/[.!?]+/u)
    .map((sentence) => normalizeForMatch(sentence))
    .filter((sentence) => sentence.split(/\s+/u).length >= minWords);

  return sentences.slice(0, 6);
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
