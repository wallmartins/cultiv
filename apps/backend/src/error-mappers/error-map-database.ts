import { DatabaseError } from "@my-ai-orchestrator/database";
import { createHttpErrorResponse } from "../http/error-response-core.js";
import type { HttpErrorResponse } from "../http/error-response-core.js";

export function mapDatabaseError(error: unknown, path: string): HttpErrorResponse | undefined {
  if (error instanceof DatabaseError) {
    return createHttpErrorResponse(500, "internal_error", {
      message: "Database operation failed",
      details: { operation: error.operation, path }
    });
  }

  return undefined;
}
