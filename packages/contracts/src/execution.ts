import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";
import { ReasonCodeSchema, FallbackReasonCodeSchema, NextActionCodeSchema, VoiceAdaptationModeSchema, VoiceProfileConfidenceSchema, VoiceSignalSummarySchema } from "./voice.js";

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
  "newsletter"
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
      plannedCreditPrice: Schema.optional(Schema.Number),
      observedDebitedCredits: Schema.Number,
      observedUsdCost: Schema.Number
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

export const ApiErrorCategorySchema = Schema.Literal(
  "invalid_request",
  "authentication",
  "authorization",
  "not_found",
  "conflict",
  "rate_limit",
  "internal"
);
export type ApiErrorCategory = typeof ApiErrorCategorySchema.Type;

export const ApiErrorCodeSchema = Schema.Literal(
  "invalid_request",
  "authentication_missing_token",
  "authentication_invalid_token",
  "authentication_expired_token",
  "authorization_insufficient_permission",
  "authorization_missing_role",
  "authorization_not_owner",
  "safety_input_blocked",
  "safety_input_quarantined",
  "user_suspended",
  "resource_not_found",
  "voice_training_consent_required",
  "quote_stale",
  "execution_conflict",
  "usage_restricted",
  "rate_limited",
  "service_unavailable",
  "internal_error"
);
export type ApiErrorCode = typeof ApiErrorCodeSchema.Type;

export const ApiErrorResponseSchema = Schema.Struct({
  status: Schema.Number,
  code: ApiErrorCodeSchema,
  category: ApiErrorCategorySchema,
  message: Schema.String,
  retryable: Schema.Boolean,
  details: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown }))
});
export type ApiErrorResponse = typeof ApiErrorResponseSchema.Type;

export const PendingVoiceProfileRebuildViewSchema = Schema.Struct({
  status: Schema.Literal("idle", "in_progress", "failed"),
  reasonCode: Schema.optional(ReasonCodeSchema),
  nextActionCodes: Schema.Array(NextActionCodeSchema)
});
export type PendingVoiceProfileRebuildView = typeof PendingVoiceProfileRebuildViewSchema.Type;

export const ExecutionVoiceMetadataViewSchema = Schema.Struct({
  voiceProfileConfidence: VoiceProfileConfidenceSchema,
  voiceAdaptationMode: VoiceAdaptationModeSchema,
  voiceProfileVersionUsed: Schema.Number,
  pendingVoiceProfileVersion: Schema.optional(Schema.Number),
  voiceProfileSnapshotId: Schema.String,
  usedFallbackVoiceProfile: Schema.Boolean,
  fallbackReasonCode: Schema.optional(FallbackReasonCodeSchema),
  appliedSignals: VoiceSignalSummarySchema,
  pendingProfileRebuild: PendingVoiceProfileRebuildViewSchema
});
export type ExecutionVoiceMetadataView = typeof ExecutionVoiceMetadataViewSchema.Type;

export const JobStatusResponseSchema = Schema.Struct({
  jobId: Schema.String,
  status: JobStatusSchema,
  contentType: Schema.String,
  progress: Schema.NullOr(JobProgressSchema),
  result: Schema.NullOr(JobResultSchema),
  error: Schema.NullOr(JobErrorSchema),
  createdAt: Schema.String,
  completedAt: Schema.NullOr(Schema.String),
  voice: Schema.optional(ExecutionVoiceMetadataViewSchema),
  userId: Schema.optional(Schema.String)
});
export type JobStatusResponse = typeof JobStatusResponseSchema.Type;

export const SSEEventSchema = Schema.Struct({
  type: Schema.Literal("progress", "done", "error"),
  jobId: Schema.String,
  payload: Schema.Union(JobProgressSchema, JobResultSchema, JobErrorSchema)
});
export type SSEEvent = typeof SSEEventSchema.Type;

/** Wire format for SSE `data:` payloads on `/me/executions/:id/events`. */
export const ExecutionSseEventSchema = Schema.Struct({
  type: Schema.Literal("progress", "done", "error"),
  payload: Schema.Union(JobProgressSchema, JobResultSchema, JobErrorSchema),
  occurredAt: Schema.String
});
export type ExecutionSseEvent = typeof ExecutionSseEventSchema.Type;

