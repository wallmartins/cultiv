import type { GenreSignature, RhetoricalMode } from "@my-ai-orchestrator/contracts";

const SECONDARY_MODE_LABEL: Record<RhetoricalMode, string> = {
  expound: "expository",
  narrate: "narrative",
  argue: "argumentative",
  instruct: "instructional",
  promote: "promotional"
};

// F4-7's dominant mode already drives the compositor plan (plan.parameters.rhetoricalMode) and the
// argument lenses (argument-lenses.ts); this section carries only what those don't — the secondary
// mode, this piece's inferred epistemic posture, and the author's own prose naming of the genre — to
// enrich the draft, not to re-decide structure already fixed upstream.
export function buildGenreSection(genre: GenreSignature | undefined): string {
  if (!genre) {
    return "";
  }

  const secondary = genre.rhetoricalMode.secondary;
  const prose = genre.prose.trim();

  return [
    "== GENRE ==",
    secondary
      ? `Secondary rhetorical mode: ${SECONDARY_MODE_LABEL[secondary]} — blend it in without overriding the dominant mode already shaping structure.`
      : undefined,
    // "not_applicable" is a genuine value (no characteristic posture) — omit the line rather than
    // leak the raw enum token into an otherwise natural-English prompt.
    genre.epistemicPosture !== "not_applicable"
      ? `This piece's epistemic posture: ${genre.epistemicPosture}.`
      : undefined,
    prose.length > 0 ? prose : undefined,
    ""
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}
