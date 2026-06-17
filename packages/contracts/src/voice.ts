import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";
import { VoiceReasoningPresentationViewSchema } from "./reasoning.js";

export const VoiceProfileConfidenceSchema = Schema.Literal("low", "medium", "high");
export type VoiceProfileConfidence = typeof VoiceProfileConfidenceSchema.Type;

export const VoiceAdaptationModeSchema = Schema.Literal("conservative", "standard");
export type VoiceAdaptationMode = typeof VoiceAdaptationModeSchema.Type;

export const VoiceExampleStateSchema = Schema.Literal("active", "excluded");
export type VoiceExampleState = typeof VoiceExampleStateSchema.Type;

export const AttentionLevelSchema = Schema.Literal("low", "medium", "high");
export type AttentionLevel = typeof AttentionLevelSchema.Type;

export const ReasonCodeSchema = Schema.Literal(
  "insufficient_examples",
  "insufficient_diversity",
  "conflicting_signals",
  "processing_failed",
  "plan_restriction",
  "subscription_inactive",
  "feature_flag_disabled",
  "rebuild_failed",
  "rebuild_in_progress",
  "reasoning_extraction_failed",
  "language_conflict",
  "too_many_pinned_examples",
  "invalid_example_payload",
  "batch_expired"
);
export type ReasonCode = typeof ReasonCodeSchema.Type;

export const NextActionCodeSchema = Schema.Literal(
  "add_more_examples",
  "add_examples_from_other_content_types",
  "review_conflicting_examples",
  "remove_pinned_example",
  "retry_batch_commit",
  "wait_for_profile_update",
  "upgrade_plan"
);
export type NextActionCode = typeof NextActionCodeSchema.Type;

export const ContributionCodeSchema = Schema.Literal(
  "reinforces_informal_tone",
  "reinforces_formal_tone",
  "useful_for_linkedin",
  "useful_for_newsletter",
  "useful_for_blog",
  "supports_first_person_voice",
  "redundant_with_recent_examples",
  "signals_negative_pattern"
);
export type ContributionCode = typeof ContributionCodeSchema.Type;

export const AttentionReasonCodeSchema = Schema.Literal(
  "redundant_example",
  "too_short",
  "low_specificity",
  "format_specific_only",
  "conflicts_with_profile",
  "language_conflict",
  "excluded_from_profile"
);
export type AttentionReasonCode = typeof AttentionReasonCodeSchema.Type;

export const FallbackReasonCodeSchema = Schema.Literal("rebuild_failed", "rebuild_in_progress");
export type FallbackReasonCode = typeof FallbackReasonCodeSchema.Type;

export const VoiceCoverageSchema = Schema.Literal("low", "medium", "high");
export type VoiceCoverage = typeof VoiceCoverageSchema.Type;

export const VoiceSignalSummarySchema = Schema.Struct({
  styleMarkers: Schema.Array(Schema.String),
  rules: Schema.Array(Schema.String),
  antiPatterns: Schema.Array(Schema.String),
  reasoningApplied: Schema.optional(Schema.Boolean),
  certaintyLevel: Schema.optional(Schema.Literal("low", "moderate", "high")),
  conclusionPace: Schema.optional(Schema.Literal("slow", "moderate", "fast"))
});
export type VoiceSignalSummary = typeof VoiceSignalSummarySchema.Type;

export const VoiceProfileViewSchema = Schema.Struct({
  userId: Schema.String,
  snapshotId: Schema.String,
  version: Schema.Number,
  confidence: VoiceProfileConfidenceSchema,
  adaptationMode: VoiceAdaptationModeSchema,
  primaryLanguage: Schema.String,
  tone: Schema.String,
  cadence: Schema.String,
  description: Schema.optional(Schema.String),
  lexicon: Schema.Array(Schema.String),
  constraints: Schema.Array(Schema.String),
  styleMarkers: Schema.Array(Schema.String),
  rules: Schema.Array(Schema.String),
  antiPatterns: Schema.Array(Schema.String)
});
export type VoiceProfileView = typeof VoiceProfileViewSchema.Type;

export const VoiceMaterialBaseBreakdownSchema = Schema.Struct({
  totalExamples: Schema.Number,
  activeExamples: Schema.Number,
  excludedExamples: Schema.Number,
  pinnedExamples: Schema.Number,
  byClassification: Schema.Record({ key: Schema.String, value: Schema.Number }),
  byContentType: Schema.Record({ key: Schema.String, value: Schema.Number }),
  byLanguage: Schema.Record({ key: Schema.String, value: Schema.Number })
});
export type VoiceMaterialBaseBreakdown = typeof VoiceMaterialBaseBreakdownSchema.Type;

