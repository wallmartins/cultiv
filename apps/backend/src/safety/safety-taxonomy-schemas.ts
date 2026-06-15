import { Schema } from "effect";

export const SafetyPolicyLifecycleSchema = Schema.Literal("active", "legacy-supported");

export const SafetyPolicyFamilySchema = Schema.Literal(
  "input",
  "imported_context",
  "step_scope",
  "consent",
  "output_release",
  "policy_evidence",
  "operational_override"
);

export const OperationalOverrideTargetFamilySchema = Schema.Literal(
  "input",
  "imported_context",
  "step_scope",
  "consent",
  "output_release"
);

export const SafetyDecisionOutcomeSchema = Schema.Literal(
  "approve",
  "sanitize",
  "quarantine",
  "block",
  "require_override",
  "revoke"
);

export const SafetyOverrideabilitySchema = Schema.Literal("never", "one_shot", "time_limited");

export const SafetyEvidenceBoundarySchema = Schema.Literal("input", "scope", "output", "consent", "override");

export const OperationalOverrideTargetBoundarySchema = Schema.Literal("input", "scope", "output", "consent");

export const SafetyClassificationCategorySchema = Schema.Literal(
  "ordinary_generation_input",
  "imported_context_out_of_scope",
  "voice_training_input",
  "personal_data",
  "customer_confidential_data",
  "operational_data",
  "security_sensitive_data",
  "llm_prohibited_data"
);

export const OperationalOverrideLifecycleModeSchema = Schema.Literal("one_shot", "time_limited");