export const SimplifiedPipelineRequestSchema = Schema.Struct({
  userId: Schema.String,
  pipelineType: PipelineTypeSchema,
  briefing: Schema.Union(Schema.String, Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  importedContext: Schema.optional(Schema.String),
  context: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema),
  contentType: Schema.optional(Schema.String),
  model: Schema.optional(Schema.String),
  adapter: Schema.optional(Schema.String),
  quoteId: Schema.optional(Schema.String),
  previewRecommendation: Schema.optional(PreviewRecommendationSchema),
  includeTrace: Schema.optional(Schema.Boolean),
  idempotencyKey: Schema.optional(Schema.String)
});
export type SimplifiedPipelineRequest = typeof SimplifiedPipelineRequestSchema.Type;

export const ExplicitPipelineRequestSchema = Schema.Struct({
  pipeline: PipelineDefinitionSchema,
  importedContext: Schema.optional(Schema.String),
  context: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  inputs: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema),
  model: Schema.optional(Schema.String),
  adapter: Schema.optional(Schema.String),
  previewRecommendation: Schema.optional(PreviewRecommendationSchema),
  includeTrace: Schema.optional(Schema.Boolean),
  idempotencyKey: Schema.optional(Schema.String)
});
export type ExplicitPipelineRequest = typeof ExplicitPipelineRequestSchema.Type;

export const PipelineRequestSchema = Schema.Union(
  SimplifiedPipelineRequestSchema,
  ExplicitPipelineRequestSchema
);
export type PipelineRequest = typeof PipelineRequestSchema.Type;

