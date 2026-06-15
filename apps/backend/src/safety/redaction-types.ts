import type { SafetyClassificationCategory } from "../product/safety-policy/safety-policy-types.js";

/**
 * Semantic reason for redaction, used in diagnostics and traces.
 */
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

/**
 * Policy-driven rule that decides whether a field should be redacted.
 */
export interface RedactionRule {
  readonly matchesField: (fieldName: string) => boolean;
  readonly reason: RedactionReason;
}

/**
 * Result of applying redaction to a single field.
 */
export interface RedactedField {
  readonly originalPresent: true;
  readonly reason: RedactionReason;
  readonly classification?: SafetyClassificationCategory;
}

/**
 * Redacted value with metadata for diagnostics.
 */
export interface RedactedValue {
  readonly _tag: "RedactedValue";
  readonly redactionMarker: "[REDACTED]";
  readonly field?: RedactedField;
}

/**
 * Typed wrapper for diagnostic values whose visibility is governed by
 * safety classification instead of field-name heuristics.
 */
export interface ClassifiedRedactionValue {
  readonly _tag: "ClassifiedRedactionValue";
  readonly classification: SafetyClassificationCategory;
  readonly value: unknown;
}

/**
 * Configuration for the redaction policy.
 */
export interface RedactionPolicyConfig {
  /**
   * Field name patterns that trigger redaction regardless of classification.
   */
  readonly secretLikeFieldPatterns: readonly string[];
  /**
   * Safety classifications whose fields must be redacted in diagnostics.
   */
  readonly redactedClassifications: readonly SafetyClassificationCategory[];
  /**
   * Max depth for nested object traversal during redaction.
   */
  readonly maxDepth: number;
  /**
   * Whether to preserve type hints (e.g., "[REDACTED: string]" instead of "[REDACTED]").
   */
  readonly preserveTypeHints: boolean;
}

/**
 * Typed report of what was redacted in an object, used for operational diagnosis.
 */
export interface RedactionReport {
  readonly redactedPaths: readonly string[];
  readonly reasons: Readonly<Record<string, RedactionReason>>;
  readonly totalFieldsInspected: number;
}

/**
 * Service contract for policy-driven runtime redaction.
 */
export interface BackendRedactionService {
  /**
   * Apply redaction rules to a plain object, returning a deep copy with
   * sensitive values replaced and a report of what was redacted.
   */
  readonly redactObject: (
    obj: Record<string, unknown>
  ) => { readonly redacted: Record<string, unknown>; readonly report: RedactionReport };

  /**
   * Check whether a field name matches secret-like patterns.
   */
  readonly isSecretLikeField: (fieldName: string) => boolean;

  /**
   * Check whether a classification requires redaction in diagnostics.
   */
  readonly isRedactedClassification: (category: SafetyClassificationCategory) => boolean;

  /**
   * Create a redaction-aware logger that wraps an existing AppLogger.
   */
  readonly createRedactedLogger: (logger: import("@my-ai-orchestrator/core").AppLogger) => import("@my-ai-orchestrator/core").AppLogger;

  /**
   * Create a redaction-aware snapshot of observability events.
   */
  readonly redactObservabilitySnapshot: (
    snapshot: import("../product/core/observability-types.js").BackendObservabilitySnapshot
  ) => import("../product/core/observability-types.js").BackendObservabilitySnapshot;
}

/**
 * Error when redaction configuration is invalid.
 */
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
