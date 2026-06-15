import {
  BackendExecutionConflictError,
  BackendExecutionFailedError,
  BackendExecutionIntegrityError,
  BackendExecutionNotFoundError,
  BackendExperimentalAccessError,
  BackendGenerationQuoteMismatchError,
  BackendResponseValidationError,
  BackendUsageAuthorizationError
} from "../http/errors.js";
import { createHttpErrorResponse } from "../http/error-response-core.js";
import type { HttpErrorResponse } from "../http/error-response-core.js";

export function mapExecutionError(error: unknown, path: string): HttpErrorResponse | undefined {
  if (error instanceof BackendExecutionNotFoundError) {
    return createHttpErrorResponse(404, "resource_not_found", {
      message: `Execution ${error.executionId} was not found for user ${error.userId}`,
      details: { executionId: error.executionId, userId: error.userId, path }
    });
  }

  if (error instanceof BackendExecutionConflictError) {
    return createHttpErrorResponse(409, "execution_conflict", {
      message: error.message,
      details: { idempotencyKey: error.idempotencyKey, path }
    });
  }

  if (error instanceof BackendExecutionIntegrityError) {
    return createHttpErrorResponse(409, "execution_conflict", {
      message: error.message,
      details: { policyVersion: error.policyVersion, reason: error.reason, pipelineName: error.pipelineName, stepName: error.stepName, path }
    });
  }

  if (error instanceof BackendExecutionFailedError) {
    return createHttpErrorResponse(500, "internal_error", {
      message: error.message,
      details: error.reason ? { reason: error.reason, path } : { path }
    });
  }

  if (error instanceof BackendResponseValidationError) {
    return createHttpErrorResponse(500, "internal_error", {
      message: error.message,
      details: { schema: error.schema, path }
    });
  }

  if (error instanceof BackendUsageAuthorizationError) {
    const status = error.reason === "traffic_limit" ? 429 : 403;
    const code = error.reason === "traffic_limit" ? "rate_limited" : "usage_restricted";
    return createHttpErrorResponse(status, code, {
      message: error.message,
      details: { userId: error.userId, planId: error.planId, reason: error.reason, path }
    });
  }

  if (error instanceof BackendExperimentalAccessError) {
    return createHttpErrorResponse(
      error.reason === "catalog_unavailable" ? 409 : 403,
      error.reason === "catalog_unavailable" ? "execution_conflict" : "usage_restricted",
      {
        message: error.message,
        details: { reason: error.reason, path }
      }
    );
  }

  if (error instanceof BackendGenerationQuoteMismatchError) {
    return createHttpErrorResponse(409, "quote_stale", {
      message: error.message,
      details: {
        providedQuoteId: error.providedQuoteId,
        expectedQuoteId: error.expectedQuoteId,
        policyVersion: error.policyVersion,
        contentType: error.contentType,
        qualityMode: error.qualityMode,
        creditPrice: error.creditPrice,
        recovery: "refresh_preview",
        path
      }
    });
  }

  return undefined;
}
