import { Schema } from "effect";
import { QualityModeSchema } from "./execution.js";
import { createSchemaDecoder } from "./shared.js";
import { ReasonCodeSchema } from "./voice.js";

export const ContentTypeDefinitionSchema = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  steps: Schema.Array(Schema.String),
  defaultLanguage: Schema.String,
  inputSchema: Schema.Record({ key: Schema.String, value: Schema.Unknown })
});
export type ContentTypeDefinition = typeof ContentTypeDefinitionSchema.Type;

export const LanguageProfileSummarySchema = Schema.Struct({
  code: Schema.String,
  name: Schema.String,
  defaults: Schema.NullOr(
    Schema.Struct({
      tone: Schema.optional(Schema.String),
      constraints: Schema.optional(Schema.Array(Schema.String))
    })
  )
});
export type LanguageProfileSummary = typeof LanguageProfileSummarySchema.Type;

export const ContentTypeFieldTypeSchema = Schema.Literal("string", "text", "number", "boolean", "enum", "object", "array");
export type ContentTypeFieldType = typeof ContentTypeFieldTypeSchema.Type;

export const ContentTypeFieldViewSchema = Schema.Struct({
  key: Schema.String,
  label: Schema.String,
  type: ContentTypeFieldTypeSchema,
  required: Schema.Boolean,
  highImpact: Schema.Boolean,
  helpText: Schema.optional(Schema.String),
  options: Schema.optional(Schema.Array(Schema.String))
});
export type ContentTypeFieldView = typeof ContentTypeFieldViewSchema.Type;

export const BriefingGuidanceViewSchema = Schema.Struct({
  objective: Schema.String,
  tips: Schema.Array(Schema.String),
  exampleBriefing: Schema.String,
  commonMistakes: Schema.Array(Schema.String)
});
export type BriefingGuidanceView = typeof BriefingGuidanceViewSchema.Type;

export const ContentTypeCatalogItemViewSchema = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  available: Schema.Boolean,
  deprecated: Schema.optional(Schema.Boolean),
  reasonCode: Schema.optional(ReasonCodeSchema),
  defaultLanguage: Schema.String,
  supportedLanguages: Schema.Array(Schema.String),
  steps: Schema.Array(Schema.String),
  inputSchema: Schema.Array(ContentTypeFieldViewSchema),
  briefingGuidance: BriefingGuidanceViewSchema,
  briefingGuidanceByLanguage: Schema.optional(
    Schema.Record({ key: Schema.String, value: BriefingGuidanceViewSchema })
  )
});
export type ContentTypeCatalogItemView = typeof ContentTypeCatalogItemViewSchema.Type;

export const ContentTypeCatalogCommercialSchema = Schema.Struct({
  planTier: Schema.String,
  allowedQualityModes: Schema.Array(QualityModeSchema)
});
export type ContentTypeCatalogCommercial = typeof ContentTypeCatalogCommercialSchema.Type;

export const ContentTypeCatalogViewSchema = Schema.Struct({
  items: Schema.Array(ContentTypeCatalogItemViewSchema),
  commercial: Schema.optional(ContentTypeCatalogCommercialSchema)
});
export type ContentTypeCatalogView = typeof ContentTypeCatalogViewSchema.Type;

export const decodeContentTypeCatalogView = createSchemaDecoder("ContentTypeCatalogView", ContentTypeCatalogViewSchema);
