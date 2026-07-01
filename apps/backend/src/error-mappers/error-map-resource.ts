import {
  BackendJobNotFoundError,
  BackendVoiceCalibrationSessionNotFoundError,
  BackendVoiceExampleNotFoundError,
  BackendVoiceProfileNotFoundError
} from "../http/errors.js";
import { createHttpErrorResponse } from "../http/error-response-core.js";
import type { HttpErrorResponse } from "../http/error-response-core.js";

export function mapResourceError(error: unknown, path: string): HttpErrorResponse | undefined {
  if (error instanceof BackendJobNotFoundError) {
    return createHttpErrorResponse(404, "resource_not_found", {
      message: `Job ${error.jobId} was not found`,
      details: { jobId: error.jobId, path }
    });
  }

  if (error instanceof BackendVoiceProfileNotFoundError) {
    return createHttpErrorResponse(404, "resource_not_found", {
      message: `Voice profile for user ${error.userId} was not found`,
      details: { userId: error.userId, path }
    });
  }

  if (error instanceof BackendVoiceExampleNotFoundError) {
    return createHttpErrorResponse(404, "resource_not_found", {
      message: `Voice example ${error.exampleId} was not found for user ${error.userId}`,
      details: { exampleId: error.exampleId, userId: error.userId, path }
    });
  }

  if (error instanceof BackendVoiceCalibrationSessionNotFoundError) {
    return createHttpErrorResponse(404, "resource_not_found", {
      message: `Voice calibration session ${error.sessionId} was not found for user ${error.userId}`,
      details: { sessionId: error.sessionId, userId: error.userId, path }
    });
  }

  return undefined;
}
