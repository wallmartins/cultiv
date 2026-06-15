import {
  BackendInputSafetyGatewayFailureError,
  BackendInputSafetyPolicyError,
  BackendOperationalOverrideStateError,
  BackendSafetyPolicyDefinitionError,
  BackendSafetyPolicyLoadError,
  BackendSafetyPolicyValidationError,
  BackendVoiceTrainingConsentFailureError,
  BackendVoiceTrainingConsentRequiredError
} from "../http/errors.js";
import { createHttpErrorResponse } from "../http/error-response-core.js";
import type { HttpErrorResponse } from "../http/error-response-core.js";

export function mapSafetyError(error: unknown, path: string): HttpErrorResponse | undefined {
  if (error instanceof BackendVoiceTrainingConsentRequiredError) {
    return createHttpErrorResponse(403, "voice_training_consent_required", {
      message: error.message,
      details: { userId: error.userId, path }
    });
  }

  if (error instanceof BackendVoiceTrainingConsentFailureError) {
    return createHttpErrorResponse(503, "service_unavailable", {
      message: error.message,
      details: { userId: error.userId, reason: error.reason, path }
    });
  }

  if (error instanceof BackendInputSafetyPolicyError) {
    return createHttpErrorResponse(
      400,
      error.outcome === "quarantine" ? "safety_input_quarantined" : "safety_input_blocked",
      {
        message: error.message,
        details: { boundary: error.boundary, outcome: error.outcome, categories: error.categories, fields: error.fields, path }
      }
    );
  }

  if (error instanceof BackendInputSafetyGatewayFailureError) {
    return createHttpErrorResponse(503, "service_unavailable", {
      message: error.message,
      details: { boundary: error.boundary, reason: error.reason, path }
    });
  }

  if (error instanceof BackendOperationalOverrideStateError) {
    if (error.reason === "override_not_found") {
      return createHttpErrorResponse(404, "resource_not_found", {
        message: error.message,
        details: { overrideId: error.overrideId, reason: error.reason, path }
      });
    }

    return createHttpErrorResponse(409, "execution_conflict", {
      message: error.message,
      details: { overrideId: error.overrideId, reason: error.reason, path }
    });
  }

  if (
    error instanceof BackendSafetyPolicyDefinitionError ||
    error instanceof BackendSafetyPolicyLoadError ||
    error instanceof BackendSafetyPolicyValidationError
  ) {
    return createHttpErrorResponse(503, "service_unavailable", {
      message: "Input safety policy is temporarily unavailable. Try again later.",
      details: { path }
    });
  }

  return undefined;
}
