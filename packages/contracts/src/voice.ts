import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";
import {
  ArgumentDevelopmentSignatureSchema,
  ClosingModeSchema,
  CoreReasoningSignatureSchema,
  EpistemicPostureSchema,
  OpeningModeSchema,
  InsightTimingSchema,
  TraitConfirmationRecordSchema,
  VoiceReasoningPresentationViewSchema
} from "./reasoning.js";
import { MetaphorSignatureSchema } from "./metaphor-signature.js";

export { AnalogyModeSchema, MetaphorSignatureSchema, formatMetaphorStylePromptBlock } from "./metaphor-signature.js";
export type { AnalogyMode, MetaphorSignature } from "./metaphor-signature.js";

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
  "development_extraction_failed",
  "voice_signature_reconciliation_failed",
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

export const FallbackReasonCodeSchema = Schema.Literal("rebuild_failed", "rebuild_in_progress");
export type FallbackReasonCode = typeof FallbackReasonCodeSchema.Type;

export const VoiceCoverageSchema = Schema.Literal("low", "medium", "high");
export type VoiceCoverage = typeof VoiceCoverageSchema.Type;

export const DeterministicFeaturesSchema = Schema.Struct({
  typeTokenRatio: Schema.Number,
  avgWordLength: Schema.Number,
  hapaxRatio: Schema.Number,
  avgSentenceLength: Schema.Number,
  sentenceLengthVariance: Schema.Number,
  avgDependencyDepth: Schema.Number,
  paragraphCount: Schema.Number,
  avgParagraphLength: Schema.Number,
  punctuationDensity: Schema.Number,
  formalityScore: Schema.Number,
  emotionalityScore: Schema.Number,
  certaintyMarkerCount: Schema.Number,
  hedgingMarkerCount: Schema.Number,
  transitionMarkerCount: Schema.Number
});
export type DeterministicFeatures = typeof DeterministicFeaturesSchema.Type;

export const QuantitativeSignalsExtractionQualitySchema = Schema.Struct({
  reasoningExtracted: Schema.Boolean,
  developmentExtracted: Schema.Boolean,
  reconciliationNeeded: Schema.Boolean
});
export type QuantitativeSignalsExtractionQuality = typeof QuantitativeSignalsExtractionQualitySchema.Type;

export const QuantitativeSignalsSchema = Schema.Struct({
  aggregate: DeterministicFeaturesSchema,
  consistencyScore: Schema.Number,
  topicIndependenceScore: Schema.Number,
  crossLengthConsistency: Schema.Number,
  extractionQuality: QuantitativeSignalsExtractionQualitySchema
});
export type QuantitativeSignals = typeof QuantitativeSignalsSchema.Type;

export const VoiceSignalSummarySchema = Schema.Struct({
  styleMarkers: Schema.Array(Schema.String),
  rules: Schema.Array(Schema.String),
  antiPatterns: Schema.Array(Schema.String),
  reasoningApplied: Schema.optional(Schema.Boolean),
  certaintyLevel: Schema.optional(Schema.Literal("low", "moderate", "high")),
  conclusionPace: Schema.optional(Schema.Literal("slow", "moderate", "fast")),
  developmentApplied: Schema.optional(Schema.Boolean),
  epistemicPosture: Schema.optional(EpistemicPostureSchema),
  developmentTraitsApplied: Schema.optional(Schema.Boolean),
  openingMode: Schema.optional(OpeningModeSchema),
  closingMode: Schema.optional(ClosingModeSchema),
  insightTiming: Schema.optional(InsightTimingSchema)
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

/** Canonical pipeline voice profile — single source for text-quality and domain mappers. */
export const TextQualityVoiceProfileSchema = Schema.Struct({
  userId: Schema.String,
  tone: Schema.String,
  cadence: Schema.String,
  description: Schema.optional(Schema.String),
  lexicon: Schema.Array(Schema.String),
  constraints: Schema.Array(Schema.String),
  antiPatterns: Schema.Array(Schema.String),
  antiPatternsExplicit: Schema.Array(Schema.String),
  rules: Schema.Array(Schema.String),
  styleMarkers: Schema.Array(Schema.String),
  userLabels: Schema.Array(Schema.String),
  coreReasoningSignature: Schema.optional(CoreReasoningSignatureSchema),
  argumentDevelopmentSignature: Schema.optional(ArgumentDevelopmentSignatureSchema),
  derivedAntiPatterns: Schema.optional(Schema.Array(Schema.String)),
  quantitativeSignals: Schema.optional(QuantitativeSignalsSchema),
  signatureOpenings: Schema.optional(Schema.Array(Schema.String)),
  signatureClosings: Schema.optional(Schema.Array(Schema.String)),
  metaphorSignature: Schema.optional(MetaphorSignatureSchema)
});
export type TextQualityVoiceProfile = typeof TextQualityVoiceProfileSchema.Type;

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
  }),
  traitConfirmations: Schema.optional(
    Schema.Record({ key: Schema.String, value: TraitConfirmationRecordSchema })
  )
});
export type VoiceProfileDiagnosticsView = typeof VoiceProfileDiagnosticsViewSchema.Type;

export const VoiceProfileScreenViewSchema = Schema.Struct({
  profile: VoiceProfileViewSchema,
  diagnostics: VoiceProfileDiagnosticsViewSchema,
  materialBase: VoiceMaterialBaseBreakdownSchema,
  reasoning: Schema.optional(VoiceReasoningPresentationViewSchema),
  quantitativeSignals: Schema.optional(QuantitativeSignalsSchema)
});
export type VoiceProfileScreenView = typeof VoiceProfileScreenViewSchema.Type;

export const VoiceTrainingConsentStatusViewSchema = Schema.Struct({
  granted: Schema.Boolean,
  grantedAt: Schema.optional(Schema.String),
  revokedAt: Schema.optional(Schema.String)
});
export type VoiceTrainingConsentStatusView = typeof VoiceTrainingConsentStatusViewSchema.Type;

export const VoiceTrainingConsentActionSchema = Schema.Literal("grant", "revoke");
export type VoiceTrainingConsentAction = typeof VoiceTrainingConsentActionSchema.Type;

export const VoiceTrainingConsentInputSchema = Schema.Struct({
  action: Schema.optional(VoiceTrainingConsentActionSchema)
});
export type VoiceTrainingConsentInput = typeof VoiceTrainingConsentInputSchema.Type;

export const decodeVoiceProfileScreenView = createSchemaDecoder("VoiceProfileScreenView", VoiceProfileScreenViewSchema);
export const decodeVoiceProfileDiagnosticsView = createSchemaDecoder(
  "VoiceProfileDiagnosticsView",
  VoiceProfileDiagnosticsViewSchema
);
export const decodeVoiceTrainingConsentStatusView = createSchemaDecoder(
  "VoiceTrainingConsentStatusView",
  VoiceTrainingConsentStatusViewSchema
);
