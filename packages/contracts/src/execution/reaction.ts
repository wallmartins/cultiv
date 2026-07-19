import { Schema } from "effect";
import { createSchemaDecoder } from "../shared.js";

// 👍/👎 — reação mutável (upsert sobrescreve), sem histórico/streak em v1.
export const ExecutionReactionValueSchema = Schema.Literal("up", "down");
export type ExecutionReactionValue = typeof ExecutionReactionValueSchema.Type;

export const ExecutionReactionViewSchema = Schema.Struct({
  value: ExecutionReactionValueSchema,
  reason: Schema.optional(Schema.String),
  reactedAt: Schema.String
});
export type ExecutionReactionView = typeof ExecutionReactionViewSchema.Type;

export const SubmitReactionRequestSchema = Schema.Struct({
  reaction: ExecutionReactionValueSchema,
  reason: Schema.optional(Schema.String)
});
export type SubmitReactionRequest = typeof SubmitReactionRequestSchema.Type;

export const decodeExecutionReactionView = createSchemaDecoder("ExecutionReactionView", ExecutionReactionViewSchema);
export const decodeSubmitReactionRequest = createSchemaDecoder("SubmitReactionRequest", SubmitReactionRequestSchema);
