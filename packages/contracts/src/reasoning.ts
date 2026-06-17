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

export const VoiceReasoningPresentationViewSchema = Schema.Struct({
  core: CoreReasoningSignatureSchema,
  formatExpressions: Schema.Array(FormatExpressionProfileSchema),
  reasoningVersion: Schema.optional(Schema.Number)
});
export type VoiceReasoningPresentationView = typeof VoiceReasoningPresentationViewSchema.Type;

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
