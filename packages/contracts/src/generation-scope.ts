import { Schema } from "effect";

// Generation scope axes (size + channel). The rhetorical genre axis that used to live here as
// `GenerationIntent` was removed in the Practice Profile Phase 1 clean cut (ADR 0010 §7/§10);
// genre is now `RhetoricalMode` (reasoning.ts), inferred at the end of the generation questions.
export const GenerationLengthTierSchema = Schema.Literal("short", "medium", "long");
export type GenerationLengthTier = typeof GenerationLengthTierSchema.Type;

export const GenerationChannelSchema = Schema.Literal(
  "unspecified",
  "professional-network",
  "blog",
  "email",
  "social"
);
export type GenerationChannel = typeof GenerationChannelSchema.Type;

export const GenerationScopeSchema = Schema.Struct({
  lengthTier: GenerationLengthTierSchema,
  channel: Schema.optional(GenerationChannelSchema)
});
export type GenerationScope = typeof GenerationScopeSchema.Type;
