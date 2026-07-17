import { Effect } from "effect";
import { BillingGatewayError, BillingGatewayWebhookVerificationError } from "../errors.js";
import type { BillingGatewayAdapter } from "./types.js";

export function createStripeGateway(): BillingGatewayAdapter {
  return {
    name: "stripe",
    createCheckoutSession: () =>
      Effect.fail(new BillingGatewayError({ gateway: "stripe", message: "checkout not implemented" })),
    parseWebhook: () =>
      Effect.fail(
        new BillingGatewayWebhookVerificationError({ gateway: "stripe", message: "webhook not implemented" })
      ),
    charge: (request) =>
      Effect.succeed({
        gateway: "stripe",
        transactionId: `stripe_${request.userId}_${request.subscriptionId}`,
        status: "paid",
        raw: request
      }),
    createPortalSession: () =>
      Effect.fail(new BillingGatewayError({ gateway: "stripe", message: "portal session not implemented" })),
    cancelSubscription: () =>
      Effect.fail(new BillingGatewayError({ gateway: "stripe", message: "cancel not implemented" }))
  };
}

export function createAsaasGateway(): BillingGatewayAdapter {
  return {
    name: "asaas",
    createCheckoutSession: () =>
      Effect.fail(new BillingGatewayError({ gateway: "asaas", message: "checkout not implemented" })),
    parseWebhook: () =>
      Effect.fail(
        new BillingGatewayWebhookVerificationError({ gateway: "asaas", message: "webhook not implemented" })
      ),
    charge: (request) =>
      Effect.succeed({
        gateway: "asaas",
        transactionId: `asaas_${request.userId}_${request.subscriptionId}`,
        status: "paid",
        raw: request
      }),
    cancelSubscription: () =>
      Effect.fail(new BillingGatewayError({ gateway: "asaas", message: "cancel not implemented" }))
  };
}
