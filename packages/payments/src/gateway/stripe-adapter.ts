import { Effect } from "effect";
import Stripe from "stripe";
import { BillingGatewayError, BillingGatewayWebhookVerificationError } from "../errors.js";
import type {
  BillingCurrency,
  BillingGatewayName,
  BillingProductKind,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  GatewayWebhookEvent
} from "./types.js";
import type { BillingGatewayAdapter, BillingGatewayChargeRequest } from "../index.js";

export interface StripeGatewayAdapterOptions {
  readonly secretKey: string;
  readonly webhookSecret: string;
}

function readMetadataString(
  metadata: Stripe.Metadata | null | undefined,
  key: string
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toBillingCurrency(currency: string | null | undefined): BillingCurrency {
  if (currency?.toUpperCase() === "USD") {
    return "USD";
  }
  return "BRL";
}

function toProductKind(value: string | undefined): BillingProductKind | undefined {
  if (value === "subscription" || value === "topup") {
    return value;
  }
  return undefined;
}

function amountFromStripeTotal(amountTotal: number | null | undefined): number {
  if (amountTotal == null) {
    return 0;
  }
  return amountTotal / 100;
}

export function mapStripeEvent(event: Stripe.Event): GatewayWebhookEvent | null {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = readMetadataString(session.metadata, "application_user_id");
      if (!userId) {
        return null;
      }
      return {
        eventId: event.id,
        gateway: "stripe",
        type: "checkout.completed",
        userId,
        checkoutIntentId: readMetadataString(session.metadata, "checkout_intent_id"),
        amount: amountFromStripeTotal(session.amount_total),
        currency: toBillingCurrency(session.currency),
        externalSubscriptionId:
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
        externalCustomerId:
          typeof session.customer === "string" ? session.customer : session.customer?.id,
        internalRef: readMetadataString(session.metadata, "internal_ref"),
        productKind: toProductKind(readMetadataString(session.metadata, "product_kind"))
      };
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice & {
        readonly subscription?: string | Stripe.Subscription | null;
        readonly subscription_details?: { readonly metadata?: Stripe.Metadata | null };
      };
      const userId =
        readMetadataString(invoice.metadata, "application_user_id") ??
        readMetadataString(invoice.subscription_details?.metadata, "application_user_id");
      if (!userId) {
        return null;
      }
      const subscription = invoice.subscription;
      return {
        eventId: event.id,
        gateway: "stripe",
        type: "subscription.renewed",
        userId,
        amount: amountFromStripeTotal(invoice.amount_paid),
        currency: toBillingCurrency(invoice.currency),
        externalSubscriptionId:
          typeof subscription === "string" ? subscription : subscription?.id,
        externalCustomerId:
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id,
        internalRef: readMetadataString(invoice.metadata, "internal_ref")
      };
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = readMetadataString(subscription.metadata, "application_user_id");
      if (!userId) {
        return null;
      }
      return {
        eventId: event.id,
        gateway: "stripe",
        type: "subscription.cancelled",
        userId,
        amount: 0,
        currency: toBillingCurrency(subscription.currency),
        externalSubscriptionId: subscription.id,
        externalCustomerId:
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id
      };
    }
    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      const charge = dispute.charge;
      const chargeId = typeof charge === "string" ? charge : charge?.id;
      return {
        eventId: event.id,
        gateway: "stripe",
        type: "chargeback",
        userId: chargeId ?? "unknown",
        amount: amountFromStripeTotal(dispute.amount),
        currency: toBillingCurrency(dispute.currency)
      };
    }
    default:
      return null;
  }
}

export function createStripeGatewayAdapter(options: StripeGatewayAdapterOptions): BillingGatewayAdapter {
  const stripe = new Stripe(options.secretKey);

  return {
    name: "stripe" satisfies BillingGatewayName,
    createCheckoutSession: (request: CheckoutSessionRequest) =>
      Effect.tryPromise({
        try: async (): Promise<CheckoutSessionResult> => {
          const session = await stripe.checkout.sessions.create({
            mode: request.productKind === "subscription" ? "subscription" : "payment",
            customer_email: request.email,
            line_items: [{ price: request.externalPriceId, quantity: 1 }],
            success_url: request.successUrl,
            cancel_url: request.cancelUrl,
            metadata: {
              application_user_id: request.userId,
              checkout_intent_id: request.checkoutIntentId,
              internal_ref: request.internalRef,
              product_kind: request.productKind
            },
            ...(request.productKind === "subscription"
              ? {
                  subscription_data: {
                    metadata: {
                      application_user_id: request.userId,
                      internal_ref: request.internalRef,
                      product_kind: request.productKind
                    }
                  }
                }
              : {})
          });
          if (!session.url) {
            throw new Error("Stripe session missing url");
          }
          return { gateway: "stripe", sessionId: session.id, url: session.url };
        },
        catch: (cause) =>
          new BillingGatewayError({
            gateway: "stripe",
            message: "checkout session failed",
            cause
          })
      }),
    parseWebhook: (payload: unknown, signature: string) =>
      Effect.try({
        try: () => {
          const rawBody = typeof payload === "string" ? payload : JSON.stringify(payload);
          const event = stripe.webhooks.constructEvent(rawBody, signature, options.webhookSecret);
          const mapped = mapStripeEvent(event);
          if (!mapped) {
            throw new Error(`unsupported stripe event type: ${event.type}`);
          }
          return mapped;
        },
        catch: () =>
          new BillingGatewayWebhookVerificationError({
            gateway: "stripe",
            message: "invalid webhook signature or unsupported event"
          })
      }),
    charge: (_request: BillingGatewayChargeRequest) =>
      Effect.fail(
        new BillingGatewayError({
          gateway: "stripe",
          message: "direct charge not supported; use checkout"
        })
      )
  };
}
