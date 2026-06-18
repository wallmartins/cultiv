import type { Effect } from "effect";

export type BillingGatewayName = "stripe" | "asaas" | "manual" | (string & {});

export interface BillingGatewayChargeRequest {
  readonly userId: string;
  readonly subscriptionId: string;
  readonly amount: number;
  readonly currency: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface BillingGatewayChargeResult {
  readonly gateway: BillingGatewayName;
  readonly transactionId: string;
  readonly status: "paid" | "pending" | "failed";
  readonly raw?: unknown;
}

export interface BillingGatewayAdapter {
  readonly name: BillingGatewayName;
  readonly charge: (request: BillingGatewayChargeRequest) => Effect.Effect<BillingGatewayChargeResult>;
}
