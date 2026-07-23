import { Schema } from "effect";
import { QualityModeSchema } from "./execution/job.js";
import { GenerationScopeSchema } from "./generation-scope.js";
import { RhetoricalModeSchema } from "./reasoning.js";
import { createSchemaDecoder } from "./shared.js";

export const GeneratePrefillSchema = Schema.Struct({
  rhetoricalMode: Schema.optional(RhetoricalModeSchema),
  scope: Schema.optional(GenerationScopeSchema),
  briefing: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema),
  importedContext: Schema.optional(Schema.String)
});
export type GeneratePrefill = typeof GeneratePrefillSchema.Type;

export const decodeGeneratePrefill = createSchemaDecoder("GeneratePrefill", GeneratePrefillSchema);
