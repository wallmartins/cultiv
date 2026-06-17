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

export const FormatRegisterSchema = Schema.Literal("formal", "informal", "technical", "conversational");
export type FormatRegister = typeof FormatRegisterSchema.Type;

export const OpeningStyleSchema = Schema.Literal("direct", "contextual", "provocative");
export type OpeningStyle = typeof OpeningStyleSchema.Type;

export const TechnicalDensitySchema = Schema.Literal("low", "medium", "high");
export type TechnicalDensity = typeof TechnicalDensitySchema.Type;

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

export const FormatExpressionProfileSchema = Schema.Struct({
  contentType: Schema.String,
  narrativeProse: Schema.String,
  register: FormatRegisterSchema,
  openingStyle: OpeningStyleSchema,
  technicalDensity: TechnicalDensitySchema
});
export type FormatExpressionProfile = typeof FormatExpressionProfileSchema.Type;

export const ReasoningExtractionResultSchema = Schema.Struct({
  core: CoreReasoningSignatureSchema,
  formatExpressions: Schema.Record({ key: Schema.String, value: FormatExpressionProfileSchema })
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
  "advocacy_mixed"
);
export type EpistemicPosture = typeof EpistemicPostureSchema.Type;

export const ArgumentDevelopmentSignatureSchema = Schema.Struct({
  developmentProse: Schema.String,
  moveLabels: Schema.Array(Schema.String),
  transitionTendencies: Schema.Array(TransitionTendencySchema),
  epistemicPosture: EpistemicPostureSchema,
  structuralAntiPatterns: Schema.Array(Schema.String)
});
export type ArgumentDevelopmentSignature = typeof ArgumentDevelopmentSignatureSchema.Type;

export const ArgumentDevelopmentExtractionResultSchema = Schema.Struct({
  development: ArgumentDevelopmentSignatureSchema
});
export type ArgumentDevelopmentExtractionResult = typeof ArgumentDevelopmentExtractionResultSchema.Type;

export const UnifiedVoiceSignatureSchema = Schema.Struct({
  core: CoreReasoningSignatureSchema,
  development: ArgumentDevelopmentSignatureSchema,
  formatExpressions: Schema.Record({ key: Schema.String, value: FormatExpressionProfileSchema })
});
export type UnifiedVoiceSignature = typeof UnifiedVoiceSignatureSchema.Type;

export const VoiceReasoningPresentationViewSchema = Schema.Struct({
  core: CoreReasoningSignatureSchema,
  formatExpressions: Schema.Array(FormatExpressionProfileSchema),
  reasoningVersion: Schema.optional(Schema.Number),
  development: Schema.optional(ArgumentDevelopmentSignatureSchema),
  developmentImmature: Schema.optional(Schema.Boolean)
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
export const decodeFormatExpressionProfile = createSchemaDecoder(
  "FormatExpressionProfile",
  FormatExpressionProfileSchema
);
export const decodeReasoningExtractionResult = createSchemaDecoder(
  "ReasoningExtractionResult",
  ReasoningExtractionResultSchema
);
export const decodeVoiceReasoningPresentationView = createSchemaDecoder(
  "VoiceReasoningPresentationView",
  VoiceReasoningPresentationViewSchema
);
