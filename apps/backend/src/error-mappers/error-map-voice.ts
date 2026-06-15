import {
  VoiceBatchExpiredError,
  VoiceBatchNotFoundError,
  VoiceExampleValidationError,
  VoicePinnedLimitExceededError
} from "@my-ai-orchestrator/domain";
import { createHttpErrorResponse } from "../http/error-response-core.js";
import type { HttpErrorResponse } from "../http/error-response-core.js";

export function mapVoiceError(error: unknown, path: string): HttpErrorResponse | undefined {
  if (error instanceof VoiceBatchNotFoundError) {
    return createHttpErrorResponse(404, "resource_not_found", {
      message: `Voice example batch ${error.batchId} was not found`,
      details: { batchId: error.batchId, path }
    });
  }

  if (error instanceof VoiceBatchExpiredError) {
    return createHttpErrorResponse(409, "execution_conflict", {
      message: "Voice example batch has expired and can no longer be committed",
      details: { batchId: error.batchId, expiredAt: error.expiredAt, path }
    });
  }

  if (error instanceof VoiceExampleValidationError) {
    return createHttpErrorResponse(400, "invalid_request", {
      message: error.message,
      details: {
        reasonCode: error.reasonCode,
        field: error.field,
        path
      }
    });
  }

  if (error instanceof VoicePinnedLimitExceededError) {
    return createHttpErrorResponse(400, "invalid_request", {
      message: `Pinned example limit exceeded (${error.attemptedPinnedCount} requested, limit is ${error.pinnedLimit})`,
      details: {
        userId: error.userId,
        attemptedPinnedCount: error.attemptedPinnedCount,
        pinnedLimit: error.pinnedLimit,
        path
      }
    });
  }

  return undefined;
}
