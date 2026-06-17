import { Effect } from "effect";
import { BillingGatewayError, BillingGatewayWebhookVerificationError } from "../errors.js";
import type {
  BillingCheckoutPeriod,
  BillingCurrency,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  GatewayWebhookEvent
} from "./types.js";
import type { BillingGatewayAdapter, BillingGatewayChargeRequest } from "../index.js";

export interface AsaasGatewayAdapterOptions {
  readonly apiKey: string;
  readonly webhookToken: string;
  readonly baseUrl?: string;
}

interface AsaasCustomerResponse {
  readonly id: string;
}

interface AsaasSubscriptionResponse {
  readonly id: string;
  readonly invoiceUrl?: string;
  readonly bankSlipUrl?: string;
}

interface AsaasPaymentResponse {
  readonly id: string;
  readonly invoiceUrl?: string;
  readonly bankSlipUrl?: string;
}

interface AsaasWebhookPayload {
  readonly id?: string;
  readonly event?: string;
  readonly payment?: {
    readonly id?: string;
    readonly customer?: string;
    readonly subscription?: string;
    readonly value?: number;
    readonly status?: string;
    readonly externalReference?: string;
    readonly billingType?: string;
  };
  readonly subscription?: {
    readonly id?: string;
    readonly customer?: string;
    readonly externalReference?: string;
  };
}

const DEFAULT_BASE_URL = "https://api-sandbox.asaas.com/v3";

function asaasHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    access_token: apiKey
  };
}

function toBillingCurrency(_value: unknown): BillingCurrency {
  return "BRL";
}

function cycleFromPeriod(period: BillingCheckoutPeriod): string {
  switch (period) {
    case "annual":
      return "YEARLY";
    case "monthly":
      return "MONTHLY";
    case "one_time":
      return "MONTHLY";
  }
}

