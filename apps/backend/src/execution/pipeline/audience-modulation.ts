// ADR 0010 §11 (F4-4): the audience socket modulates ACCESSIBILITY only, never the author's voice —
// invariant 1 (voice is never overwritten). Prompt-only lever via the existing briefing.audience field;
// no audience present degrades to a neutral instruction, never a tech-domain gate.

const NEUTRAL_LEXICON_INSTRUCTION =
  "Author lexicon (distinctive words from the author; use sparingly, never repeat a term more than once unless essential):";

const NEUTRAL_AUDIENCE_SECTION = "Match terminology to the briefing topic.";

export function resolveLexiconInstruction(audience: string | undefined): string {
  if (!audience) {
    return NEUTRAL_LEXICON_INSTRUCTION;
  }

  return `Author lexicon (distinctive words from the author; calibrate density to ${audience} — use them freely if that audience already speaks this way, translate or explain them if it doesn't):`;
}

export function buildAudienceModulationSection(audience: string | undefined): string {
  if (!audience) {
    return NEUTRAL_AUDIENCE_SECTION;
  }

  return [
    `Writing for: ${audience}.`,
    "This adjusts what the reader needs explained, not how the author sounds — the voice above stays unchanged.",
    `- Jargon: use the author's own vocabulary as far as ${audience} already speaks it; translate or explain the rest.`,
    `- Presupposition: assume only what ${audience} already knows; do not re-explain that baseline.`,
    `- Ramp: bring a reader who lacks that baseline up to speed before relying on it.`,
    `- Closing: land on what ${audience} specifically would take away or do next.`
  ].join("\n");
}
