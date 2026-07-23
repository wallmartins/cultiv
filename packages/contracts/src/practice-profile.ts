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

// F4-2 — the declared axes exposed to the generation flow so the audience-narrowing step can offer
// the author's own audiences as chips. Read-only projection of the sovereign axes (§1) only — never
// the derived dimensions, which stay server-side (they drive the generator, not the UI).
export const PracticeProfileDeclaredViewSchema = Schema.Struct({
  subject: Schema.String,
  vantagePoint: Schema.String,
  audiences: Schema.Array(Schema.String),
  depth: PracticeProfileDepthSchema
});
export type PracticeProfileDeclaredView = typeof PracticeProfileDeclaredViewSchema.Type;

export const MePracticeProfileResponseSchema = Schema.Struct({
  // null when the author has no practice profile yet — the narrowing step then renders nothing and the
  // generation runs with no narrowed audience at all (the prefill/briefing omit the audience field).
  profile: Schema.NullOr(PracticeProfileDeclaredViewSchema)
});
export type MePracticeProfileResponse = typeof MePracticeProfileResponseSchema.Type;

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

// F5 · /voice practice section. The niche-ask (G5) surfaced to the author: a curated, multi-line
// specificity question built server-side from the thin dimensions + subject + locale. Only the
// `question` crosses the wire — the dimension keys stay server-side (the answer/dismiss re-derives the
// pending set from diagnostics), so the internal 7-dimension taxonomy is never exposed (ADR 0010 §2).
export const PracticeNicheAskViewSchema = Schema.Struct({
  question: Schema.String
});
export type PracticeNicheAskView = typeof PracticeNicheAskViewSchema.Type;

// F5-1 · the /voice identity read — a superset of the F4-2 declared view (adds the pending niche-ask).
// Still exposes ONLY the sovereign declared axes + depth; the 7 derived dimensions never leave the
// backend (ADR 0010 §2). Distinct route from GET /me/practice-profile (F4-2's narrowing hot path).
export const PracticeIdentityViewSchema = Schema.Struct({
  subject: Schema.String,
  vantagePoint: Schema.String,
  audiences: Schema.Array(Schema.String),
  depth: PracticeProfileDepthSchema,
  nicheAsk: Schema.NullOr(PracticeNicheAskViewSchema)
});
export type PracticeIdentityView = typeof PracticeIdentityViewSchema.Type;

export const MePracticeIdentityResponseSchema = Schema.Struct({
  // null when the author has no practice profile yet — /voice renders no practice section in that case.
  // A completed calibration always derives the seed profile (F3-1), so for a ready voice profile this is
  // effectively only the transient loading window; the companion treats it the same (renders nothing).
  profile: Schema.NullOr(PracticeIdentityViewSchema)
});
export type MePracticeIdentityResponse = typeof MePracticeIdentityResponseSchema.Type;

// F5-2(a) · edit the declared axes in-place. Material axis changes re-seed the profile server-side
// (C-1 guard); cosmetic changes just persist. Never touches the derived dimensions directly.
export const UpdateDeclaredAxesInputSchema = Schema.Struct({
  subject: Schema.String,
  vantagePoint: Schema.String,
  audiences: Schema.Array(Schema.String)
});
export type UpdateDeclaredAxesInput = typeof UpdateDeclaredAxesInputSchema.Type;

// F5-2(b)/F5-3 · respond to the niche-ask. "answer" re-triggers G2 enrichment with the author's
// specifics; "dismiss" records the rejection and stops asking. Both resolve the pending ask.
export const NicheAskResponseInputSchema = Schema.Union(
  Schema.Struct({ action: Schema.Literal("answer"), answer: Schema.String }),
  Schema.Struct({ action: Schema.Literal("dismiss") })
);
export type NicheAskResponseInput = typeof NicheAskResponseInputSchema.Type;

export const decodePracticeProfile = createSchemaDecoder("PracticeProfile", PracticeProfileSchema);
export const decodeMePracticeIdentityResponse = createSchemaDecoder(
  "MePracticeIdentityResponse",
  MePracticeIdentityResponseSchema
);
export const decodeUpdateDeclaredAxesInput = createSchemaDecoder(
  "UpdateDeclaredAxesInput",
  UpdateDeclaredAxesInputSchema
);
export const decodeNicheAskResponseInput = createSchemaDecoder(
  "NicheAskResponseInput",
  NicheAskResponseInputSchema
);
export const decodeMePracticeProfileResponse = createSchemaDecoder(
  "MePracticeProfileResponse",
  MePracticeProfileResponseSchema
);
export const decodePracticeProfileDiagnostics = createSchemaDecoder(
  "PracticeProfileDiagnostics",
  PracticeProfileDiagnosticsSchema
);