export const MeExecutionRequestSchema = Schema.Struct({
  contentType: Schema.String,
  briefing: Schema.Union(Schema.String, Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  importedContext: Schema.optional(Schema.String),
  context: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  language: Schema.optional(Schema.String),
  qualityMode: Schema.optional(QualityModeSchema),
  model: Schema.optional(Schema.String),
  quoteId: Schema.optional(Schema.String),
  previewRecommendation: Schema.optional(PreviewRecommendationSchema),
  includeTrace: Schema.optional(Schema.Boolean),
  idempotencyKey: Schema.optional(Schema.String)
});
export type MeExecutionRequest = typeof MeExecutionRequestSchema.Type;

export const SyncRunResponseSchema = Schema.Struct({
  mode: ExecutionModeSchema,
  adapter: Schema.String,
  model: Schema.String,
  content: Schema.String,
  contentType: Schema.String,
  pipelineName: Schema.String,
  qualityMode: QualityModeSchema,
  controls: Schema.optional(ExecutionControlsSchema),
  telemetry: Schema.optional(ExecutionTelemetrySchema),
  voice: Schema.optional(ExecutionVoiceMetadataViewSchema),
  trace: Schema.optional(Schema.Unknown),
  idempotencyKey: Schema.optional(Schema.String)
});
export type SyncRunResponse = typeof SyncRunResponseSchema.Type;

export const RunResponseSchema = Schema.Union(SyncRunResponseSchema, AsyncRunResponseSchema);
export type RunResponse = typeof RunResponseSchema.Type;

export const SyncExecutionViewSchema = Schema.Struct({
  mode: Schema.Literal("sync"),
  contentType: Schema.String,
  pipelineName: Schema.String,
  content: Schema.String,
  adapter: Schema.String,
  model: Schema.String,
  qualityMode: QualityModeSchema,
  controls: Schema.optional(ExecutionControlsSchema),
  telemetry: Schema.optional(ExecutionTelemetrySchema),
  trace: Schema.optional(Schema.Unknown),
  voice: ExecutionVoiceMetadataViewSchema,
  idempotencyKey: Schema.optional(Schema.String)
});
export type SyncExecutionView = typeof SyncExecutionViewSchema.Type;

export const QueuedExecutionViewSchema = Schema.Struct({
  jobId: Schema.String,
  status: Schema.Literal("queued"),
  contentType: Schema.String,
  estimatedSteps: Schema.Number,
  createdAt: Schema.String,
  voice: ExecutionVoiceMetadataViewSchema
});
export type QueuedExecutionView = typeof QueuedExecutionViewSchema.Type;

export const ExecutionStatusViewSchema = Schema.Struct({
  jobId: Schema.String,
  status: JobStatusSchema,
  contentType: Schema.String,
  progress: Schema.NullOr(JobProgressSchema),
  result: Schema.NullOr(JobResultSchema),
  error: Schema.NullOr(JobErrorSchema),
  createdAt: Schema.String,
  completedAt: Schema.NullOr(Schema.String),
  voice: Schema.optional(ExecutionVoiceMetadataViewSchema)
});
export type ExecutionStatusView = typeof ExecutionStatusViewSchema.Type;

export const ExecutionsPageViewSchema = Schema.Struct({
  items: Schema.Array(ExecutionStatusViewSchema),
  total: Schema.Number,
  limit: Schema.Number,
  offset: Schema.Number
});
export type ExecutionsPageView = typeof ExecutionsPageViewSchema.Type;

export const ExecutionTransitionStartedSchema = Schema.Struct({
  type: Schema.Literal("started"),
  executionId: Schema.String,
  snapshot: Schema.optional(ExecutionStatusViewSchema),
  progress: JobProgressSchema,
  occurredAt: Schema.String
});
export type ExecutionTransitionStarted = typeof ExecutionTransitionStartedSchema.Type;

export const ExecutionTransitionProgressedSchema = Schema.Struct({
  type: Schema.Literal("progressed"),
  executionId: Schema.String,
  snapshot: Schema.optional(ExecutionStatusViewSchema),
  progress: JobProgressSchema,
  occurredAt: Schema.String
});
export type ExecutionTransitionProgressed = typeof ExecutionTransitionProgressedSchema.Type;

export const ExecutionTransitionCompletedSchema = Schema.Struct({
  type: Schema.Literal("completed"),
  executionId: Schema.String,
  snapshot: Schema.optional(ExecutionStatusViewSchema),
  result: JobResultSchema,
  occurredAt: Schema.String
});
export type ExecutionTransitionCompleted = typeof ExecutionTransitionCompletedSchema.Type;

export const ExecutionTransitionFailedSchema = Schema.Struct({
  type: Schema.Literal("failed"),
  executionId: Schema.String,
  snapshot: Schema.optional(ExecutionStatusViewSchema),
  error: JobErrorSchema,
  occurredAt: Schema.String
});
export type ExecutionTransitionFailed = typeof ExecutionTransitionFailedSchema.Type;

export const ExecutionTransitionSchema = Schema.Union(
  ExecutionTransitionStartedSchema,
  ExecutionTransitionProgressedSchema,
  ExecutionTransitionCompletedSchema,
  ExecutionTransitionFailedSchema
);
export type ExecutionTransition = typeof ExecutionTransitionSchema.Type;

export const ObservationFailureReasonSchema = Schema.Literal(
  "reconnect_exhausted",
  "poll_fallback_exhausted",
  "timeout"
);
export type ObservationFailureReason = typeof ObservationFailureReasonSchema.Type;

export const ObservationFailureSchema = Schema.Struct({
  reason: ObservationFailureReasonSchema,
  message: Schema.String
});
export type ObservationFailure = typeof ObservationFailureSchema.Type;

export const decodeJobCreatedResponse = createSchemaDecoder("JobCreatedResponse", JobCreatedResponseSchema);
export const decodeRunResponse = createSchemaDecoder("RunResponse", RunResponseSchema);
export const decodeHealthCheckResponse = createSchemaDecoder("HealthCheckResponse", HealthCheckResponseSchema);
export const decodeReadinessResponse = createSchemaDecoder("ReadinessResponse", ReadinessResponseSchema);
export const decodeApiErrorResponse = createSchemaDecoder("ApiErrorResponse", ApiErrorResponseSchema);
export const decodeJobStatusResponse = createSchemaDecoder("JobStatusResponse", JobStatusResponseSchema);
export const decodePipelineRequest = createSchemaDecoder("PipelineRequest", PipelineRequestSchema);
export const decodeMeExecutionRequest = createSchemaDecoder("MeExecutionRequest", MeExecutionRequestSchema);
export const decodeSyncExecutionView = createSchemaDecoder("SyncExecutionView", SyncExecutionViewSchema);
export const decodeQueuedExecutionView = createSchemaDecoder("QueuedExecutionView", QueuedExecutionViewSchema);
export const decodeExecutionStatusView = createSchemaDecoder("ExecutionStatusView", ExecutionStatusViewSchema);
export const decodeExecutionsPageView = createSchemaDecoder("ExecutionsPageView", ExecutionsPageViewSchema);
export const decodeExecutionSseEvent = createSchemaDecoder("ExecutionSseEvent", ExecutionSseEventSchema);
export const decodeExecutionTransition = createSchemaDecoder("ExecutionTransition", ExecutionTransitionSchema);
