import type { SafetyClassificationCategory } from "../product/safety-policy/safety-policy-types.js";

export type RedactionReason =
  | "classification_secret"
  | "classification_personal_data"
  | "classification_customer_confidential"
  | "classification_security_sensitive"
  | "classification_prohibited"
  | "classification_voice_training"
  | "classification_operational"
  | "pattern_secret_like"
  | "field_name_protected"
  | "nested_classified_payload";

export interface RedactionRule {
  readonly matchesField: (fieldName: string) => boolean;
  readonly reason: RedactionReason;
}

export interface RedactedField {
  readonly originalPresent: true;
  readonly reason: RedactionReason;
  readonly classification?: SafetyClassificationCategory;
}

export interface RedactedValue {
  readonly _tag: "RedactedValue";
  readonly redactionMarker: "[REDACTED]";
  readonly field?: RedactedField;
}

export interface ClassifiedRedactionValue {
  readonly _tag: "ClassifiedRedactionValue";
  readonly classification: SafetyClassificationCategory;
  readonly value: unknown;
}

export interface RedactionPolicyConfig {
  readonly secretLikeFieldPatterns: readonly string[];
  readonly redactedClassifications: readonly SafetyClassificationCategory[];
  readonly maxDepth: number;
  readonly preserveTypeHints: boolean;
}

export interface RedactionReport {
  readonly redactedPaths: readonly string[];
  readonly reasons: Readonly<Record<string, RedactionReason>>;
  readonly totalFieldsInspected: number;
}

export interface BackendRedactionService {
  readonly redactObject: (
    obj: Record<string, unknown>
  ) => { readonly redacted: Record<string, unknown>; readonly report: RedactionReport };

  readonly isSecretLikeField: (fieldName: string) => boolean;

  readonly isRedactedClassification: (category: SafetyClassificationCategory) => boolean;

  readonly createRedactedLogger: (logger: import("@my-ai-orchestrator/core").AppLogger) => import("@my-ai-orchestrator/core").AppLogger;

  readonly redactObservabilitySnapshot: (
    snapshot: import("../product/core/observability-types.js").BackendObservabilitySnapshot
  ) => import("../product/core/observability-types.js").BackendObservabilitySnapshot;
}

export interface RedactionPolicyError {
  readonly _tag: "RedactionPolicyError";
  readonly message: string;
}

export function createClassifiedRedactionValue(
  classification: SafetyClassificationCategory,
  value: unknown
): ClassifiedRedactionValue {
  return {
    _tag: "ClassifiedRedactionValue",
    classification,
    value
  };
}