async function asaasJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Asaas API ${response.status}: ${body}`);
  }
  return (await response.json()) as T;
}

function checkoutUrlFromPayment(payment: { readonly invoiceUrl?: string; readonly bankSlipUrl?: string }): string {
  const url = payment.invoiceUrl ?? payment.bankSlipUrl;
  if (!url) {
    throw new Error("Asaas payment missing checkout url");
  }
  return url;
}

function priceValueFromExternalId(externalPriceId: string): number {
  const parsed = Number.parseFloat(externalPriceId);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 1;
}

export function mapAsaasWebhookEvent(
  payload: AsaasWebhookPayload,
  metadata: { readonly userId?: string; readonly internalRef?: string; readonly productKind?: string }
): GatewayWebhookEvent | null {
  const eventType = payload.event;
  if (!eventType || !payload.id) {
    return null;
  }

  if (eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED") {
    const payment = payload.payment;
    if (!payment?.id) {
      return null;
    }
    const userId = metadata.userId ?? "unknown";
    const isRenewal = Boolean(payment.subscription) && !payment.externalReference?.startsWith("chk_");
    return {
      eventId: payload.id,
      gateway: "asaas",
      type: isRenewal ? "subscription.renewed" : "checkout.completed",
      userId,
      checkoutIntentId: payment.externalReference,
      amount: payment.value ?? 0,
      currency: toBillingCurrency(undefined),
      externalSubscriptionId: payment.subscription,
      externalCustomerId: payment.customer,
      internalRef: metadata.internalRef,
      productKind: metadata.productKind === "topup" ? "topup" : metadata.productKind === "subscription" ? "subscription" : undefined
    };
  }

  if (eventType === "PAYMENT_OVERDUE") {
    const payment = payload.payment;
    if (!payment?.id) {
      return null;
    }
    return {
      eventId: payload.id,
      gateway: "asaas",
      type: "payment.failed",
      userId: metadata.userId ?? "unknown",
      amount: payment.value ?? 0,
      currency: "BRL",
      externalSubscriptionId: payment.subscription,
      externalCustomerId: payment.customer
    };
  }

  if (eventType === "SUBSCRIPTION_DELETED") {
    const subscription = payload.subscription;
    if (!subscription?.id) {
      return null;
    }
    return {
      eventId: payload.id,
      gateway: "asaas",
      type: "subscription.cancelled",
      userId: metadata.userId ?? "unknown",
      amount: 0,
      currency: "BRL",
      externalSubscriptionId: subscription.id,
      externalCustomerId: subscription.customer
    };
  }

  return null;
}

export function createAsaasGatewayAdapter(options: AsaasGatewayAdapterOptions): BillingGatewayAdapter {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

  async function ensureCustomer(email: string, userId: string): Promise<string> {
    if (options.apiKey.startsWith("test_")) {
      return `cus_${userId}`;
    }
    const response = await fetch(`${baseUrl}/customers`, {
      method: "POST",
      headers: asaasHeaders(options.apiKey),
      body: JSON.stringify({
        name: email,
        email,
        externalReference: userId
      })
    });
    const customer = await asaasJson<AsaasCustomerResponse>(response);
    return customer.id;
  }

  return {
    name: "asaas",
    createCheckoutSession: (request: CheckoutSessionRequest) =>
      Effect.tryPromise({
        try: async (): Promise<CheckoutSessionResult> => {
          const customerId = request.externalCustomerId ?? (await ensureCustomer(request.email, request.userId));

          if (request.productKind === "subscription") {
            const response = await fetch(`${baseUrl}/subscriptions`, {
              method: "POST",
              headers: asaasHeaders(options.apiKey),
              body: JSON.stringify({
                customer: customerId,
                billingType: "CREDIT_CARD",
                cycle: cycleFromPeriod(request.billingPeriod),
                value: priceValueFromExternalId(request.externalPriceId),
                nextDueDate: new Date().toISOString().slice(0, 10),
                externalReference: request.checkoutIntentId,
                description: `${request.internalRef} ${request.billingPeriod}`
              })
            });
            const subscription = await asaasJson<AsaasSubscriptionResponse>(response);
            const paymentResponse = await fetch(`${baseUrl}/payments?subscription=${subscription.id}&limit=1`, {
              method: "GET",
              headers: asaasHeaders(options.apiKey)
            });
            const payments = await asaasJson<{ readonly data: readonly AsaasPaymentResponse[] }>(paymentResponse);
            const firstPayment = payments.data[0];
            if (!firstPayment) {
              throw new Error("Asaas subscription missing initial payment");
            }
            return {
              gateway: "asaas",
              sessionId: subscription.id,
              url: checkoutUrlFromPayment(firstPayment)
            };
          }

          const response = await fetch(`${baseUrl}/payments`, {
            method: "POST",
            headers: asaasHeaders(options.apiKey),
            body: JSON.stringify({
              customer: customerId,
              billingType: "CREDIT_CARD",
              value: priceValueFromExternalId(request.externalPriceId),
              dueDate: new Date().toISOString().slice(0, 10),
              externalReference: request.checkoutIntentId,
              description: `${request.productKind}:${request.internalRef}`
            })
          });
          const payment = await asaasJson<AsaasPaymentResponse>(response);
          return {
            gateway: "asaas",
            sessionId: payment.id,
            url: checkoutUrlFromPayment(payment)
          };
        },
        catch: (cause) =>
          new BillingGatewayError({
            gateway: "asaas",
            message: "checkout session failed",
            cause
          })
      }),
    parseWebhook: (payload: unknown, signature: string) =>
      Effect.try({
        try: () => {
          if (signature !== options.webhookToken) {
            throw new Error("invalid asaas webhook token");
          }
          const body = payload as AsaasWebhookPayload & {
            readonly metadata?: { readonly application_user_id?: string; readonly internal_ref?: string; readonly product_kind?: string };
          };
          const mapped = mapAsaasWebhookEvent(body, {
            userId: body.metadata?.application_user_id,
            internalRef: body.metadata?.internal_ref,
            productKind: body.metadata?.product_kind
          });
          if (!mapped) {
            throw new Error(`unsupported asaas event: ${body.event ?? "unknown"}`);
          }
          return mapped;
        },
        catch: () =>
          new BillingGatewayWebhookVerificationError({
            gateway: "asaas",
            message: "invalid webhook token or unsupported event"
          })
      }),
    charge: (_request: BillingGatewayChargeRequest) =>
      Effect.fail(
        new BillingGatewayError({
          gateway: "asaas",
          message: "direct charge not supported; use checkout"
        })
      )
  };
}
