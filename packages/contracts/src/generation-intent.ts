import { Schema } from "effect";
import { QualityModeSchema } from "./execution.js";

export const GenerationIntentSchema = Schema.Literal(
  "share-idea",
  "explain-deeply",
  "engage-audience",
  "tell-story",
  "update-subscribers",
  "document-decision"
);
export type GenerationIntent = typeof GenerationIntentSchema.Type;

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

const BriefingValueSchema = Schema.Union(
  Schema.String,
  Schema.Record({ key: Schema.String, value: Schema.Unknown })
);

export const GenerationIntentRequestSchema = Schema.Struct({
  intent: GenerationIntentSchema,
  scope: GenerationScopeSchema,
  briefing: Schema.optional(BriefingValueSchema),
  importedContext: Schema.optional(Schema.String),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema)
});
export type GenerationIntentRequest = typeof GenerationIntentRequestSchema.Type;