export const VoiceCoverageItemViewSchema = Schema.Struct({
  contentType: Schema.String,
  coverage: VoiceCoverageSchema,
  reasonCodes: Schema.Array(ReasonCodeSchema)
});
export type VoiceCoverageItemView = typeof VoiceCoverageItemViewSchema.Type;

export const VoiceProfileDiagnosticsViewSchema = Schema.Struct({
  updating: Schema.Boolean,
  activeVersion: Schema.Number,
  pendingVersion: Schema.optional(Schema.Number),
  summary: Schema.optional(Schema.String),
  reasonCodes: Schema.Array(ReasonCodeSchema),
  nextActionCodes: Schema.Array(NextActionCodeSchema),
  bestCoveredContentTypes: Schema.Array(VoiceCoverageItemViewSchema),
  underrepresentedContentTypes: Schema.Array(VoiceCoverageItemViewSchema),
  pendingRebuild: Schema.Struct({
    status: Schema.Literal("idle", "in_progress", "failed"),
    reasonCode: Schema.optional(ReasonCodeSchema),
    nextActionCodes: Schema.Array(NextActionCodeSchema)
  })
});
export type VoiceProfileDiagnosticsView = typeof VoiceProfileDiagnosticsViewSchema.Type;

export const VoiceProfileScreenViewSchema = Schema.Struct({
  profile: VoiceProfileViewSchema,
  diagnostics: VoiceProfileDiagnosticsViewSchema,
  materialBase: VoiceMaterialBaseBreakdownSchema,
  reasoning: Schema.optional(VoiceReasoningPresentationViewSchema)
});
export type VoiceProfileScreenView = typeof VoiceProfileScreenViewSchema.Type;

export const VoiceExampleEvaluationViewSchema = Schema.Struct({
  systemWeight: Schema.Number,
  attentionLevel: AttentionLevelSchema,
  attentionReasonCodes: Schema.Array(AttentionReasonCodeSchema),
  contributionCode: ContributionCodeSchema,
  contributionPreview: Schema.String,
  userPinned: Schema.Boolean
});
export type VoiceExampleEvaluationView = typeof VoiceExampleEvaluationViewSchema.Type;

export const VoiceExampleListItemViewSchema = Schema.Struct({
  exampleId: Schema.String,
  version: Schema.Number,
  state: VoiceExampleStateSchema,
  text: Schema.String,
  previewText: Schema.String,
  language: Schema.String,
  channel: Schema.optional(Schema.String),
  format: Schema.optional(Schema.String),
  explicitContentType: Schema.optional(Schema.String),
  effectiveContentTypeHints: Schema.Array(Schema.String),
  classificationLabels: Schema.Array(Schema.String),
  pinned: Schema.Boolean,
  pendingProfileImpact: Schema.Boolean,
  targetProfileVersion: Schema.optional(Schema.Number),
  evaluation: VoiceExampleEvaluationViewSchema,
  createdAt: Schema.String,
  updatedAt: Schema.String
});
export type VoiceExampleListItemView = typeof VoiceExampleListItemViewSchema.Type;

export const VoiceExamplesPageViewSchema = Schema.Struct({
  items: Schema.Array(VoiceExampleListItemViewSchema),
  total: Schema.Number,
  limit: Schema.Number,
  offset: Schema.Number
});
export type VoiceExamplesPageView = typeof VoiceExamplesPageViewSchema.Type;

export const VoiceExampleCreateInputSchema = Schema.Struct({
  text: Schema.String,
  language: Schema.optional(Schema.String),
  channel: Schema.optional(Schema.String),
  format: Schema.optional(Schema.String),
  explicitContentType: Schema.optional(Schema.String),
  context: Schema.optional(Schema.String),
  antiPatternsExplicit: Schema.optional(Schema.Array(Schema.String)),
  userLabels: Schema.optional(Schema.Array(Schema.String)),
  pinned: Schema.optional(Schema.Boolean),
  performance: Schema.optional(
    Schema.Struct({
      channel: Schema.optional(Schema.String),
      publishedAt: Schema.optional(Schema.String),
      selfRating: Schema.optional(Schema.Number),
      likes: Schema.optional(Schema.Number),
      comments: Schema.optional(Schema.Number)
    })
  )
});
export type VoiceExampleCreateInput = typeof VoiceExampleCreateInputSchema.Type;

