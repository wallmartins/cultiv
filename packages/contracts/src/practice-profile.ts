import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";

export const PracticeProfileDepthSchema = Schema.Literal("seed", "enriched");
export type PracticeProfileDepth = typeof PracticeProfileDepthSchema.Type;

// The 7 Practice Dimensions, curated + closed (norte backbone-curado.md) — the LLM fills these,
// it never decides which ones exist.
export const PracticeDimensionKeySchema = Schema.Literal(
  "point",
  "evidence",
  "readerAssumption",
  "resistance",
  "stake",
  "fieldCliche",
  "lexicon"
);
export type PracticeDimensionKey = typeof PracticeDimensionKeySchema.Type;

export const PracticeDimensionsSchema = Schema.Struct({
  point: Schema.String,
  evidence: Schema.String,
  readerAssumption: Schema.String,
  resistance: Schema.String,
  stake: Schema.String,
  fieldCliche: Schema.String,
  lexicon: Schema.Array(Schema.String)
});
export type PracticeDimensions = typeof PracticeDimensionsSchema.Type;

// ponytail: F0-1 — `PracticeProfile`/`PracticeProfileDiagnostics` share the bare name with domain's
// Entity types (packages/domain/src/practice-profile.ts); latent, nothing imports both yet.
// Disambiguate per the repo convention (cf. `TextQualityVoiceProfile` / `VoiceProfileView`) when a
// consumer first needs both shapes in one scope.
export const PracticeProfileSchema = Schema.Struct({
  userId: Schema.String,
  version: Schema.Number,
  depth: PracticeProfileDepthSchema,
  subject: Schema.String,
  vantagePoint: Schema.String,
  audiences: Schema.Array(Schema.String),
  dimensions: PracticeDimensionsSchema
});
export type PracticeProfile = typeof PracticeProfileSchema.Type;

export const EnrichmentSuggestionResponseSchema = Schema.Literal("accepted", "rejected");
export type EnrichmentSuggestionResponse = typeof EnrichmentSuggestionResponseSchema.Type;

export const EnrichmentSuggestionRecordSchema = Schema.Struct({
  response: EnrichmentSuggestionResponseSchema,
  recordedAt: Schema.String
});
export type EnrichmentSuggestionRecord = typeof EnrichmentSuggestionRecordSchema.Type;

export const PracticeProfileDiagnosticsSchema = Schema.Struct({
  userId: Schema.String,
  activeVersion: Schema.Number,
  pendingVersion: Schema.optional(Schema.Number),
  updating: Schema.Boolean,
  summary: Schema.optional(Schema.String),
  // key is PracticeDimensionKey in spirit, but Schema.String keeps the record sparse — a
  // Schema.Record keyed by a Literal union would require every dimension to be present
  // (same reason voice.ts's traitConfirmations keys on Schema.String, not TraitKeySchema).
  enrichmentSuggestions: Schema.optional(
    Schema.Record({ key: Schema.String, value: EnrichmentSuggestionRecordSchema })
  ),
  // G5 niche-ask (norte gerador-spec §G5): dimensions that came back thin from G2 enrichment and
  // still owe the author a specificity question in /voice (F5-3). Distinct from enrichmentSuggestions,
  // which records the author's accept/reject responses — these are the *pending* asks.
  pendingNicheAskDimensions: Schema.optional(Schema.Array(PracticeDimensionKeySchema))
});
export type PracticeProfileDiagnostics = typeof PracticeProfileDiagnosticsSchema.Type;

export const decodePracticeProfile = createSchemaDecoder("PracticeProfile", PracticeProfileSchema);
export const decodePracticeProfileDiagnostics = createSchemaDecoder(
  "PracticeProfileDiagnostics",
  PracticeProfileDiagnosticsSchema
);
