import {
  BillingCheckoutCatalogNotFoundError,
  BillingEntitlementNotFoundError,
  BillingGatewayError,
  BillingGatewayWebhookVerificationError
} from "@my-ai-orchestrator/payments";
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

  if (error instanceof BillingEntitlementNotFoundError) {
    return createHttpErrorResponse(404, "resource_not_found", {
      message: "Billing entitlement not found",
      details: { path, userId: error.userId, planId: error.planId }
    });
  }

  if (error instanceof BillingGatewayError) {
    return createHttpErrorResponse(503, "service_unavailable", {
      message: error.message,
      details: { path, gateway: error.gateway }
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

  if (error instanceof BillingGatewayWebhookVerificationError) {
    return createHttpErrorResponse(400, "invalid_request", {
      message: error.message,
      details: { path, gateway: error.gateway }
    });
  }

  return undefined;
}