export const VoiceExampleUpdateInputSchema = Schema.Struct({
  text: Schema.optional(Schema.String),
  language: Schema.optional(Schema.String),
  channel: Schema.optional(Schema.String),
  format: Schema.optional(Schema.String),
  explicitContentType: Schema.optional(Schema.String),
  context: Schema.optional(Schema.String),
  antiPatternsExplicit: Schema.optional(Schema.Array(Schema.String)),
  userLabels: Schema.optional(Schema.Array(Schema.String)),
  pinned: Schema.optional(Schema.Boolean),
  state: Schema.optional(VoiceExampleStateSchema)
});
export type VoiceExampleUpdateInput = typeof VoiceExampleUpdateInputSchema.Type;

export const VoiceExampleBatchCreateInputSchema = Schema.Struct({
  expiresAt: Schema.optional(Schema.String)
});
export type VoiceExampleBatchCreateInput = typeof VoiceExampleBatchCreateInputSchema.Type;

export const VoiceExampleBatchItemInputSchema = Schema.Struct({
  clientItemId: Schema.String,
  input: VoiceExampleCreateInputSchema
});
export type VoiceExampleBatchItemInput = typeof VoiceExampleBatchItemInputSchema.Type;

export const VoiceExampleBatchItemsInputSchema = Schema.Struct({
  items: Schema.Array(VoiceExampleBatchItemInputSchema)
});
export type VoiceExampleBatchItemsInput = typeof VoiceExampleBatchItemsInputSchema.Type;

export const VoiceExampleBatchItemResultViewSchema = Schema.Struct({
  clientItemId: Schema.String,
  accepted: Schema.Boolean,
  exampleId: Schema.optional(Schema.String),
  reasonCode: Schema.optional(ReasonCodeSchema),
  message: Schema.optional(Schema.String)
});
export type VoiceExampleBatchItemResultView = typeof VoiceExampleBatchItemResultViewSchema.Type;

export const VoiceExampleBatchViewSchema = Schema.Struct({
  batchId: Schema.String,
  status: Schema.Literal("open", "committed", "expired"),
  expiresAt: Schema.String,
  acceptedItems: Schema.Number,
  rejectedItems: Schema.Number,
  itemResults: Schema.Array(VoiceExampleBatchItemResultViewSchema)
});
export type VoiceExampleBatchView = typeof VoiceExampleBatchViewSchema.Type;

export const VoiceExampleBatchCommitResultViewSchema = Schema.Struct({
  batchId: Schema.String,
  committedAt: Schema.String,
  acceptedItems: Schema.Number,
  rejectedItems: Schema.Number,
  targetProfileVersion: Schema.optional(Schema.Number)
});
export type VoiceExampleBatchCommitResultView = typeof VoiceExampleBatchCommitResultViewSchema.Type;

export const decodeVoiceExampleListItemView = createSchemaDecoder(
  "VoiceExampleListItemView",
  VoiceExampleListItemViewSchema
);
export const VoiceTrainingConsentStatusViewSchema = Schema.Struct({
  granted: Schema.Boolean,
  grantedAt: Schema.optional(Schema.String),
  revokedAt: Schema.optional(Schema.String)
});
export type VoiceTrainingConsentStatusView = typeof VoiceTrainingConsentStatusViewSchema.Type;

export const decodeVoiceProfileScreenView = createSchemaDecoder("VoiceProfileScreenView", VoiceProfileScreenViewSchema);
export const decodeVoiceTrainingConsentStatusView = createSchemaDecoder(
  "VoiceTrainingConsentStatusView",
  VoiceTrainingConsentStatusViewSchema
);
export const decodeVoiceExamplesPageView = createSchemaDecoder("VoiceExamplesPageView", VoiceExamplesPageViewSchema);
export const decodeVoiceExampleCreateInput = createSchemaDecoder("VoiceExampleCreateInput", VoiceExampleCreateInputSchema);
export const decodeVoiceExampleUpdateInput = createSchemaDecoder("VoiceExampleUpdateInput", VoiceExampleUpdateInputSchema);
export const decodeVoiceExampleBatchCreateInput = createSchemaDecoder(
  "VoiceExampleBatchCreateInput",
  VoiceExampleBatchCreateInputSchema
);
export const decodeVoiceExampleBatchItemsInput = createSchemaDecoder(
  "VoiceExampleBatchItemsInput",
  VoiceExampleBatchItemsInputSchema
);
export const decodeVoiceExampleBatchView = createSchemaDecoder("VoiceExampleBatchView", VoiceExampleBatchViewSchema);
export const decodeVoiceExampleBatchCommitResultView = createSchemaDecoder(
  "VoiceExampleBatchCommitResultView",
  VoiceExampleBatchCommitResultViewSchema
);
