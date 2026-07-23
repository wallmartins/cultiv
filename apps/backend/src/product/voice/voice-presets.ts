import type { GenerationChannel } from "@my-ai-orchestrator/contracts";

// The Format Expression Profile's channel register (ADR 0010 F6-4 — "how the author sounds on a
// channel"), keyed by GenerationChannel now that Content Type is retired. Length lives in the
// compositor word target (compositor/scale.ts), so these carry only register/structure hints, never
// word counts. `unspecified` is the neutral default: preserve the voice, add no channel shaping.
const CHANNEL_VOICE_CONSTRAINTS: Record<GenerationChannel, readonly string[]> = {
  "professional-network": ["preserve user voice", "prefer 2-4 short paragraphs"],
  social: ["preserve user voice", "keep each unit concise", "maintain momentum"],
  email: ["preserve user voice", "use clear section transitions"],
  blog: ["preserve user voice", "allow longer explanations and sections"],
  unspecified: ["preserve user voice"]
};

export function resolveChannelVoicePreset(channel: GenerationChannel): {
  readonly constraints: readonly string[];
} {
  return { constraints: CHANNEL_VOICE_CONSTRAINTS[channel] ?? CHANNEL_VOICE_CONSTRAINTS.unspecified };
}

export const COGNITIVE_PRESET_RULE_MARKERS = [
  "progress through discovery",
  "derive benefits",
  "discovery-led"
] as const;
