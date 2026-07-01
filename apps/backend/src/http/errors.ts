import { Data } from "effect";

export class BackendRequestBodyParseError extends Data.TaggedError("BackendRequestBodyParseError")<{
  readonly route: string;
  readonly message: string;
}> {}

export class BackendValidationError extends Data.TaggedError("BackendValidationError")<{
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}> {}

export class BackendReadinessError extends Data.TaggedError("BackendReadinessError")<{
  readonly reason: "config" | "auth" | "database";
  readonly message: string;
  readonly checks: Readonly<{
    config: { readonly status: "ready" | "blocked"; readonly detail?: string };
    auth: { readonly status: "ready" | "blocked"; readonly detail?: string };
    database: { readonly status: "ready" | "blocked"; readonly detail?: string };
  }>;
}> {}

export class BackendRequestRateLimitError extends Data.TaggedError("BackendRequestRateLimitError")<{
  readonly key: string;
  readonly limit: number;
  readonly windowMs: number;
  readonly message: string;
}> {}

export class BackendAuthenticationError extends Data.TaggedError("BackendAuthenticationError")<{
  readonly route: string;
  readonly message: string;
  readonly reason?:
    | "missing_token"
    | "invalid_authorization_header"
    | "invalid_token"
    | "invalid_issuer"
    | "invalid_audience"
    | "expired_token"
    | "invalid_signature"
    | "unsupported_algorithm"
    | "invalid_configuration";
  readonly details?: Readonly<Record<string, unknown>>;
}> {}

export class BackendAuthorizationError extends Data.TaggedError("BackendAuthorizationError")<{
  readonly userId?: string;
  readonly reason: "unauthenticated" | "missing_permission" | "missing_role" | "not_owner";
  readonly message: string;
  readonly requiredPermission?: string;
  readonly requiredRole?: string;
}> {}

export class BackendJobNotFoundError extends Data.TaggedError("BackendJobNotFoundError")<{
  readonly jobId: string;
}> {}

export class BackendVoiceProfileNotFoundError extends Data.TaggedError("BackendVoiceProfileNotFoundError")<{
  readonly userId: string;
}> {}

export class BackendVoiceExampleNotFoundError extends Data.TaggedError("BackendVoiceExampleNotFoundError")<{
  readonly exampleId: string;
  readonly userId: string;
}> {}

export class BackendVoiceCalibrationSessionNotFoundError extends Data.TaggedError(
  "BackendVoiceCalibrationSessionNotFoundError"
)<{
  readonly sessionId: string;
  readonly userId: string;
}> {}

export class BackendVoiceCalibrationValidationError extends Data.TaggedError(
  "BackendVoiceCalibrationValidationError"
)<{
  readonly sessionId?: string;
  readonly stepId?: string;
  readonly message: string;
}> {}

export class BackendExecutionNotFoundError extends Data.TaggedError("BackendExecutionNotFoundError")<{
  readonly executionId: string;
  readonly userId: string;
}> {}

export class BackendResponseValidationError extends Data.TaggedError("BackendResponseValidationError")<{
  readonly schema: string;
  readonly message: string;
}> {}

export class BackendExecutionConflictError extends Data.TaggedError("BackendExecutionConflictError")<{
  readonly idempotencyKey: string;
  readonly message: string;
}> {}

export class BackendExecutionFailedError extends Data.TaggedError("BackendExecutionFailedError")<{
  readonly message: string;
  readonly reason?: string;
}> {}

export class BackendExecutionIntegrityError extends Data.TaggedError("BackendExecutionIntegrityError")<{
  readonly policyVersion: string;
  readonly message: string;
  readonly reason:
    | "missing_policy_version"
    | "empty_pipeline"
    | "pipeline_name_mismatch"
    | "content_type_mismatch"
    | "quality_mode_mismatch"
    | "pricing_policy_mismatch"
    | "invalid_credit_price"
    | "step_count_mismatch"
    | "step_mismatch";
  readonly pipelineName?: string;
  readonly stepName?: string;
}> {}

export class BackendUsageAuthorizationError extends Data.TaggedError("BackendUsageAuthorizationError")<{
  readonly userId: string;
  readonly planId: string;
  readonly reason:
    | "feature_disabled"
    | "plan_inactive"
    | "model_not_allowed"
    | "traffic_limit"
    | "plan_restriction"
    | "subscription_inactive"
    | "quality_mode_plan_restriction"
    | "insufficient_credits";
  readonly message: string;
}> {}

export class BackendExperimentalAccessError extends Data.TaggedError("BackendExperimentalAccessError")<{
  readonly reason: "environment_blocked" | "missing_role" | "feature_disabled" | "catalog_unavailable";
  readonly message: string;
}> {}

