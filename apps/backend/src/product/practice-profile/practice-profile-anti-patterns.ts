// Peça 3 do norte (.scratch/adaptacao-por-dominio/norte/anti-padroes.md). Herda o formato do
// ANTI_TOPIC_EXTRACTION_RULES da voz: regras no prompt + detector de vazamento + retry. A lei-mor:
// a média de um campo É o clichê desse campo — o gerador tem acesso à média e deve desviar dela.
// The specificity detector + filler list live in text-quality's discriminability module (single
// source, C-3) — this file owns only the prompt rules and the per-dimension leak gate.

import { containsGenericCliche, namesSpecific } from "@my-ai-orchestrator/text-quality";

export { containsGenericCliche, namesSpecific };

export const GENERATOR_ANTI_PATTERN_RULES = [
  "Anchor every dimension in NAMED specifics — real practitioners, live debates, concrete cases. Never the field's generic average.",
  "The cliché dimension names what to AVOID. If a generated question or profile field could be reused verbatim for a different field, it is cliché — rewrite it.",
  "Never ask for a 'thesis' where the field's point is an offer, a finding, or a provocation. Read dimension 1 (Ponto) first.",
  "Never ask for 'personal concrete experience' where the field's evidence is a demo, a number, a dataset, or a precedent. Read dimension 2 (Evidência).",
  "Never frame resistance as an intellectual counterpoint by default — it may be a purchase blocker, an internal-sell objection, or a cliché-to-avoid. Read dimension 4 (Resistência).",
  "Never frame the stake as 'why it matters to YOU (the author)'. It is always the READER's stake. Read dimension 5 (Stake).",
  "Do not invent facts. If the field is unknown, ask the author (G5) — never fabricate practitioners or cases."
].join("\n");

// Each surface states its own honest escape (C-10): only G2's flow can leave a dimension thin for the
// G5 niche-ask — promising "the G5 signal" on surfaces whose schema cannot carry it invites invention.
export function buildClicheRetrySuffix(escapeInstruction: string): string {
  return (
    "\n\nRETRY: A generated field could be reused for a different domain unchanged — it is generic. " +
    "Rewrite it anchored to a NAMED specific of THIS field (a real practitioner, debate, case, or number). " +
    escapeInstruction
  );
}

// Per-dimension leak assessment (C-2 / norte law 3, T2): every specificity-bearing field must anchor
// a named specific — one generic field is a leak, not four. The two failure kinds are separated
// because G2 treats them differently: a filler hit is always a failure, but a merely-thin dimension
// after the retry is honest degrade — it becomes the G5 niche-ask instead of failing enrichment.
// Never run against the `fieldCliche`/`lexicon` dimensions, where naming a cliché is the point.
export interface ClicheLeakReport {
  readonly fillerHit: boolean;
  readonly thin: boolean;
}

export function assessClicheLeak(specificityBearingFields: readonly string[]): ClicheLeakReport {
  const nonEmpty = specificityBearingFields.filter((field) => field.trim().length > 0);
  return {
    fillerHit: nonEmpty.some(containsGenericCliche),
    thin: nonEmpty.some((field) => !namesSpecific(field))
  };
}
