import { Schema } from "effect";
import { TraitFrequencySchema } from "./reasoning.js";

export const AnalogyModeSchema = Schema.Literal(
  "explicit-comparison",
  "invitation",
  "implicit",
  "mixed",
  "none"
);
export type AnalogyMode = typeof AnalogyModeSchema.Type;

export const MetaphorSignatureSchema = Schema.Struct({
  analogyDensity: TraitFrequencySchema,
  analogyMode: AnalogyModeSchema,
  avoidLiteralDomains: Schema.Array(Schema.String)
});
export type MetaphorSignature = typeof MetaphorSignatureSchema.Type;

export function formatMetaphorStylePromptBlock(
  signature: MetaphorSignature,
  briefingTopic?: string
): string {
  const topicLine = briefingTopic?.trim()
    ? `Current topic: ${briefingTopic.trim()}`
    : "Current topic: follow the briefing";
  const avoidLine =
    signature.avoidLiteralDomains.length > 0
      ? `Do NOT reuse calibration domains literally: ${signature.avoidLiteralDomains.join(", ")}`
      : "Do not copy domain nouns from calibration examples.";

  return [
    "== METAPHOR STYLE ==",
    `Analogy density: ${signature.analogyDensity}`,
    `Analogy mode: ${signature.analogyMode}`,
    topicLine,
    "- Use metaphors aligned with the CURRENT topic, not calibration example subjects.",
    `- ${avoidLine}`,
    "- Match the author's analogy density and mode; do not paste onboarding example metaphors."
  ].join("\n");
}
