// Peça 3 do norte (.scratch/adaptacao-por-dominio/norte/anti-padroes.md). Herda o formato do
// ANTI_TOPIC_EXTRACTION_RULES da voz: regras no prompt + detector de vazamento + retry. A lei-mor:
// a média de um campo É o clichê desse campo — o gerador tem acesso à média e deve desviar dela.

export const GENERATOR_ANTI_PATTERN_RULES = [
  "Anchor every dimension in NAMED specifics — real practitioners, live debates, concrete cases. Never the field's generic average.",
  "The cliché dimension names what to AVOID. If a generated question or profile field could be reused verbatim for a different field, it is cliché — rewrite it.",
  "Never ask for a 'thesis' where the field's point is an offer, a finding, or a provocation. Read dimension 1 (Ponto) first.",
  "Never ask for 'personal concrete experience' where the field's evidence is a demo, a number, a dataset, or a precedent. Read dimension 2 (Evidência).",
  "Never frame resistance as an intellectual counterpoint by default — it may be a purchase blocker, an internal-sell objection, or a cliché-to-avoid. Read dimension 4 (Resistência).",
  "Never frame the stake as 'why it matters to YOU (the author)'. It is always the READER's stake. Read dimension 5 (Stake).",
  "Do not invent facts. If the field is unknown, ask the author (G5) — never fabricate practitioners or cases."
].join("\n");

export const GENERATOR_CLICHE_RETRY_SUFFIX =
  "\n\nRETRY: A generated field could be reused for a different domain unchanged — it is generic. " +
  "Rewrite it anchored to a NAMED specific of THIS field (a real practitioner, debate, case, or number). " +
  "If you cannot name one, you do not know the field — return the niche-ask signal (G5) instead of inventing.";

// The label-swap survivors: phrases meaningless in any field. Kept deliberately small and precise —
// the rich, comparison-based discriminability check is the eval apparatus (F2-3, packages/text-quality).
// Never run against the `fieldCliche`/`lexicon` dimensions, where naming a cliché is the point.
const GENERIC_CLICHE_MARKERS: readonly string[] = [
  "agregar valor",
  "add value",
  "pensar fora da caixa",
  "think outside the box",
  "seja autentico",
  "be authentic",
  "conteudo e rei",
  "content is king",
  "engajamento e autenticidade",
  "engagement and authenticity",
  "leve isso a serio",
  "take it seriously"
];

function normalizeForMarkerMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function containsGenericCliche(text: string): boolean {
  const normalized = normalizeForMarkerMatch(text);
  return GENERIC_CLICHE_MARKERS.some((marker) => normalized.includes(marker));
}

// Deterministic proxy for "names a specific" (norte T2): a digit, a quoted term, or a mid-sentence
// proper-noun-like token. Field-agnostic — no blocklist, so it generalizes to the long tail.
export function namesSpecific(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return false;
  }

  if (/\d/.test(trimmed) || /["'“”«»]/.test(trimmed)) {
    return true;
  }

  const tokens = trimmed.split(/\s+/);
  return tokens.some(
    (token, index) => index > 0 && /^[A-ZÀ-Ý][a-zà-ÿ]*[A-ZÀ-Ý]|^[A-ZÀ-Ý][a-zà-ÿ]{2,}/.test(token)
  );
}

// Retry trigger for a single generation (G1/G2/G3/G4): fires when a specificity-bearing field reads
// as pure filler. Conservative by design (low false positive) — a marker hit on any field, or the
// whole batch naming nothing specific. The worst case is one extra retry.
export function detectClicheLeak(specificityBearingFields: readonly string[]): boolean {
  const nonEmpty = specificityBearingFields.filter((field) => field.trim().length > 0);
  if (nonEmpty.some(containsGenericCliche)) {
    return true;
  }

  return nonEmpty.length > 0 && nonEmpty.every((field) => !namesSpecific(field));
}
