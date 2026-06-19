import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";
import { QualityModeSchema } from "./execution.js";
import { CompositorMetadataSchema, PlanSignatureSchema } from "./generation-compositor.js";
import {
  GenerationIntentSchema,
  GenerationLengthTierSchema,
  GenerationScopeSchema
} from "./generation-intent.js";

const PreviewBriefingSchema = Schema.Union(
  Schema.String,
  Schema.Record({ key: Schema.String, value: Schema.Unknown })
);

export const GenerationPreviewRequestSchema = Schema.Struct({
  contentType: Schema.optional(Schema.String),
  intent: Schema.optional(GenerationIntentSchema),
  scope: Schema.optional(GenerationScopeSchema),
  briefing: Schema.optional(PreviewBriefingSchema),
  importedContext: Schema.optional(Schema.String),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema),
  includeRecommendation: Schema.optional(Schema.Boolean)
});
export type GenerationPreviewRequest = typeof GenerationPreviewRequestSchema.Type;

export const GenerationPreviewContentTypeOptionSchema = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  allowed: Schema.Boolean,
  blockedReason: Schema.optional(Schema.String)
});
export type GenerationPreviewContentTypeOption = typeof GenerationPreviewContentTypeOptionSchema.Type;

export const GenerationPreviewQualityModeOptionSchema = Schema.Struct({
  id: QualityModeSchema,
  allowed: Schema.Boolean,
  blockedReason: Schema.optional(Schema.String),
  creditPrice: Schema.Number,
  recommended: Schema.optional(Schema.Boolean),
  recommendation: Schema.optional(
    Schema.Struct({
      reasonCodes: Schema.Array(Schema.String),
      explanation: Schema.String
    })
  )
});
export type GenerationPreviewQualityModeOption = typeof GenerationPreviewQualityModeOptionSchema.Type;

export const GenerationPreviewRecommendationSchema = Schema.Struct({
  qualityMode: QualityModeSchema,
  reasonCodes: Schema.Array(Schema.String),
  explanation: Schema.String
});
export type GenerationPreviewRecommendation = typeof GenerationPreviewRecommendationSchema.Type;

export const GenerationPricingSnapshotSchema = Schema.Struct({
  quoteId: Schema.String,
  policyVersion: Schema.String,
  contentType: Schema.String,
  qualityMode: QualityModeSchema,
  creditPrice: Schema.Number,
  planSignature: Schema.optional(PlanSignatureSchema),
  lengthTier: Schema.optional(GenerationLengthTierSchema)
});
export type GenerationPricingSnapshot = typeof GenerationPricingSnapshotSchema.Type;

export const GenerationPreviewResolvedIntentSchema = Schema.Struct({
  intent: GenerationIntentSchema,
  scope: GenerationScopeSchema,
  wordTargetMin: Schema.Number,
  wordTargetMax: Schema.Number
});
export type GenerationPreviewResolvedIntent = typeof GenerationPreviewResolvedIntentSchema.Type;

export const GenerationPreviewResponseSchema = Schema.Struct({
  pricingSnapshot: GenerationPricingSnapshotSchema,
  currentBalance: Schema.Number,
  projectedBalanceAfterGeneration: Schema.Number,
  recommendation: Schema.optional(GenerationPreviewRecommendationSchema),
  resolvedIntent: Schema.optional(GenerationPreviewResolvedIntentSchema),
  compositor: Schema.optional(CompositorMetadataSchema),
  options: Schema.Struct({
    contentTypes: Schema.Array(GenerationPreviewContentTypeOptionSchema),
    qualityModes: Schema.Array(GenerationPreviewQualityModeOptionSchema)
  })
});
export type GenerationPreviewResponse = typeof GenerationPreviewResponseSchema.Type;

export const decodeGenerationPreviewRequest = createSchemaDecoder(
  "GenerationPreviewRequest",
  GenerationPreviewRequestSchema
);
export const decodeGenerationPreviewResponse = createSchemaDecoder(
  "GenerationPreviewResponse",
  GenerationPreviewResponseSchema
);
