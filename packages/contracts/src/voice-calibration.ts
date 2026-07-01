import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";
import { VoiceProfileConfidenceSchema } from "./voice.js";

export const WizardContextSchema = Schema.Struct({
  domain: Schema.optional(Schema.String),
  audience: Schema.optional(Schema.String),
  selfDeclaredStrength: Schema.optional(Schema.String)
});
export type WizardContext = typeof WizardContextSchema.Type;

export const VoiceCalibrationSessionStatusSchema = Schema.Literal(
  "in_progress",
  "completed",
  "abandoned"
);
export type VoiceCalibrationSessionStatus = typeof VoiceCalibrationSessionStatusSchema.Type;

export const VoiceCalibrationStepStateSchema = Schema.Struct({
  stepId: Schema.String,
  theme: Schema.optional(Schema.String),
  prompt: Schema.String,
  text: Schema.optional(Schema.String),
  wordCount: Schema.optional(Schema.Number),
  skipped: Schema.optional(Schema.Boolean),
  submittedAt: Schema.optional(Schema.String)
});
export type VoiceCalibrationStepState = typeof VoiceCalibrationStepStateSchema.Type;

export const VoiceCalibrationSessionViewSchema = Schema.Struct({
  sessionId: Schema.String,
  userId: Schema.String,
  status: VoiceCalibrationSessionStatusSchema,
  context: Schema.optional(WizardContextSchema),
  currentStepId: Schema.String,
  steps: Schema.Array(VoiceCalibrationStepStateSchema),
  completedStepCount: Schema.Number,
  createdAt: Schema.String,
  updatedAt: Schema.String
});
export type VoiceCalibrationSessionView = typeof VoiceCalibrationSessionViewSchema.Type;

export const SubmitWizardStepInputSchema = Schema.Struct({
  stepId: Schema.String,
  text: Schema.String,
  skipped: Schema.optional(Schema.Boolean)
});
export type SubmitWizardStepInput = typeof SubmitWizardStepInputSchema.Type;

export const SetWizardContextInputSchema = WizardContextSchema;
export type SetWizardContextInput = typeof SetWizardContextInputSchema.Type;

export const ConfirmWizardReviewInputSchema = Schema.Struct({
  confirmedSections: Schema.optional(Schema.Array(Schema.String))
});
export type ConfirmWizardReviewInput = typeof ConfirmWizardReviewInputSchema.Type;

export const VoiceCalibrationStepPromptViewSchema = Schema.Struct({
  stepId: Schema.String,
  prompt: Schema.String,
  theme: Schema.String,
  targetWords: Schema.optional(Schema.Number),
  maxWords: Schema.optional(Schema.Number),
  minWords: Schema.optional(Schema.Number)
});
export type VoiceCalibrationStepPromptView = typeof VoiceCalibrationStepPromptViewSchema.Type;

export const VoiceCalibrationEntitlementViewSchema = Schema.Struct({
  planTier: Schema.Literal("free", "criador", "pro"),
  maxWizards: Schema.Number,
  completedWizards: Schema.Number,
  remainingWizards: Schema.Number,
  chargesQuota: Schema.Boolean,
  maxConfidenceFromCalibration: VoiceProfileConfidenceSchema
});
export type VoiceCalibrationEntitlementView = typeof VoiceCalibrationEntitlementViewSchema.Type;

export const decodeWizardContext = createSchemaDecoder("WizardContext", WizardContextSchema);
export const decodeSetWizardContextInput = createSchemaDecoder(
  "SetWizardContextInput",
  SetWizardContextInputSchema
);
export const decodeSubmitWizardStepInput = createSchemaDecoder(
  "SubmitWizardStepInput",
  SubmitWizardStepInputSchema
);
export const decodeConfirmWizardReviewInput = createSchemaDecoder(
  "ConfirmWizardReviewInput",
  ConfirmWizardReviewInputSchema
);
export const decodeVoiceCalibrationSessionView = createSchemaDecoder(
  "VoiceCalibrationSessionView",
  VoiceCalibrationSessionViewSchema
);
export const decodeVoiceCalibrationStepPromptView = createSchemaDecoder(
  "VoiceCalibrationStepPromptView",
  VoiceCalibrationStepPromptViewSchema
);
export const decodeVoiceCalibrationEntitlementView = createSchemaDecoder(
  "VoiceCalibrationEntitlementView",
  VoiceCalibrationEntitlementViewSchema
);
