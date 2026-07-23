import { Schema } from "effect";

// Generation scope axes (size + channel). The rhetorical genre axis that used to live here as
// `GenerationIntent` was removed in the Practice Profile Phase 1 clean cut (ADR 0010 §7/§10);
// genre is now `RhetoricalMode` (reasoning.ts), inferred at the end of the generation questions.
export const GenerationLengthTierSchema = Schema.Literal("short", "medium", "long");
export type GenerationLengthTier = typeof GenerationLengthTierSchema.Type;

// Single source for the channel literals so the schema and every runtime `context`-bag reader
// (pipeline-metadata, execution presentation) validate against the same list instead of
// hand-rolling their own Set — a divergent copy can't drift silently.
export const GENERATION_CHANNELS = ["unspecified", "professional-network", "blog", "email", "social"] as const;
export const GenerationChannelSchema = Schema.Literal(...GENERATION_CHANNELS);
export type GenerationChannel = typeof GenerationChannelSchema.Type;

export const isGenerationChannel = (value: unknown): value is GenerationChannel =>
  typeof value === "string" && (GENERATION_CHANNELS as readonly string[]).includes(value);

export const GenerationScopeSchema = Schema.Struct({
  lengthTier: GenerationLengthTierSchema,
  channel: Schema.optional(GenerationChannelSchema)
});
export type GenerationScope = typeof GenerationScopeSchema.Type;
