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
// Single source: the backend practice-profile anti-pattern gate imports this module's detector and
// list instead of keeping a twin (the twins had already diverged).
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
  "pensar fora da caixa",
  "think outside the box",
  "leve isso a serio",
  "take it seriously"
];

const QUOTED_TERM_PATTERN = /["“”'‘’«»][^"“”'‘’«»]{2,}["“”'‘’«»]/;
const WORD_TOKEN = /^[\p{L}\p{N}.'’-]+$/u;

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

export function containsGenericCliche(text: string): boolean {
  const normalized = normalize(text);
  return FILLER_PHRASES.some((phrase) => normalized.includes(phrase));
}

function hasInternalCapital(word: string): boolean {
  return WORD_TOKEN.test(word) && /[a-zà-ÿ]/.test(word) && /[A-ZÀ-Ý]/.test(word.slice(1));
}

// Mid-sentence name shapes: a capitalized word with a lowercase somewhere (Rust, PostgreSQL, Fly.io,
// São) at any length, or an ALL-CAPS token only when acronym-shaped (2-4 chars: AWS, EKS, LGPD) —
// longer all-caps reads as emphasis (MUITO, NEVER), which is exactly the generic prose the gate
// exists to catch. A missed long acronym (HTTPS) costs one cheap retry; a passed emphasis word
// poisons a profile.
function isNameShapedMidSentence(word: string): boolean {
  if (word.length < 2 || !WORD_TOKEN.test(word) || !/^[A-ZÀ-Ý]/.test(word)) return false;
  if (/[a-zà-ÿ]/.test(word)) return true;
  return word.length <= 4;
}

// Deterministic proxy for "names a specific" (norte T2): a digit, a quoted term, or a name-shaped
// token. Field-agnostic — no blocklist, so it generalizes to the long tail. All-lowercase brands
// (npm) stay invisible to the proxy; digits or quotes still catch them.
export function namesSpecific(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (/\d/.test(trimmed) || QUOTED_TERM_PATTERN.test(trimmed)) return true;

  const words = trimmed.split(/\s+/);
  for (let index = 0; index < words.length; index++) {
    const word = words[index]?.replace(/[.,!?;:]+$/, "") ?? "";
    if (hasInternalCapital(word)) return true;
    if (index === 0) continue;
    const previous = words[index - 1] ?? "";
    if (isNameShapedMidSentence(word) && !/[.!?]$/.test(previous)) return true;
  }
  return false;
}

export function survivesLabelSwap(field: string): boolean {
  return containsGenericCliche(field) || !namesSpecific(field);
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
