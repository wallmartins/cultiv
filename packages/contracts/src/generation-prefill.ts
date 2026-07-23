import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";
import { GeneratePrefillSchema } from "./generate-prefill.js";

// --- Request -----------------------------------------------------------------
export const GenerationPrefillRequestSchema = Schema.Struct({
  theme: Schema.String,
  language: Schema.optional(Schema.String),
  // F0-6 — narrowed-audience socket (audience-narrowing step lands in F4-2; slot instantiation F4-3).
  audience: Schema.optional(Schema.String)
});
export type GenerationPrefillRequest = typeof GenerationPrefillRequestSchema.Type;

// --- Question plan (backbone de 4 ângulos + 0-2 extras — ADR 0004 §4) -------
export const GenerationPrefillQuestionAngleSchema = Schema.Literal(
  "thesis",
  "experience",
  "tension",
  "motivation",
  "extra"
);
export type GenerationPrefillQuestionAngle = typeof GenerationPrefillQuestionAngleSchema.Type;

export const GenerationPrefillQuestionSchema = Schema.Struct({
  id: Schema.String,
  angle: GenerationPrefillQuestionAngleSchema,
  prompt: Schema.String
});
export type GenerationPrefillQuestion = typeof GenerationPrefillQuestionSchema.Type;

// --- Response ------------------------------------------------------------------
export const GenerationPrefillResponseSchema = Schema.Struct({
  prefill: GeneratePrefillSchema,
  detectedPlatform: Schema.optional(Schema.String),
  questionPlan: Schema.Array(GenerationPrefillQuestionSchema)
});
export type GenerationPrefillResponse = typeof GenerationPrefillResponseSchema.Type;

export const decodeGenerationPrefillRequest = createSchemaDecoder(
  "GenerationPrefillRequest",
  GenerationPrefillRequestSchema
);
export const decodeGenerationPrefillResponse = createSchemaDecoder(
  "GenerationPrefillResponse",
  GenerationPrefillResponseSchema
);
