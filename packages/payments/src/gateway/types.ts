export type BillingGatewayName = "stripe" | "asaas" | "manual" | (string & {});

export type BillingCurrency = "BRL" | "USD";
export type BillingProductKind = "subscription" | "topup";
export type BillingCheckoutPeriod = "monthly" | "annual" | "one_time";

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
}
