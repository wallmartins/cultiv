import { Schema } from "effect";
import { GenerationIntentSchema, GenerationLengthTierSchema } from "./generation-intent.js";
import { PlanSignatureSchema, type PlanSignature } from "./plan-signature.js";

export { PlanSignatureSchema, type PlanSignature };

export const PlannedStepSchema = Schema.Struct({
  name: Schema.String,
  skill: Schema.String,
  execution: Schema.Literal("local", "llm"),
  routingProfile: Schema.optional(Schema.String)
});
export type PlannedStep = typeof PlannedStepSchema.Type;

export const ExecutionPlanParametersSchema = Schema.Struct({
  wordTarget: Schema.Struct({ min: Schema.Number, max: Schema.Number }),
  expressionProfile: Schema.String,
  intent: GenerationIntentSchema,
  lengthTier: GenerationLengthTierSchema
});
export type ExecutionPlanParameters = typeof ExecutionPlanParametersSchema.Type;

export const ExecutionPlanSchema = Schema.Struct({
  planId: Schema.String,
  planSignature: PlanSignatureSchema,
  steps: Schema.Array(PlannedStepSchema),
  parameters: ExecutionPlanParametersSchema
});
export type ExecutionPlan = typeof ExecutionPlanSchema.Type;

export const CompositorMetadataSchema = Schema.Struct({
  planId: Schema.String,
  planSignature: PlanSignatureSchema,
  expressionProfile: Schema.String,
  lengthTier: GenerationLengthTierSchema,
  wordTarget: Schema.Struct({ min: Schema.Number, max: Schema.Number })
});
export type CompositorMetadata = typeof CompositorMetadataSchema.Type;
