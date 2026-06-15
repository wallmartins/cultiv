import { Schema } from "effect";
import { PipelineTypeSchema, QualityModeSchema } from "@my-ai-orchestrator/contracts";

const StepExecutionTypeSchema = Schema.Literal("local", "llm");
const AIPolicyLifecycleSchema = Schema.Literal("active", "legacy-supported");
const BillingPlanTierSchema = Schema.Literal("free", "starter", "pro", "enterprise");
const RoutingFallbackConditionSchema = Schema.Literal(
  "transport_error",
  "timeout",
  "invalid_request",
  "invalid_response",
  "provider_unavailable"
);

export const AIPolicyStepDocumentSchema = Schema.Struct({
  name: Schema.String,
  skill: Schema.String,
  execution: StepExecutionTypeSchema,
  routingProfile: Schema.optional(Schema.String),
  override: Schema.optional(
    Schema.Struct({
      from: Schema.Literal("local"),
      to: Schema.Literal("llm"),
      reason: Schema.String
    })
  )
});

export const AIPolicyCatalogDocumentSchema = Schema.Struct({
  policyVersion: Schema.String,
  routingProfiles: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      preferredAttempts: Schema.NonEmptyArray(
        Schema.Struct({
          provider: Schema.String,
          model: Schema.String,
          timeoutMs: Schema.optional(Schema.Number)
        })
      ),
      fallbackAttempts: Schema.Array(
        Schema.Struct({
          provider: Schema.String,
          model: Schema.String,
          timeoutMs: Schema.optional(Schema.Number)
        })
      ),
      operationalConstraints: Schema.Struct({
        fallbackOn: Schema.NonEmptyArray(RoutingFallbackConditionSchema)
      })
    })
  ),
  contentTypes: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      label: Schema.String,
      defaultLanguage: Schema.String,
      pipelineType: PipelineTypeSchema
    })
  ),
  pipelines: Schema.Array(
    Schema.Struct({
      pipelineType: PipelineTypeSchema,
      contentType: Schema.String,
      defaultLanguage: Schema.String,
      defaultQualityMode: QualityModeSchema,
      steps: Schema.Array(AIPolicyStepDocumentSchema)
    })
  )
});
export type AIPolicyCatalogDocument = typeof AIPolicyCatalogDocumentSchema.Type;

export const AIPolicyPricingDocumentSchema = Schema.Struct({
  policyVersion: Schema.String,
  lifecycle: AIPolicyLifecycleSchema,
  pricing: Schema.Array(
    Schema.Struct({
      planTier: BillingPlanTierSchema,
      contentType: Schema.String,
      qualityMode: QualityModeSchema,
      creditPrice: Schema.Number
    })
  )
});
export type AIPolicyPricingDocument = typeof AIPolicyPricingDocumentSchema.Type;

export const AIPolicyManifestSchema = Schema.Struct({
  activeVersion: Schema.String,
  versions: Schema.Array(
    Schema.Struct({
      version: Schema.String,
      lifecycle: AIPolicyLifecycleSchema,
      catalogPath: Schema.String,
      pricingPath: Schema.String
    })
  )
});
export type AIPolicyManifest = typeof AIPolicyManifestSchema.Type;
