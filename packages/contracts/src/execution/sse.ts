import { Schema } from "effect";
import { createSchemaDecoder } from "../shared.js";
import { JobErrorSchema, JobProgressSchema, JobResultSchema } from "./job.js";

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

export const decodeExecutionSseEvent = createSchemaDecoder("ExecutionSseEvent", ExecutionSseEventSchema);
