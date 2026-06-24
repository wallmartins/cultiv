import type { ApiErrorCode } from "@my-ai-orchestrator/contracts";
import { createHttpErrorResponse } from "./error-response-core.js";
import type { HttpErrorResponse } from "./error-response-core.js";
import { mapAuthError, mapContractDecodeError } from "../error-mappers/error-map-auth.js";
import { mapExecutionError } from "../error-mappers/error-map-execution.js";
import { mapPolicyError } from "../error-mappers/error-map-policy.js";
import { mapResourceError } from "../error-mappers/error-map-resource.js";
import { mapSafetyError } from "../error-mappers/error-map-safety.js";
import { mapVoiceError } from "../error-mappers/error-map-voice.js";
import { mapBillingError } from "../error-mappers/error-map-billing.js";
import { mapDatabaseError } from "../error-mappers/error-map-database.js";

export { createHttpErrorResponse };
export type { HttpErrorResponse };

export function mapErrorToHttp(error: unknown, path: string): HttpErrorResponse {
  const authResult = mapAuthError(error, path);
  if (authResult) return authResult;

  const databaseResult = mapDatabaseError(error, path);
  if (databaseResult) return databaseResult;

  const resourceResult = mapResourceError(error, path);
  if (resourceResult) return resourceResult;

  const voiceResult = mapVoiceError(error, path);
  if (voiceResult) return voiceResult;

  const safetyResult = mapSafetyError(error, path);
  if (safetyResult) return safetyResult;

  const executionResult = mapExecutionError(error, path);
  if (executionResult) return executionResult;

  const policyResult = mapPolicyError(error, path);
  if (policyResult) return policyResult;

  const contractResult = mapContractDecodeError(error, path);
  if (contractResult) return contractResult;

  const billingResult = mapBillingError(error, path);
  if (billingResult) return billingResult;

  if (error instanceof Error) {
    return createHttpErrorResponse(500, "internal_error", {
      message: error.message,
      details: { path }
    });
  }

  return createHttpErrorResponse(500, "internal_error", {
    message: "Unexpected backend error",
    details: { path }
  });
}
