import { Effect } from "effect";
import type { BillingGatewayAdapter } from "./types.js";

export function createManualGateway(): BillingGatewayAdapter {
  return {
    name: "manual",
    charge: (request) =>
      Effect.succeed({
        gateway: "manual",
        transactionId: `manual_${request.userId}_${request.subscriptionId}`,
        status: "pending",
        raw: request
      })
  };
}
