import { ContractDecodeError } from "@my-ai-orchestrator/contracts";
import {
  BackendAuthenticationError,
  BackendAuthorizationError,
  BackendReadinessError,
  BackendRequestBodyParseError,
  BackendRequestRateLimitError,
  BackendUserSuspendedError
} from "../http/errors.js";
import { createHttpErrorResponse, normalizeAuthenticationCode, normalizeAuthorizationCode } from "../http/error-response-core.js";
import type { HttpErrorResponse } from "../http/error-response-core.js";

export function mapAuthError(error: unknown, path: string): HttpErrorResponse | undefined {
  if (error instanceof BackendRequestBodyParseError) {
    return createHttpErrorResponse(400, "invalid_request", {
      message: error.message,
      details: { route: error.route, path }
    });
  }

  if (error instanceof BackendReadinessError) {
    return createHttpErrorResponse(503, "service_unavailable", {
      message: error.message,
      details: { reason: error.reason, checks: error.checks, path }
    });
  }

  if (error instanceof BackendRequestRateLimitError) {
    return createHttpErrorResponse(429, "rate_limited", {
      message: error.message,
      details: { key: error.key, limit: error.limit, windowMs: error.windowMs, path }
    });
  }

  if (error instanceof BackendAuthenticationError) {
    return createHttpErrorResponse(401, normalizeAuthenticationCode(error.reason), {
      message: error.message,
      details: { route: error.route, reason: error.reason, ...(error.details ?? {}), path }
    });
  }

  if (error instanceof BackendAuthorizationError) {
    const status = error.reason === "unauthenticated" ? 401 : 403;
    const code = error.reason === "unauthenticated"
      ? "authentication_missing_token"
      : normalizeAuthorizationCode(error.reason);
    return createHttpErrorResponse(status, code, {
      message: error.message,
      details: {
        userId: error.userId,
        reason: error.reason,
        requiredPermission: error.requiredPermission,
        requiredRole: error.requiredRole,
        path
      }
    });
  }

  if (error instanceof BackendUserSuspendedError) {
    return createHttpErrorResponse(403, "user_suspended", {
      message: error.message,
      details: { userId: error.userId, externalSubject: error.externalSubject, path }
    });
  }

  return undefined;
}

export function mapContractDecodeError(error: unknown, path: string): HttpErrorResponse | undefined {
  if (error instanceof ContractDecodeError || isContractDecodeError(error)) {
    const typed = error as unknown as { readonly message: string; readonly schema: string };
    return createHttpErrorResponse(400, "invalid_request", {
      message: typed.message,
      details: { schema: typed.schema, path }
    });
  }

  return undefined;
}

function isContractDecodeError(
  error: unknown
): error is { readonly schema: string; readonly message: string } {
  return typeof error === "object" && error !== null && "schema" in error && "message" in error;
}
