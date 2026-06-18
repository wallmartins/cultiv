import { Effect } from "effect";
import type {
  BillingGatewayAdapter,
  BillingGatewayChargeRequest,
  BillingGatewayChargeResult
} from "../index.js";

export function createManualGateway(): BillingGatewayAdapter {
  return {
    name: "manual",
    charge: (request: BillingGatewayChargeRequest) =>
      Effect.succeed({
        gateway: "manual",
        transactionId: `manual_${request.userId}_${request.subscriptionId}`,
        status: "pending",
        raw: request
      } satisfies BillingGatewayChargeResult)
  };
}
