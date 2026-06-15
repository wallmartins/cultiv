import {
  BackendAIPolicyCatalogError,
  BackendAIPolicyLoadError,
  BackendAIPolicyPricingError,
  BackendAIPolicyValidationError
} from "../http/errors.js";
import { createHttpErrorResponse } from "../http/error-response-core.js";
import type { HttpErrorResponse } from "../http/error-response-core.js";

export function mapPolicyError(error: unknown, path: string): HttpErrorResponse | undefined {
  if (error instanceof BackendAIPolicyLoadError) {
    return createHttpErrorResponse(500, "internal_error", {
      message: error.message,
      details: { path: error.path }
    });
  }

  if (error instanceof BackendAIPolicyValidationError) {
    return createHttpErrorResponse(400, "invalid_request", {
      message: error.message,
      details: { path: error.path, ...error.details }
    });
  }

  if (error instanceof BackendAIPolicyCatalogError) {
    return createHttpErrorResponse(400, "invalid_request", {
      message: error.message,
      details: { policyVersion: error.policyVersion, stepName: error.stepName, pipelineName: error.pipelineName, path }
    });
  }

  if (error instanceof BackendAIPolicyPricingError) {
    return createHttpErrorResponse(409, "quote_stale", {
      message: error.message,
      details: { policyVersion: error.policyVersion, planTier: error.planTier, contentType: error.contentType, qualityMode: error.qualityMode, path }
    });
  }

  return undefined;
}
