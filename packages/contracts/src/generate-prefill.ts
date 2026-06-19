import { Schema } from "effect";
import { QualityModeSchema } from "./execution/job.js";
import { GenerationIntentSchema, GenerationScopeSchema } from "./generation-intent.js";
import { createSchemaDecoder } from "./shared.js";

export const GeneratePrefillSchema = Schema.Struct({
  contentType: Schema.optional(Schema.String),
  intent: Schema.optional(GenerationIntentSchema),
  scope: Schema.optional(GenerationScopeSchema),
  briefing: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema),
  importedContext: Schema.optional(Schema.String)
});
export type GeneratePrefill = typeof GeneratePrefillSchema.Type;

export const decodeGeneratePrefill = createSchemaDecoder("GeneratePrefill", GeneratePrefillSchema);
