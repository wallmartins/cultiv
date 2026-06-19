import { Schema } from "effect";
import { BriefingGuidanceViewSchema, ContentTypeFieldViewSchema } from "./content-types.js";
import { GenerationIntentSchema, GenerationLengthTierSchema } from "./generation-intent.js";
import { createSchemaDecoder } from "./shared.js";

export const GenerationIntentCatalogItemSchema = Schema.Struct({
  id: GenerationIntentSchema,
  label: Schema.String,
  description: Schema.String,
  defaultLengthTier: GenerationLengthTierSchema,
  featured: Schema.Boolean,
  inputSchema: Schema.Array(ContentTypeFieldViewSchema),
  briefingGuidance: BriefingGuidanceViewSchema
});
export type GenerationIntentCatalogItem = typeof GenerationIntentCatalogItemSchema.Type;

export const GenerationIntentCatalogViewSchema = Schema.Struct({
  items: Schema.Array(GenerationIntentCatalogItemSchema)
});
export type GenerationIntentCatalogView = typeof GenerationIntentCatalogViewSchema.Type;

export const decodeGenerationIntentCatalogView = createSchemaDecoder(
  "GenerationIntentCatalogView",
  GenerationIntentCatalogViewSchema
);
