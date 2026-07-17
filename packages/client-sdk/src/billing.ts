import { Effect } from "effect";
import {
  decodeBillingCheckoutResponse,
  decodeBillingEntitlementView,
  decodeBillingPortalSessionResponse,
  decodeBillingTopUpCatalogView,
  decodeCheckoutStatusView,
  decodeLedgerStatementView,
  decodePlanCatalogView,
  type BillingCheckoutRequest,
  type BillingCheckoutResponse,
  type BillingEntitlementView,
  type BillingPortalSessionResponse,
  type BillingTopUpCatalogView,
  type CheckoutStatusView,
  type LedgerStatementView,
  type PlanCatalogView
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

export interface BillingGetPlansInput {
  readonly signal?: AbortSignal;
}

export interface BillingListTopUpsInput {
  readonly signal?: AbortSignal;
}

export interface BillingGetStatementInput {
  readonly limit?: number;
  readonly offset?: number;
  readonly signal?: AbortSignal;
}

export interface BillingCreatePortalSessionInput {
  readonly signal?: AbortSignal;
}

export interface BillingCancelSubscriptionInput {
  readonly signal?: AbortSignal;
}

export interface BillingGetCheckoutStatusInput {
  readonly intentId: string;
  readonly signal?: AbortSignal;
}

export interface BillingClient {
  readonly createCheckout: (
    input: BillingCreateCheckoutInput
  ) => Effect.Effect<BillingCheckoutResponse, ClientSdkError>;
  readonly getEntitlement: (
    input?: BillingGetEntitlementInput
  ) => Effect.Effect<BillingEntitlementView, ClientSdkError>;
  readonly getPlans: (input?: BillingGetPlansInput) => Effect.Effect<PlanCatalogView, ClientSdkError>;
  readonly listTopUps: (input?: BillingListTopUpsInput) => Effect.Effect<BillingTopUpCatalogView, ClientSdkError>;
  readonly getStatement: (input?: BillingGetStatementInput) => Effect.Effect<LedgerStatementView, ClientSdkError>;
  readonly createPortalSession: (
    input?: BillingCreatePortalSessionInput
  ) => Effect.Effect<BillingPortalSessionResponse, ClientSdkError>;
  readonly cancelSubscription: (
    input?: BillingCancelSubscriptionInput
  ) => Effect.Effect<BillingEntitlementView, ClientSdkError>;
  readonly getCheckoutStatus: (
    input: BillingGetCheckoutStatusInput
  ) => Effect.Effect<CheckoutStatusView, ClientSdkError>;
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
    },
    getPlans(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/billing/plans",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "billing plans", decodePlanCatalogView);
      });
    },
    listTopUps(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/billing/topups",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "billing top-ups", decodeBillingTopUpCatalogView);
      });
    },
    getStatement(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: "/me/billing/statement",
          query: {
            limit: input.limit,
            offset: input.offset
          },
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "billing statement", decodeLedgerStatementView);
      });
    },
    createPortalSession(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: "/me/billing/portal-session",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "billing portal session", decodeBillingPortalSessionResponse);
      });
    },
    cancelSubscription(input = {}) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "POST",
          path: "/me/billing/subscription/cancel",
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "billing subscription cancel", decodeBillingEntitlementView);
      });
    },
    getCheckoutStatus(input) {
      return Effect.gen(function* () {
        const response = yield* transport.send({
          method: "GET",
          path: `/me/billing/checkout-status/${encodeURIComponent(input.intentId)}`,
          signal: input.signal
        });

        return yield* decodeOkResponseEffect(response, "billing checkout status", decodeCheckoutStatusView);
      });
    }
  };
}
