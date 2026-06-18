import { Effect } from "effect";
import {
  decodeBillingCheckoutResponse,
  decodeBillingEntitlementView,
  type BillingCheckoutRequest,
  type BillingCheckoutResponse,
  type BillingEntitlementView
} from "@my-ai-orchestrator/contracts";
import { decodeOkResponseEffect } from "./decode-response.js";
import type { ClientSdkError } from "./errors.js";
import type { HttpTransport } from "./transport.js";

export interface BillingCreateCheckoutInput extends BillingCheckoutRequest {
  readonly signal?: AbortSignal;
}

export interface BillingGetEntitlementInput {
  readonly signal?: AbortSignal;
}

export interface BillingClient {
  readonly createCheckout: (
    input: BillingCreateCheckoutInput
  ) => Effect.Effect<BillingCheckoutResponse, ClientSdkError>;
  readonly getEntitlement: (
    input?: BillingGetEntitlementInput
  ) => Effect.Effect<BillingEntitlementView, ClientSdkError>;
}

export function createBillingClient(transport: HttpTransport): BillingClient {
  return {
    createCheckout(input) {
      const { signal, ...body } = input;
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: "/me/billing/checkout",
          body,
          signal
        });

        return yield* decodeOkResponseEffect(response, "billing checkout", decodeBillingCheckoutResponse);
      });
    },
    getEntitlement(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/billing/entitlement",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "billing entitlement", decodeBillingEntitlementView);
      });
    }
  };
}
