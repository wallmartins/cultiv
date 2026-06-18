import { BillingCheckoutCatalogNotFoundError } from "@my-ai-orchestrator/payments";
import { createHttpErrorResponse } from "../http/error-response-core.js";
import type { HttpErrorResponse } from "../http/error-response-core.js";
import { BackendBillingNotConfiguredError } from "../http/errors.js";

export function mapBillingError(error: unknown, path: string): HttpErrorResponse | undefined {
  if (error instanceof BackendBillingNotConfiguredError) {
    return createHttpErrorResponse(503, "service_unavailable", {
      message: error.message ?? "Billing checkout is not configured",
      details: { path, route: error.route }
    });
  }

  if (error instanceof BillingCheckoutCatalogNotFoundError) {
    return createHttpErrorResponse(404, "resource_not_found", {
      message: "Billing catalog entry not found",
      details: {
        path,
        productKind: error.productKind,
        internalRef: error.internalRef,
        currency: error.currency,
        billingPeriod: error.billingPeriod
      }
    });
  }

  return undefined;
}
