import type {
  ApiErrorCategory,
  ApiErrorCode,
  ApiErrorResponse
} from "@my-ai-orchestrator/contracts";
import {
  BackendAuthenticationError,
  BackendAuthorizationError
} from "./errors.js";

export interface HttpErrorResponse {
  readonly status: 400 | 401 | 403 | 404 | 409 | 429 | 500 | 503;
  readonly body: ApiErrorResponse;
}

export function createHttpErrorResponse(
  status: HttpErrorResponse["status"],
  code: ApiErrorCode,
  options: {
    readonly message: string;
    readonly details?: Readonly<Record<string, unknown>>;
  }
): HttpErrorResponse {
  return {
    status,
    body: {
      status,
      code,
      category: getCategoryForCode(code),
      message: options.message,
      retryable: status >= 500 || status === 429,
      details: options.details
    }
  };
}

export function normalizeAuthenticationCode(
  reason: BackendAuthenticationError["reason"]
): ApiErrorCode {
  switch (reason) {
    case "missing_token":
      return "authentication_missing_token";
    case "expired_token":
      return "authentication_expired_token";
    default:
      return "authentication_invalid_token";
  }
}

export function normalizeAuthorizationCode(
  reason: Exclude<BackendAuthorizationError["reason"], "unauthenticated">
): ApiErrorCode {
  switch (reason) {
    case "missing_permission":
      return "authorization_insufficient_permission";
    case "missing_role":
      return "authorization_missing_role";
    case "not_owner":
      return "authorization_not_owner";
    default:
      return "authorization_insufficient_permission";
  }
}

function getCategoryForCode(code: ApiErrorCode): ApiErrorCategory {
  switch (code) {
    case "invalid_request":
      return "invalid_request";
    case "authentication_missing_token":
    case "authentication_invalid_token":
    case "authentication_expired_token":
      return "authentication";
    case "safety_input_blocked":
    case "safety_input_quarantined":
      return "invalid_request";
    case "authorization_insufficient_permission":
    case "authorization_missing_role":
    case "authorization_not_owner":
    case "user_suspended":
    case "usage_restricted":
      return "authorization";
    case "resource_not_found":
      return "not_found";
    case "quote_stale":
    case "execution_conflict":
      return "conflict";
    case "rate_limited":
      return "rate_limit";
    case "voice_training_consent_required":
      return "authorization";
    case "service_unavailable":
    case "internal_error":
      return "internal";
    default: {
      const _exhaustive: never = code;
      return _exhaustive;
    }
  }
}
