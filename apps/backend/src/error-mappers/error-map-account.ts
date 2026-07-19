import { createHttpErrorResponse } from "../http/error-response-core.js";
import type { HttpErrorResponse } from "../http/error-response-core.js";
import {
  BackendAccountConfirmationMismatchError,
  BackendAccountExportNotFoundError,
  BackendAccountNotConfiguredError
} from "../http/errors.js";

export function mapAccountError(error: unknown, path: string): HttpErrorResponse | undefined {
  if (error instanceof BackendAccountConfirmationMismatchError) {
    return createHttpErrorResponse(400, "invalid_request", {
      message: "Confirmation phrase does not match — nothing was deleted",
      details: { path, userId: error.userId }
    });
  }

  if (error instanceof BackendAccountNotConfiguredError) {
    return createHttpErrorResponse(503, "service_unavailable", {
      message: "Account operations are not configured",
      details: { path, route: error.route }
    });
  }

  if (error instanceof BackendAccountExportNotFoundError) {
    return createHttpErrorResponse(404, "resource_not_found", {
      message: "Export not found, already downloaded, or expired",
      details: { path, jobId: error.jobId }
    });
  }

  return undefined;
}
