// Discriminability apparatus (norte/criterio-de-aceite.md T1+T2): cliche is whatever survives a
// domain-label swap. These checks need no field expertise — only comparison of generated outputs.

export interface DiscriminabilityField {
  readonly key: string;
  readonly value: string;
}

export interface FieldSpecificityResult {
  readonly key: string;
  readonly specific: boolean;
}

const STOPWORDS = new Set([
  "a",
  "o",
  "e",
  "de",
  "da",
  "do",
  "em",
  "um",
  "uma",
  "os",
  "as",
  "que",
  "para",
  "com",
  "nao",
  "mais",
  "como",
  "por",
  "se",
  "eu",
  "voce",
  "isso",
  "essa",
  "esse",
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "your",
  "you",
  "are",
  "was",
  "have",
  "has",
  "been",
  "about",
  "when",
  "what",
  "why",
  "how"
]);

// Small, precise, bilingual — the phrase-that-survives-the-label-swap named in anti-padroes.md.
const FILLER_PHRASES = [
  "agregar valor",
  "add value",
  "seja autentico",
  "be authentic",
  "engajamento e autenticidade",
  "engagement and authenticity",
  "conteudo e rei",
  "content is king",
  "pense fora da caixa",
  "think outside the box"
];

const QUOTED_TERM_PATTERN = /["“”'‘’«»][^"“”'‘’«»]{2,}["“”'‘’«»]/;
const PROPER_NOUN_PATTERN = /^[A-ZÀ-Ý][a-zà-ÿ]+$/;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(text: string): readonly string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOPWORDS.has(token));
}

function matchesFillerPhrase(text: string): boolean {
  const normalized = normalize(text);
  return FILLER_PHRASES.some((phrase) => normalized.includes(phrase));
}

function hasMidSentenceProperNoun(text: string): boolean {
  const words = text.trim().split(/\s+/);
  for (let index = 1; index < words.length; index++) {
    const previous = words[index - 1] ?? "";
    const word = words[index]?.replace(/[.,!?;:]+$/, "") ?? "";
    if (!PROPER_NOUN_PATTERN.test(word)) continue;
    if (!/[.!?]$/.test(previous)) return true;
  }
  return false;
}

function hasNamedSpecific(text: string): boolean {
  return /\d/.test(text) || QUOTED_TERM_PATTERN.test(text) || hasMidSentenceProperNoun(text);
}

export function survivesLabelSwap(field: string): boolean {
  const trimmed = field.trim();
  if (trimmed.length === 0) return true;
  if (matchesFillerPhrase(trimmed)) return true;
  return !hasNamedSpecific(trimmed);
}

export function fieldSpecificityReport(
  fields: ReadonlyArray<DiscriminabilityField>
): ReadonlyArray<FieldSpecificityResult> {
  return fields.map((field) => ({
    key: field.key,
    specific: !survivesLabelSwap(field.value)
  }));
}

// Jaccard overlap of distinctive (stopword-stripped) tokens across both sets: 1 = fully shared
// vocabulary (interchangeable, cliche), 0 = fully distinct (discriminable).
export function interchangeabilityScore(setA: readonly string[], setB: readonly string[]): number {
  const tokensA = new Set(setA.flatMap(tokenize));
  const tokensB = new Set(setB.flatMap(tokenize));
  const union = new Set([...tokensA, ...tokensB]);
  if (union.size === 0) return 1;

  const intersectionSize = [...tokensA].filter((token) => tokensB.has(token)).length;
  return intersectionSize / union.size;
}

export function areDiscriminable(
  setA: readonly string[],
  setB: readonly string[],
  threshold = 0.5
): boolean {
  return interchangeabilityScore(setA, setB) < threshold;
}
