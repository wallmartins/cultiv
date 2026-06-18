import { Schema } from "effect";
import { createSchemaDecoder } from "../shared.js";
import {
  FallbackReasonCodeSchema,
  NextActionCodeSchema,
  ReasonCodeSchema,
  VoiceAdaptationModeSchema,
  VoiceProfileConfidenceSchema,
  VoiceSignalSummarySchema
} from "../voice.js";
import {
  AsyncRunResponseSchema,
  ExecutionControlsSchema,
  ExecutionModeSchema,
  ExecutionTelemetrySchema,
  JobErrorSchema,
  JobProgressSchema,
  JobResultSchema,
  JobStatusSchema,
  QualityModeSchema
} from "./job.js";

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

export const decodeRunResponse = createSchemaDecoder("RunResponse", RunResponseSchema);
export const decodeJobStatusResponse = createSchemaDecoder("JobStatusResponse", JobStatusResponseSchema);
export const decodeSyncExecutionView = createSchemaDecoder("SyncExecutionView", SyncExecutionViewSchema);
export const decodeQueuedExecutionView = createSchemaDecoder("QueuedExecutionView", QueuedExecutionViewSchema);
export const decodeExecutionStatusView = createSchemaDecoder("ExecutionStatusView", ExecutionStatusViewSchema);
export const decodeExecutionsPageView = createSchemaDecoder("ExecutionsPageView", ExecutionsPageViewSchema);
export const decodeExecutionTransition = createSchemaDecoder("ExecutionTransition", ExecutionTransitionSchema);
