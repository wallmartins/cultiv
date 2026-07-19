import { Effect } from "effect";
import { BillingGatewayError, BillingGatewayWebhookVerificationError } from "../errors.js";
import type {
  BillingCheckoutPeriod,
  BillingCurrency,
  BillingPaymentMethod,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  GatewayWebhookEvent
} from "./types.js";
import type { BillingGatewayAdapter, BillingGatewayChargeRequest } from "./types.js";

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
    readonly invoiceUrl?: string;
    readonly bankSlipUrl?: string;
  };
  readonly subscription?: {
    readonly id?: string;
    readonly customer?: string;
    readonly externalReference?: string;
  };
}

function toPaymentMethodKind(billingType: string | undefined): BillingPaymentMethod | undefined {
  if (billingType === "PIX") {
    return "pix";
  }
  if (billingType === "CREDIT_CARD") {
    return "card";
  }
  return undefined; // BOLETO etc. — fora do contrato BillingPaymentMethodSchema (card|pix)
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

async function asaasJson<T>(response: Response) {
  if (!response.ok) {
    const body = await response.text();
    throw new BillingGatewayError({
      gateway: "asaas",
      message: `Asaas API ${response.status}: ${body}`
    });
  }
  return (await response.json()) as T;
}

function checkoutUrlFromPayment(payment: { readonly invoiceUrl?: string; readonly bankSlipUrl?: string }): string {
  const url = payment.invoiceUrl ?? payment.bankSlipUrl;
  if (!url) {
    throw new BillingGatewayError({
      gateway: "asaas",
      message: "Asaas payment missing checkout url"
    });
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

export function resolveAsaasBillingType(paymentMethod?: BillingPaymentMethod): "CREDIT_CARD" | "PIX" {
  return paymentMethod === "pix" ? "PIX" : "CREDIT_CARD";
}

function dueDateIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function createAsaasPayment(
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>
) {
  const response = await fetch(`${baseUrl}/payments`, {
    method: "POST",
    headers: asaasHeaders(apiKey),
    body: JSON.stringify(body)
  });
  return asaasJson<AsaasPaymentResponse>(response);
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
      productKind: metadata.productKind === "topup" ? "topup" : metadata.productKind === "subscription" ? "subscription" : undefined,
      paymentMethodKind: toPaymentMethodKind(payment.billingType)
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
      externalCustomerId: payment.customer,
      outstandingInvoiceUrl: payment.invoiceUrl ?? payment.bankSlipUrl
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

  async function ensureCustomer(email: string, userId: string) {
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
        try: async () => {
          const customerId = request.externalCustomerId ?? (await ensureCustomer(request.email, request.userId));
          const billingType = resolveAsaasBillingType(request.paymentMethod);
          const value = priceValueFromExternalId(request.externalPriceId);

          if (
            request.productKind === "subscription" &&
            request.billingPeriod === "annual"
          ) {
            const payment = await createAsaasPayment(baseUrl, options.apiKey, {
              customer: customerId,
              billingType,
              value,
              dueDate: dueDateIso(),
              externalReference: request.checkoutIntentId,
              description: `${request.internalRef} annual`,
              ...(billingType === "CREDIT_CARD" ? { installmentCount: 12 } : {})
            });
            return {
              gateway: "asaas",
              sessionId: payment.id,
              url: checkoutUrlFromPayment(payment)
            };
          }

          if (request.productKind === "subscription") {
            const response = await fetch(`${baseUrl}/subscriptions`, {
              method: "POST",
              headers: asaasHeaders(options.apiKey),
              body: JSON.stringify({
                customer: customerId,
                billingType,
                cycle: cycleFromPeriod(request.billingPeriod),
                value,
                nextDueDate: dueDateIso(),
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
              throw new BillingGatewayError({
                gateway: "asaas",
                message: "Asaas subscription missing initial payment"
              });
            }
            return {
              gateway: "asaas",
              sessionId: subscription.id,
              url: checkoutUrlFromPayment(firstPayment)
            };
          }

          const payment = await createAsaasPayment(baseUrl, options.apiKey, {
            customer: customerId,
            billingType,
            value,
            dueDate: dueDateIso(),
            externalReference: request.checkoutIntentId,
            description: `${request.productKind}:${request.internalRef}`
          });
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
            throw new BillingGatewayWebhookVerificationError({
              gateway: "asaas",
              message: "invalid asaas webhook token"
            });
          }
          const body =
            typeof payload === "string"
              ? (JSON.parse(payload) as AsaasWebhookPayload & {
                  readonly metadata?: {
                    readonly application_user_id?: string;
                    readonly internal_ref?: string;
                    readonly product_kind?: string;
                  };
                })
              : (payload as AsaasWebhookPayload & {
                  readonly metadata?: {
                    readonly application_user_id?: string;
                    readonly internal_ref?: string;
                    readonly product_kind?: string;
                  };
                });
          const mapped = mapAsaasWebhookEvent(body, {
            userId: body.metadata?.application_user_id,
            internalRef: body.metadata?.internal_ref,
            productKind: body.metadata?.product_kind
          });
          if (!mapped) {
            throw new BillingGatewayWebhookVerificationError({
              gateway: "asaas",
              message: `unsupported asaas event: ${body.event ?? "unknown"}`
            });
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
      ),
    cancelSubscription: (gatewaySubscriptionId: string) =>
      Effect.tryPromise({
        try: async () => {
          const response = await fetch(`${baseUrl}/subscriptions/${gatewaySubscriptionId}`, {
            method: "DELETE",
            headers: asaasHeaders(options.apiKey)
          });
          if (!response.ok) {
            const body = await response.text();
            throw new BillingGatewayError({
              gateway: "asaas",
              message: `Asaas API ${response.status}: ${body}`
            });
          }
        },
        catch: (cause) =>
          cause instanceof BillingGatewayError
            ? cause
            : new BillingGatewayError({
                gateway: "asaas",
                message: "cancel subscription failed",
                cause
              })
      })
  };
}
