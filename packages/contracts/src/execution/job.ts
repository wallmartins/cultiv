import { Schema } from "effect";
import { PlanSignatureSchema } from "../plan-signature.js";
import { createSchemaDecoder } from "../shared.js";

export const ExecutionModeSchema = Schema.Literal("sync", "async");
export type ExecutionMode = typeof ExecutionModeSchema.Type;

export const JobStatusSchema = Schema.Literal("queued", "running", "done", "failed");
export type JobStatus = typeof JobStatusSchema.Type;

export const PipelineTypeSchema = Schema.Literal(
  "long-form-blog",
  "validation-post",
  "architecture-post",
  "linkedin-post",
  "twitter-thread",
  "newsletter",
  "short-piece",
  "long-piece",
  "serial-piece",
  "edition-piece"
);
export type PipelineType = typeof PipelineTypeSchema.Type;

export const QualityModeSchema = Schema.Literal("fast", "balanced", "strict");
export type QualityMode = typeof QualityModeSchema.Type;

export const PreviewRecommendationSchema = Schema.Struct({
  qualityMode: QualityModeSchema,
  reasonCodes: Schema.Array(Schema.String),
  explanation: Schema.String
});
export type PreviewRecommendation = typeof PreviewRecommendationSchema.Type;

export const PipelineStepDefinitionSchema = Schema.Struct({
  name: Schema.String,
  skill: Schema.String,
  config: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown }))
});
export type PipelineStepDefinition = typeof PipelineStepDefinitionSchema.Type;

export const PipelineDefinitionSchema = Schema.Struct({
  name: Schema.String,
  steps: Schema.Array(PipelineStepDefinitionSchema)
});
export type PipelineDefinition = typeof PipelineDefinitionSchema.Type;

export const JobProgressSchema = Schema.Struct({
  currentStep: Schema.String,
  stepIndex: Schema.Number,
  totalSteps: Schema.Number,
  percent: Schema.Number
});
export type JobProgress = typeof JobProgressSchema.Type;

export const JobResultSchema = Schema.Struct({
  content: Schema.String,
  metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown })
});
export type JobResult = typeof JobResultSchema.Type;

export const JobErrorSchema = Schema.Struct({
  message: Schema.String,
  step: Schema.NullOr(Schema.String)
});
export type JobError = typeof JobErrorSchema.Type;

export const JobCreatedResponseSchema = Schema.Struct({
  jobId: Schema.String,
  status: Schema.Literal("queued", "done"),
  contentType: Schema.String,
  estimatedSteps: Schema.Number,
  createdAt: Schema.String
});
export type JobCreatedResponse = typeof JobCreatedResponseSchema.Type;

export const HealthCheckResponseSchema = Schema.Struct({
  status: Schema.Literal("ok", "error"),
  time: Schema.String,
  engine: Schema.Struct({
    status: Schema.Literal("ready", "degraded"),
    version: Schema.String,
    uptimeSec: Schema.Number
  })
});
export type HealthCheckResponse = typeof HealthCheckResponseSchema.Type;

export const ReadinessCheckStatusSchema = Schema.Literal("ready", "blocked");
export type ReadinessCheckStatus = typeof ReadinessCheckStatusSchema.Type;

export const ReadinessCheckSchema = Schema.Struct({
  status: ReadinessCheckStatusSchema,
  detail: Schema.optional(Schema.String)
});
export type ReadinessCheck = typeof ReadinessCheckSchema.Type;

export const ReadinessResponseSchema = Schema.Struct({
  status: ReadinessCheckStatusSchema,
  time: Schema.String,
  service: Schema.Struct({
    environment: Schema.String,
    version: Schema.String
  }),
  checks: Schema.Struct({
    config: ReadinessCheckSchema,
    auth: ReadinessCheckSchema,
    database: ReadinessCheckSchema
  })
});
export type ReadinessResponse = typeof ReadinessResponseSchema.Type;

export const ExecutionControlsSchema = Schema.Struct({
  qualityMode: Schema.optional(QualityModeSchema),
  targetScore: Schema.optional(Schema.Number),
  maxIterations: Schema.optional(Schema.Number),
  minImprovementDelta: Schema.optional(Schema.Number),
  maxLLMCalls: Schema.optional(Schema.Number)
});
export type ExecutionControls = typeof ExecutionControlsSchema.Type;

export const ExecutionTelemetrySchema = Schema.Struct({
  llm: Schema.optional(
    Schema.Struct({
      executedCount: Schema.Number,
      bypassedCount: Schema.Number,
      llmCallsSaved: Schema.Number,
      bypassRate: Schema.Number
    })
  ),
  cost: Schema.optional(
    Schema.Struct({
      inputTokensTotal: Schema.Number,
      outputTokensTotal: Schema.Number,
      estimatedUsdCost: Schema.Number,
      debitedCredits: Schema.Number
    })
  ),
  selection: Schema.optional(
    Schema.Struct({
      reason: Schema.String,
      adapter: Schema.String,
      model: Schema.String
    })
  ),
  preview: Schema.optional(
    Schema.Struct({
      quoteId: Schema.optional(Schema.String),
      recommendedQualityMode: Schema.optional(QualityModeSchema),
      finalQualityMode: QualityModeSchema,
      divergedFromRecommendation: Schema.Boolean,
      recommendationReasonCodes: Schema.Array(Schema.String)
    })
  ),
  pricing: Schema.optional(
    Schema.Struct({
      quoteId: Schema.optional(Schema.String),
      policyVersion: Schema.optional(Schema.String),
      contentType: Schema.optional(Schema.String),
      planSignature: Schema.optional(Schema.String),
      lengthTier: Schema.optional(Schema.String),
      plannedCreditPrice: Schema.optional(Schema.Number),
      observedDebitedCredits: Schema.Number,
      observedUsdCost: Schema.Number
    })
  ),
  compositor: Schema.optional(
    Schema.Struct({
      planId: Schema.String
    })
  ),
  planner: Schema.optional(
    Schema.Struct({
      patchCount: Schema.Number,
      ops: Schema.Array(Schema.String),
      basePlanSignature: PlanSignatureSchema,
      finalPlanSignature: PlanSignatureSchema
    })
  ),
  providers: Schema.optional(
    Schema.Struct({
      finalProvider: Schema.String,
      finalModel: Schema.String,
      attempts: Schema.Array(
        Schema.Struct({
          stepName: Schema.String,
          stepIndex: Schema.Number,
          provider: Schema.String,
          model: Schema.String,
          path: Schema.Literal("preferred", "fallback"),
          status: Schema.Literal("succeeded", "failed"),
          inputTokens: Schema.optional(Schema.Number),
          outputTokens: Schema.optional(Schema.Number),
          estimatedUsdCost: Schema.optional(Schema.Number),
          debitedCredits: Schema.optional(Schema.Number)
        })
      )
    })
  ),
  billing: Schema.optional(
    Schema.Struct({
      userId: Schema.String,
      planId: Schema.String,
      generationCycleId: Schema.String
    })
  )
});
export type ExecutionTelemetry = typeof ExecutionTelemetrySchema.Type;

export const AsyncRunResponseSchema = JobCreatedResponseSchema;
export type AsyncRunResponse = typeof AsyncRunResponseSchema.Type;

export const decodeJobCreatedResponse = createSchemaDecoder("JobCreatedResponse", JobCreatedResponseSchema);
export const decodeHealthCheckResponse = createSchemaDecoder("HealthCheckResponse", HealthCheckResponseSchema);
export const decodeReadinessResponse = createSchemaDecoder("ReadinessResponse", ReadinessResponseSchema);
