import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";

export const CertaintyLevelSchema = Schema.Literal("low", "moderate", "high");
export type CertaintyLevel = typeof CertaintyLevelSchema.Type;

export const JudgmentFrequencySchema = Schema.Literal("low", "moderate", "high");
export type JudgmentFrequency = typeof JudgmentFrequencySchema.Type;

export const ConclusionPaceSchema = Schema.Literal("slow", "moderate", "fast");
export type ConclusionPace = typeof ConclusionPaceSchema.Type;

export const ReaderRelationshipSchema = Schema.Literal(
  "peer",
  "mentor",
  "observer",
  "collaborator",
  "guide"
);
export type ReaderRelationship = typeof ReaderRelationshipSchema.Type;

export const AuthoritySourceSchema = Schema.Literal(
  "personal_observation",
  "lived_experience",
  "data",
  "reference",
  "practice"
);
export type AuthoritySource = typeof AuthoritySourceSchema.Type;

export const CoreReasoningSignatureSchema = Schema.Struct({
  narrativeProse: Schema.String,
  certaintyLevel: CertaintyLevelSchema,
  judgmentFrequency: JudgmentFrequencySchema,
  conclusionPace: ConclusionPaceSchema,
  readerRelationship: ReaderRelationshipSchema,
  authoritySource: AuthoritySourceSchema,
  derivedAntiPatterns: Schema.Array(Schema.String)
});
export type CoreReasoningSignature = typeof CoreReasoningSignatureSchema.Type;

export const ReasoningExtractionResultSchema = Schema.Struct({
  core: CoreReasoningSignatureSchema
});
export type ReasoningExtractionResult = typeof ReasoningExtractionResultSchema.Type;

export const TransitionFrequencySchema = Schema.Literal("rare", "occasional", "common", "dominant");
export type TransitionFrequency = typeof TransitionFrequencySchema.Type;

export const TransitionTendencySchema = Schema.Struct({
  from: Schema.String,
  to: Schema.String,
  frequency: TransitionFrequencySchema
});
export type TransitionTendency = typeof TransitionTendencySchema.Type;

export const EpistemicPostureSchema = Schema.Literal(
  "exploratory",
  "investigative",
  "advocacy",
  "expository",
  "instructive",
  "experiential",
  "promotional",
  "not_applicable"
);
export type EpistemicPosture = typeof EpistemicPostureSchema.Type;

// The rhetorical genre axis. Consumed by the compositor (Phase 1 F1-2 re-key); its producer —
// genre inference at the end of the generation questions — lands in Phase 4 (F4-3), so the request
// carries it optionally and the resolver defaults it until then (ponytail: F4).
// English wire values matching every other contracts enum; norte pt names in comments (genero-dimensoes.md §A):
// expound=expor · narrate=narrar · argue=argumentar · instruct=instruir · promote=promover.
// Single source for the value list so consumers (compositor, presentation guard) don't re-hand-list it.
export const RHETORICAL_MODES = ["expound", "narrate", "argue", "instruct", "promote"] as const;
export const RhetoricalModeSchema = Schema.Literal(...RHETORICAL_MODES);
export type RhetoricalMode = typeof RhetoricalModeSchema.Type;

export const RhetoricalModeProfileSchema = Schema.Struct({
  dominant: RhetoricalModeSchema,
  secondary: Schema.optional(RhetoricalModeSchema)
});
export type RhetoricalModeProfile = typeof RhetoricalModeProfileSchema.Type;

export const GenreSignatureSchema = Schema.Struct({
  rhetoricalMode: RhetoricalModeProfileSchema,
  epistemicPosture: EpistemicPostureSchema,
  prose: Schema.String
});
export type GenreSignature = typeof GenreSignatureSchema.Type;

export const TraitFrequencySchema = Schema.Literal("rare", "occasional", "common", "dominant");
export type TraitFrequency = typeof TraitFrequencySchema.Type;

export const OpeningModeSchema = Schema.Literal("observation", "thesis", "mixed");
export type OpeningMode = typeof OpeningModeSchema.Type;

export const PerspectiveShiftDensitySchema = Schema.Literal("low", "moderate", "high");
export type PerspectiveShiftDensity = typeof PerspectiveShiftDensitySchema.Type;

export const SelfQuestioningLevelSchema = Schema.Literal("low", "moderate", "high");
export type SelfQuestioningLevel = typeof SelfQuestioningLevelSchema.Type;

export const InsightTimingSchema = Schema.Literal("early", "moderate", "late");
export type InsightTiming = typeof InsightTimingSchema.Type;

export const ClosingModeSchema = Schema.Literal("conclusion", "open_question", "mixed");
export type ClosingMode = typeof ClosingModeSchema.Type;

export const TRAIT_KEYS = [
  "openingMode",
  "perspectiveShiftDensity",
  "usesCounterexamples",
  "selfQuestioning",
  "insightTiming",
  "usesAnalogies",
  "closingMode"
] as const;

export const TraitKeySchema = Schema.Literal(
  "openingMode",
  "perspectiveShiftDensity",
  "usesCounterexamples",
  "selfQuestioning",
  "insightTiming",
  "usesAnalogies",
  "closingMode"
);
export type TraitKey = typeof TraitKeySchema.Type;

export const TraitConfidenceSchema = Schema.Literal("low", "medium", "high");
export type TraitConfidence = typeof TraitConfidenceSchema.Type;

export const TraitStatusSchema = Schema.Literal("inferred", "confirmed", "disputed", "unknown");
export type TraitStatus = typeof TraitStatusSchema.Type;

