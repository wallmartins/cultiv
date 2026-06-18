import { Effect } from "effect";
import type { BillingGatewayAdapter } from "./types.js";

export function createAsaasGateway(): BillingGatewayAdapter {
  return {
    name: "asaas",
    charge: (request) =>
      Effect.succeed({
        gateway: "asaas",
        transactionId: `asaas_${request.userId}_${request.subscriptionId}`,
        status: "paid",
        raw: request
      })
  };
}
