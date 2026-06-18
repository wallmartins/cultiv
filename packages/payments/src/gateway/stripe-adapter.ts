import { Effect } from "effect";
import type { BillingGatewayAdapter } from "./types.js";

export function createStripeGateway(): BillingGatewayAdapter {
  return {
    name: "stripe",
    charge: (request) =>
      Effect.succeed({
        gateway: "stripe",
        transactionId: `stripe_${request.userId}_${request.subscriptionId}`,
        status: "paid",
        raw: request
      })
  };
}
