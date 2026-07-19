import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";

export const OnboardingStatusViewSchema = Schema.Struct({
  completed: Schema.Boolean,
  completedAt: Schema.optional(Schema.String)
});
export type OnboardingStatusView = typeof OnboardingStatusViewSchema.Type;

export const decodeOnboardingStatusView = createSchemaDecoder(
  "OnboardingStatusView",
  OnboardingStatusViewSchema
);
