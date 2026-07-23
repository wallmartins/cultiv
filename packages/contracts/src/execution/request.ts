import { Schema } from "effect";
import { createSchemaDecoder } from "../shared.js";
import {
  PipelineDefinitionSchema,
  PreviewRecommendationSchema,
  QualityModeSchema
} from "./job.js";
import { PlanSignatureSchema } from "../plan-signature.js";
import { GenerationScopeSchema } from "../generation-scope.js";
import { GenreSignatureSchema, RhetoricalModeSchema } from "../reasoning.js";

export const SimplifiedPipelineRequestSchema = Schema.Struct({
  userId: Schema.String,
  pipelineType: PlanSignatureSchema,
  briefing: Schema.Union(Schema.String, Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  importedContext: Schema.optional(Schema.String),
  context: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema),
  contentType: Schema.optional(Schema.String),
  model: Schema.optional(Schema.String),
  adapter: Schema.optional(Schema.String),
  quoteId: Schema.optional(Schema.String),
  previewRecommendation: Schema.optional(PreviewRecommendationSchema),
  includeTrace: Schema.optional(Schema.Boolean),
  idempotencyKey: Schema.optional(Schema.String)
});
export type SimplifiedPipelineRequest = typeof SimplifiedPipelineRequestSchema.Type;

export const ExplicitPipelineRequestSchema = Schema.Struct({
  userId: Schema.optional(Schema.String),
  pipeline: PipelineDefinitionSchema,
  importedContext: Schema.optional(Schema.String),
  context: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  inputs: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema),
  model: Schema.optional(Schema.String),
  adapter: Schema.optional(Schema.String),
  quoteId: Schema.optional(Schema.String),
  previewRecommendation: Schema.optional(PreviewRecommendationSchema),
  includeTrace: Schema.optional(Schema.Boolean),
  idempotencyKey: Schema.optional(Schema.String)
});
export type ExplicitPipelineRequest = typeof ExplicitPipelineRequestSchema.Type;

export const PipelineRequestSchema = Schema.Union(
  SimplifiedPipelineRequestSchema,
  ExplicitPipelineRequestSchema
);
export type PipelineRequest = typeof PipelineRequestSchema.Type;

export const MeExecutionRequestSchema = Schema.Struct({
  rhetoricalMode: Schema.optional(RhetoricalModeSchema),
  // F4-7 — the inferred genre. `rhetoricalMode` (the dominant mode) drives the compositor and pricing;
  // this carries the full signature (secondary mode + posture + prose) that enriches the generation
  // prompt. Optional: absent = the pre-Phase-4 default (expository prose).
  genre: Schema.optional(GenreSignatureSchema),
  scope: Schema.optional(GenerationScopeSchema),
  briefing: Schema.Union(Schema.String, Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  importedContext: Schema.optional(Schema.String),
  context: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema),
  model: Schema.optional(Schema.String),
  quoteId: Schema.optional(Schema.String),
  previewRecommendation: Schema.optional(PreviewRecommendationSchema),
  includeTrace: Schema.optional(Schema.Boolean),
  idempotencyKey: Schema.optional(Schema.String)
});
export type MeExecutionRequest = typeof MeExecutionRequestSchema.Type;

export const decodePipelineRequest = createSchemaDecoder("PipelineRequest", PipelineRequestSchema);
export const decodeMeExecutionRequest = createSchemaDecoder("MeExecutionRequest", MeExecutionRequestSchema);
