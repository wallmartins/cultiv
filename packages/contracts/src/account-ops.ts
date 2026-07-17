import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";

// contract-08 §1 — async export: a UI faz poll de pending -> ready, entrega via URL curta/one-time/auth'd.
export const AccountExportJobStatusSchema = Schema.Literal("pending", "ready", "failed");
export type AccountExportJobStatus = typeof AccountExportJobStatusSchema.Type;

export const AccountExportJobViewSchema = Schema.Struct({
  jobId: Schema.String,
  status: AccountExportJobStatusSchema,
  downloadUrl: Schema.NullOr(Schema.String),
  expiresAt: Schema.NullOr(Schema.String)
});
export type AccountExportJobView = typeof AccountExportJobViewSchema.Type;

// contract-08 §2 — reset mantém a carteira; a UI lê hasVoiceProfile=false para redirecionar a onboarding.
export const AccountResetResponseSchema = Schema.Struct({
  onboardingRequired: Schema.Boolean,
  hasVoiceProfile: Schema.Boolean
});
export type AccountResetResponse = typeof AccountResetResponseSchema.Type;

// contract-08 §3 — confirmation é re-validada no servidor (Q6); idempotencyKey é opcional (retry seguro).
export const AccountDeleteRequestSchema = Schema.Struct({
  confirmation: Schema.String,
  idempotencyKey: Schema.optional(Schema.String)
});
export type AccountDeleteRequest = typeof AccountDeleteRequestSchema.Type;

export const AccountDeleteResponseSchema = Schema.Struct({
  status: Schema.Literal("deleted")
});
export type AccountDeleteResponse = typeof AccountDeleteResponseSchema.Type;

export const decodeAccountExportJobView = createSchemaDecoder(
  "AccountExportJobView",
  AccountExportJobViewSchema
);
export const decodeAccountResetResponse = createSchemaDecoder(
  "AccountResetResponse",
  AccountResetResponseSchema
);
export const decodeAccountDeleteRequest = createSchemaDecoder(
  "AccountDeleteRequest",
  AccountDeleteRequestSchema
);
export const decodeAccountDeleteResponse = createSchemaDecoder(
  "AccountDeleteResponse",
  AccountDeleteResponseSchema
);
