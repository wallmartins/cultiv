import { Schema } from "effect";
import {
  SafetyClassificationCategorySchema,
  SafetyDecisionOutcomeSchema,
  SafetyEvidenceBoundarySchema,
  SafetyOverrideabilitySchema,
  SafetyPolicyFamilySchema,
  SafetyPolicyLifecycleSchema
} from "../../safety/safety-taxonomy-schemas.js";

export const SafetyPolicyFamilyDocumentSchema = Schema.Struct({
  family: SafetyPolicyFamilySchema,
  defaultOutcome: SafetyDecisionOutcomeSchema,
  allowedOutcomes: Schema.NonEmptyArray(SafetyDecisionOutcomeSchema),
  overrideability: SafetyOverrideabilitySchema,
  evidenceBoundary: SafetyEvidenceBoundarySchema,
  detectorAdapters: Schema.Array(Schema.String),
  nonOverridableCategories: Schema.optional(Schema.Array(SafetyClassificationCategorySchema)),
  maxOverrideWindowMinutes: Schema.optional(Schema.Number.pipe(Schema.positive()))
});

export const SafetyClassificationDocumentSchema = Schema.Struct({
  category: SafetyClassificationCategorySchema,
  defaultOutcome: SafetyDecisionOutcomeSchema,
  minimizationRequired: Schema.Boolean,
  description: Schema.String
});

export const SafetyDetectorAdapterDocumentSchema = Schema.Struct({
  id: Schema.String,
  kind: Schema.Literal("classifier", "scanner", "heuristic"),
  optional: Schema.Boolean,
  boundaries: Schema.NonEmptyArray(SafetyEvidenceBoundarySchema)
});

export const SafetyPolicyDocumentSchema = Schema.Struct({
  policyVersion: Schema.String,
  lifecycle: SafetyPolicyLifecycleSchema,
  unknownInputOutcome: Schema.Literal("block"),
  evidenceBoundaries: Schema.NonEmptyArray(SafetyEvidenceBoundarySchema),
  families: Schema.Array(SafetyPolicyFamilyDocumentSchema),
  classifications: Schema.Array(SafetyClassificationDocumentSchema),
  detectorAdapters: Schema.Array(SafetyDetectorAdapterDocumentSchema)
});
export type SafetyPolicyDocument = typeof SafetyPolicyDocumentSchema.Type;

export const SafetyPolicyManifestSchema = Schema.Struct({
  activeVersion: Schema.String,
  versions: Schema.Array(
    Schema.Struct({
      version: Schema.String,
      lifecycle: SafetyPolicyLifecycleSchema,
      policyPath: Schema.String
    })
  )
});
export type SafetyPolicyManifest = typeof SafetyPolicyManifestSchema.Type;
