import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";
import { GenreSignatureSchema } from "./reasoning.js";

// F4-7 — the genre producer (ADR 0010 §10). At the end of the generation questions the four slot
// answers (carried in the briefing) are read by SUBSTANCE, never lexicon, to infer the text's
// GenreSignature. The dominant rhetorical mode fixes the compositor plan — and therefore the price
// quote (pricing keys on planSignature, which embeds the mode) — so this runs before the preview
// and is threaded verbatim into generate.
const GenreInferenceBriefingSchema = Schema.Union(
  Schema.String,
  Schema.Record({ key: Schema.String, value: Schema.Unknown })
);

export const GenreInferenceRequestSchema = Schema.Struct({
  briefing: GenreInferenceBriefingSchema,
  language: Schema.optional(Schema.String)
});
export type GenreInferenceRequest = typeof GenreInferenceRequestSchema.Type;

export const GenreInferenceResponseSchema = Schema.Struct({
  genre: GenreSignatureSchema
});
export type GenreInferenceResponse = typeof GenreInferenceResponseSchema.Type;

export const decodeGenreInferenceRequest = createSchemaDecoder(
  "GenreInferenceRequest",
  GenreInferenceRequestSchema
);
export const decodeGenreInferenceResponse = createSchemaDecoder(
  "GenreInferenceResponse",
  GenreInferenceResponseSchema
);