export const TraitValueSchema = Schema.Union(
  OpeningModeSchema,
  PerspectiveShiftDensitySchema,
  TraitFrequencySchema,
  SelfQuestioningLevelSchema,
  InsightTimingSchema,
  ClosingModeSchema
);
export type TraitValue = typeof TraitValueSchema.Type;

export const DevelopmentTraitsSchema = Schema.Struct({
  openingMode: Schema.optional(OpeningModeSchema),
  perspectiveShiftDensity: Schema.optional(PerspectiveShiftDensitySchema),
  usesCounterexamples: Schema.optional(TraitFrequencySchema),
  selfQuestioning: Schema.optional(SelfQuestioningLevelSchema),
  insightTiming: Schema.optional(InsightTimingSchema),
  usesAnalogies: Schema.optional(TraitFrequencySchema),
  closingMode: Schema.optional(ClosingModeSchema)
});
export type DevelopmentTraits = typeof DevelopmentTraitsSchema.Type;

export const TraitRecordSchema = Schema.Struct({
  value: Schema.optional(TraitValueSchema),
  confidence: TraitConfidenceSchema,
  status: TraitStatusSchema,
  evidenceExampleIds: Schema.Array(Schema.String)
});
export type TraitRecord = typeof TraitRecordSchema.Type;

export const DevelopmentTraitProfileSchema = Schema.Struct({
  traits: DevelopmentTraitsSchema,
  records: Schema.Record({ key: TraitKeySchema, value: TraitRecordSchema })
});
export type DevelopmentTraitProfile = typeof DevelopmentTraitProfileSchema.Type;

export const TraitEvidenceEntrySchema = Schema.Struct({
  exampleIndex: Schema.optional(Schema.Number),
  exampleId: Schema.optional(Schema.String),
  value: Schema.optional(TraitValueSchema)
});
export type TraitEvidenceEntry = typeof TraitEvidenceEntrySchema.Type;

export const TraitEvidenceDraftSchema = Schema.Record({
  key: TraitKeySchema,
  value: Schema.Array(TraitEvidenceEntrySchema)
});
export type TraitEvidenceDraft = typeof TraitEvidenceDraftSchema.Type;

export const TraitConfirmationResponseSchema = Schema.Literal("confirmed", "rejected", "skipped");
export type TraitConfirmationResponse = typeof TraitConfirmationResponseSchema.Type;

export const TraitConfirmationInputSchema = Schema.Struct({
  traitKey: TraitKeySchema,
  response: TraitConfirmationResponseSchema
});
export type TraitConfirmationInput = typeof TraitConfirmationInputSchema.Type;

export const TraitConfirmationRecordSchema = Schema.Struct({
  response: TraitConfirmationResponseSchema,
  recordedAt: Schema.String
});
export type TraitConfirmationRecord = typeof TraitConfirmationRecordSchema.Type;

export const ArgumentDevelopmentSignatureSchema = Schema.Struct({
  developmentProse: Schema.String,
  moveLabels: Schema.Array(Schema.String),
  transitionTendencies: Schema.Array(TransitionTendencySchema),
  epistemicPosture: EpistemicPostureSchema,
  structuralAntiPatterns: Schema.Array(Schema.String),
  traitProfile: Schema.optional(DevelopmentTraitProfileSchema)
});
export type ArgumentDevelopmentSignature = typeof ArgumentDevelopmentSignatureSchema.Type;

export const ArgumentDevelopmentExtractionResultSchema = Schema.Struct({
  development: ArgumentDevelopmentSignatureSchema,
  traits: Schema.optional(DevelopmentTraitsSchema),
  traitEvidence: Schema.optional(TraitEvidenceDraftSchema)
});
export type ArgumentDevelopmentExtractionResult = typeof ArgumentDevelopmentExtractionResultSchema.Type;

export const UnifiedVoiceSignatureSchema = Schema.Struct({
  core: CoreReasoningSignatureSchema,
  development: ArgumentDevelopmentSignatureSchema
});
export type UnifiedVoiceSignature = typeof UnifiedVoiceSignatureSchema.Type;

export const VoiceReasoningPresentationViewSchema = Schema.Struct({
  core: CoreReasoningSignatureSchema,
  reasoningVersion: Schema.optional(Schema.Number),
  development: Schema.optional(ArgumentDevelopmentSignatureSchema),
  developmentImmature: Schema.optional(Schema.Boolean),
  traitProfile: Schema.optional(DevelopmentTraitProfileSchema)
});
export type VoiceReasoningPresentationView = typeof VoiceReasoningPresentationViewSchema.Type;

export const decodeArgumentDevelopmentSignature = createSchemaDecoder(
  "ArgumentDevelopmentSignature",
  ArgumentDevelopmentSignatureSchema
);
export const decodeArgumentDevelopmentExtractionResult = createSchemaDecoder(
  "ArgumentDevelopmentExtractionResult",
  ArgumentDevelopmentExtractionResultSchema
);
export const decodeUnifiedVoiceSignature = createSchemaDecoder(
  "UnifiedVoiceSignature",
  UnifiedVoiceSignatureSchema
);
export const decodeCoreReasoningSignature = createSchemaDecoder(
  "CoreReasoningSignature",
  CoreReasoningSignatureSchema
);
export const decodeReasoningExtractionResult = createSchemaDecoder(
  "ReasoningExtractionResult",
  ReasoningExtractionResultSchema
);
export const decodeVoiceReasoningPresentationView = createSchemaDecoder(
  "VoiceReasoningPresentationView",
  VoiceReasoningPresentationViewSchema
);
export const decodeDevelopmentTraitProfile = createSchemaDecoder(
  "DevelopmentTraitProfile",
  DevelopmentTraitProfileSchema
);
export const decodeTraitConfirmationInput = createSchemaDecoder(
  "TraitConfirmationInput",
  TraitConfirmationInputSchema
);