export class BackendAIPolicyLoadError extends Data.TaggedError("BackendAIPolicyLoadError")<{
  readonly path: string;
  readonly message: string;
}> {}

export class BackendAIPolicyValidationError extends Data.TaggedError("BackendAIPolicyValidationError")<{
  readonly path: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}> {}

export class BackendAIPolicyCatalogError extends Data.TaggedError("BackendAIPolicyCatalogError")<{
  readonly policyVersion: string;
  readonly message: string;
  readonly stepName?: string;
  readonly pipelineName?: string;
}> {}

export class BackendAIPolicyPricingError extends Data.TaggedError("BackendAIPolicyPricingError")<{
  readonly policyVersion: string;
  readonly message: string;
  readonly planTier?: string;
  readonly contentType?: string;
  readonly qualityMode?: string;
}> {}

export class BackendSafetyPolicyLoadError extends Data.TaggedError("BackendSafetyPolicyLoadError")<{
  readonly path: string;
  readonly message: string;
}> {}

export class BackendSafetyPolicyValidationError extends Data.TaggedError("BackendSafetyPolicyValidationError")<{
  readonly path: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}> {}

export class BackendSafetyPolicyDefinitionError extends Data.TaggedError("BackendSafetyPolicyDefinitionError")<{
  readonly policyVersion: string;
  readonly message: string;
  readonly family?: string;
  readonly classification?: string;
  readonly boundary?: string;
}> {}

export class BackendInputSafetyGatewayFailureError extends Data.TaggedError("BackendInputSafetyGatewayFailureError")<{
  readonly boundary: "preview" | "generation";
  readonly reason:
    | "classification_failed"
    | "sanitization_failed"
    | "decision_failed"
    | "override_detector_failed";
  readonly message: string;
}> {}

export class BackendInputSafetyPolicyError extends Data.TaggedError("BackendInputSafetyPolicyError")<{
  readonly boundary: "preview" | "generation";
  readonly outcome: "block" | "quarantine";
  readonly message: string;
  readonly categories: readonly string[];
  readonly fields: readonly string[];
}> {}

export class BackendInstructionOverrideDetectorFailureError extends Data.TaggedError("BackendInstructionOverrideDetectorFailureError")<{
  readonly boundary: "preview" | "generation";
  readonly detectorId: string;
  readonly message: string;
  readonly critical: boolean;
}> {}

export class BackendStepScopeViolationError extends Data.TaggedError("BackendStepScopeViolationError")<{
  readonly stepName: string;
  readonly boundary: "read" | "write" | "handoff";
  readonly reason:
    | "missing_contract"
    | "unauthorized_input_read"
    | "unauthorized_state_read"
    | "unauthorized_metadata_write"
    | "invalid_handoff_artifact";
  readonly message: string;
  readonly field?: string;
}> {}

export class BackendUserSuspendedError extends Data.TaggedError("BackendUserSuspendedError")<{
  readonly userId: string;
  readonly externalSubject: string;
  readonly message: string;
}> {}

export class BackendVoiceTrainingConsentRequiredError extends Data.TaggedError("BackendVoiceTrainingConsentRequiredError")<{
  readonly userId: string;
  readonly message: string;
}> {}

export class BackendVoiceTrainingConsentFailureError extends Data.TaggedError("BackendVoiceTrainingConsentFailureError")<{
  readonly userId: string;
  readonly reason: "consent_unavailable" | "protection_failed";
  readonly message: string;
}> {}

export class BackendGenerationQuoteMismatchError extends Data.TaggedError("BackendGenerationQuoteMismatchError")<{
  readonly providedQuoteId: string;
  readonly expectedQuoteId: string;
  readonly policyVersion: string;
  readonly contentType: string;
  readonly qualityMode: string;
  readonly creditPrice: number;
  readonly message: string;
}> {}

export class BackendOutputReleaseGateFailureError extends Data.TaggedError("BackendOutputReleaseGateFailureError")<{
  readonly boundary: "output";
  readonly reason: "evaluation_failed" | "policy_unavailable";
  readonly message: string;
}> {}

export class BackendOutputReleasePolicyError extends Data.TaggedError("BackendOutputReleasePolicyError")<{
  readonly boundary: "output";
  readonly outcome: "block" | "require_override";
  readonly message: string;
  readonly categories: readonly string[];
  readonly fields: readonly string[];
}> {}

export class BackendOperationalOverrideStateError extends Data.TaggedError("BackendOperationalOverrideStateError")<{
  readonly overrideId: string;
  readonly reason: "override_not_found" | "override_expired" | "override_already_consumed";
  readonly message: string;
}> {}

export class BackendBillingNotConfiguredError extends Data.TaggedError("BackendBillingNotConfiguredError")<{
  readonly route: string;
  readonly message?: string;
}> {}
