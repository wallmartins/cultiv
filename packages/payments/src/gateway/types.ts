import type { Effect } from "effect";
import type { BillingGatewayError, BillingGatewayWebhookVerificationError } from "../errors.js";

export type BillingGatewayName = "stripe" | "asaas" | "manual" | (string & {});

export type BillingCurrency = "BRL" | "USD";
export type BillingProductKind = "subscription" | "topup";
export type BillingCheckoutPeriod = "monthly" | "annual" | "one_time";
export type BillingPaymentMethod = "card" | "pix";

export type GatewayWebhookEventType =
  | "checkout.completed"
  | "subscription.renewed"
  | "subscription.cancelled"
  | "payment.failed"
  | "chargeback";

export interface CheckoutSessionRequest {
  readonly userId: string;
  readonly email: string;
  readonly productKind: BillingProductKind;
  readonly internalRef: string;
  readonly currency: BillingCurrency;
  readonly billingPeriod: BillingCheckoutPeriod;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly checkoutIntentId: string;
  readonly externalPriceId: string;
  readonly externalCustomerId?: string;
  readonly paymentMethod?: BillingPaymentMethod;
}

export interface CheckoutSessionResult {
  readonly gateway: BillingGatewayName;
  readonly sessionId: string;
  readonly url: string;
}

export interface GatewayWebhookEvent {
  readonly eventId: string;
  readonly gateway: BillingGatewayName;
  readonly type: GatewayWebhookEventType;
  readonly userId: string;
  readonly checkoutIntentId?: string;
  readonly amount: number;
  readonly currency: BillingCurrency;
  readonly externalSubscriptionId?: string;
  readonly externalCustomerId?: string;
  readonly internalRef?: string;
  readonly productKind?: BillingProductKind;
  readonly paymentMethodKind?: BillingPaymentMethod; // contract-03 §3 — captura no checkout.completed
  readonly outstandingInvoiceUrl?: string; // contract-03 §3/§4 — regularizeUrl (Q4), setado no past_due
  readonly periodEndsAt?: string; // contract-03 Q2 — cross-check do gateway p/ accessUntil no cancelamento
}

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

export interface PortalSessionRequest {
  readonly externalCustomerId: string;
  readonly returnUrl: string;
}

export interface PortalSessionResult {
  readonly url: string;
}

export interface BillingGatewayAdapter {
  readonly name: BillingGatewayName;
  createCheckoutSession?(
    request: CheckoutSessionRequest
  ): Effect.Effect<CheckoutSessionResult, BillingGatewayError>;
  parseWebhook?(
    payload: unknown,
    signature: string
  ): Effect.Effect<GatewayWebhookEvent, BillingGatewayWebhookVerificationError>;
  charge(request: BillingGatewayChargeRequest): Effect.Effect<BillingGatewayChargeResult, BillingGatewayError>;
  // contract-03 §2 — money ops: Stripe via Customer Portal (redirect), ASAAS in-app cancel.
  createPortalSession?(request: PortalSessionRequest): Effect.Effect<PortalSessionResult, BillingGatewayError>;
  cancelSubscription?(gatewaySubscriptionId: string): Effect.Effect<void, BillingGatewayError>;
}
