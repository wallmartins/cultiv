import { Schema } from "effect";
import { createSchemaDecoder } from "../shared.js";

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

export const decodeApiErrorResponse = createSchemaDecoder("ApiErrorResponse", ApiErrorResponseSchema);
