import {
  PracticeProfileDerivationError,
  PracticeProfileValidationError
} from "../product/practice-profile/practice-profile-errors.js";
import { createHttpErrorResponse } from "../http/error-response-core.js";
import type { HttpErrorResponse } from "../http/error-response-core.js";

export function mapPracticeProfileError(error: unknown, path: string): HttpErrorResponse | undefined {
  if (error instanceof PracticeProfileValidationError) {
    return createHttpErrorResponse(400, "invalid_request", {
      message: error.message,
      details: { path }
    });
  }

  if (error instanceof PracticeProfileDerivationError) {
    return createHttpErrorResponse(500, "service_unavailable", {
      message: error.message,
      details: { userId: error.userId, path }
    });
  }

  return undefined;
}
