import { Schema } from "effect";
import { createSchemaDecoder } from "../shared.js";
import {
  PipelineDefinitionSchema,
  PipelineTypeSchema,
  PreviewRecommendationSchema,
  QualityModeSchema
} from "./job.js";

export const SimplifiedPipelineRequestSchema = Schema.Struct({
  userId: Schema.String,
  pipelineType: PipelineTypeSchema,
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
  pipeline: PipelineDefinitionSchema,
  importedContext: Schema.optional(Schema.String),
  context: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  inputs: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema),
  model: Schema.optional(Schema.String),
  adapter: Schema.optional(Schema.String),
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
  contentType: Schema.String,
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
