import { Schema } from "effect";
import { createSchemaDecoder } from "../shared.js";
import { JobErrorSchema, JobProgressSchema, JobResultSchema } from "./job.js";

export const ExecutionCancelledPayloadSchema = Schema.Struct({
  reason: Schema.optional(Schema.String),
  cancelledAt: Schema.String
});
export type ExecutionCancelledPayload = typeof ExecutionCancelledPayloadSchema.Type;

export const SSEEventSchema = Schema.Struct({
  type: Schema.Literal("progress", "done", "error", "cancelled"),
  jobId: Schema.String,
  payload: Schema.Union(JobProgressSchema, JobResultSchema, JobErrorSchema, ExecutionCancelledPayloadSchema)
});
export type SSEEvent = typeof SSEEventSchema.Type;

export const ExecutionSseEventSchema = Schema.Struct({
  type: Schema.Literal("progress", "done", "error", "cancelled"),
  payload: Schema.Union(JobProgressSchema, JobResultSchema, JobErrorSchema, ExecutionCancelledPayloadSchema),
  occurredAt: Schema.String
});
export type ExecutionSseEvent = typeof ExecutionSseEventSchema.Type;

export const decodeExecutionSseEvent = createSchemaDecoder("ExecutionSseEvent", ExecutionSseEventSchema);

export const CancelExecutionRequestSchema = Schema.Struct({
  reason: Schema.optional(Schema.String)
});
export type CancelExecutionRequest = typeof CancelExecutionRequestSchema.Type;

export const decodeCancelExecutionRequest = createSchemaDecoder(
  "CancelExecutionRequest",
  CancelExecutionRequestSchema
);
