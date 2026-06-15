import { Context, Effect, Layer } from "effect";
import type {
  BackendSafetyPolicyDefinitionError,
  BackendSafetyPolicyLoadError,
  BackendSafetyPolicyValidationError
} from "../../http/errors.js";

export type SafetyPolicyLifecycle = "active" | "legacy-supported";

export type SafetyPolicyFamily =
  | "input"
  | "imported_context"
  | "step_scope"
  | "consent"
  | "output_release"
  | "policy_evidence"
  | "operational_override";

export type SafetyDecisionOutcome =
  | "approve"
  | "sanitize"
  | "quarantine"
  | "block"
  | "require_override"
  | "revoke";

export type SafetyOverrideability = "never" | "one_shot" | "time_limited";

export type SafetyEvidenceBoundary =
  | "input"
  | "scope"
  | "output"
  | "consent"
  | "override";

export type SafetyClassificationCategory =
  | "ordinary_generation_input"
  | "imported_context_out_of_scope"
  | "voice_training_input"
  | "personal_data"
  | "customer_confidential_data"
  | "operational_data"
  | "security_sensitive_data"
  | "llm_prohibited_data";

export interface SafetyDetectorAdapterDefinition {
  readonly id: string;
  readonly kind: "classifier" | "scanner" | "heuristic";
  readonly optional: boolean;
  readonly boundaries: readonly SafetyEvidenceBoundary[];
}

export interface SafetyClassificationDefinition {
  readonly category: SafetyClassificationCategory;
  readonly defaultOutcome: SafetyDecisionOutcome;
  readonly minimizationRequired: boolean;
  readonly description: string;
}

export interface SafetyPolicyFamilyDefinition {
  readonly family: SafetyPolicyFamily;
  readonly defaultOutcome: SafetyDecisionOutcome;
  readonly allowedOutcomes: readonly SafetyDecisionOutcome[];
  readonly overrideability: SafetyOverrideability;
  readonly evidenceBoundary: SafetyEvidenceBoundary;
  readonly detectorAdapters: readonly string[];
  readonly nonOverridableCategories?: readonly SafetyClassificationCategory[];
  readonly maxOverrideWindowMinutes?: number;
}

export interface ResolvedSafetyPolicyVersion {
  readonly version: string;
  readonly lifecycle: SafetyPolicyLifecycle;
  readonly families: Readonly<Record<SafetyPolicyFamily, SafetyPolicyFamilyDefinition>>;
  readonly classifications: Readonly<Record<SafetyClassificationCategory, SafetyClassificationDefinition>>;
  readonly evidenceBoundaries: readonly SafetyEvidenceBoundary[];
  readonly unknownInputOutcome: "block";
  readonly detectorAdapters: Readonly<Record<string, SafetyDetectorAdapterDefinition>>;
}

export interface BackendSafetyPolicyVersionSummary {
  readonly version: string;
  readonly lifecycle: SafetyPolicyLifecycle;
}

export interface BackendSafetyPolicyServiceContract {
  readonly getActivePolicy: () => Effect.Effect<ResolvedSafetyPolicyVersion, never>;
  readonly listPolicyVersions: () => readonly BackendSafetyPolicyVersionSummary[];
  readonly getPolicyFamily: (
    family: SafetyPolicyFamily
  ) => Effect.Effect<SafetyPolicyFamilyDefinition, BackendSafetyPolicyDefinitionError>;
  readonly getClassification: (
    category: SafetyClassificationCategory
  ) => Effect.Effect<SafetyClassificationDefinition, BackendSafetyPolicyDefinitionError>;
}

export type BackendSafetyPolicyBootstrapError =
  | BackendSafetyPolicyLoadError
  | BackendSafetyPolicyValidationError
  | BackendSafetyPolicyDefinitionError;

export class BackendSafetyPolicyServiceTag extends Context.Tag("BackendSafetyPolicyService")<
  BackendSafetyPolicyServiceTag,
  BackendSafetyPolicyServiceContract
>() {}

export const createBackendSafetyPolicyLayer = (service: BackendSafetyPolicyServiceContract) =>
  Layer.succeed(BackendSafetyPolicyServiceTag, service);
