import { randomUUID } from "node:crypto";
import { Effect, Option } from "effect";
import {
  BillingCheckoutCatalogNotFoundError,
  BillingGatewayError,
  createAsaasGatewayAdapter,
  createStripeGatewayAdapter,
  resolveGatewayForCurrency,
  type BillingCheckoutPeriod,
  type BillingCurrency,
  type BillingGatewayAdapter,
  type BillingProductKind,
  type BillingServiceContract
} from "@my-ai-orchestrator/payments";
import type { BackendConfig } from "../../config/config.js";
import type { PostgresBillingGatewayStore } from "../../infra/postgres-billing-gateway-store.js";

export interface BillingCheckoutInput {
  readonly userId: string;
  readonly email: string;
  readonly productKind: BillingProductKind;
  readonly internalRef: string;
  readonly currency: BillingCurrency;
  readonly billingPeriod: BillingCheckoutPeriod;
  readonly paymentMethod?: "card" | "pix";
}

export interface BillingCheckoutResult {
  readonly url: string;
  readonly intentId: string;
  readonly gateway: "stripe" | "asaas";
}

export interface BillingCheckoutService {
  readonly createCheckout: (
    input: BillingCheckoutInput
  ) => Effect.Effect<
    BillingCheckoutResult,
    BillingCheckoutCatalogNotFoundError | BillingGatewayError
  >;
}

export function createBillingGatewayAdapters(
  config: BackendConfig
): { readonly stripe?: BillingGatewayAdapter; readonly asaas?: BillingGatewayAdapter } {
  const stripe =
    config.stripeSecretKey && config.stripeWebhookSecret
      ? createStripeGatewayAdapter({
          secretKey: config.stripeSecretKey,
          webhookSecret: config.stripeWebhookSecret
        })
      : undefined;
  const asaas =
    config.asaasApiKey && config.asaasWebhookToken
      ? createAsaasGatewayAdapter({
          apiKey: config.asaasApiKey,
          webhookToken: config.asaasWebhookToken,
          baseUrl: config.asaasBaseUrl
        })
      : undefined;
  return { stripe, asaas };
}

export function createBillingCheckoutService(deps: {
  readonly billing: BillingServiceContract;
  readonly gatewayStore: PostgresBillingGatewayStore;
  readonly stripeAdapter?: BillingGatewayAdapter;
  readonly asaasAdapter?: BillingGatewayAdapter;
  readonly config: BackendConfig;
  readonly now: () => Date;
}): BillingCheckoutService {
  const mapStoreError = <A>(effect: Effect.Effect<A, Error>) =>
    effect.pipe(
      Effect.mapError(
        (error) =>
          new BillingGatewayError({
            gateway: "billing",
            message: error.message,
            cause: error
          })
      )
    );

  return {
    createCheckout: (input) =>
      Effect.gen(function* () {
        if (!deps.config.billingCheckoutSuccessUrl || !deps.config.billingCheckoutCancelUrl) {
          return yield* Effect.fail(
            new BillingGatewayError({
              gateway: "billing",
              message: "billing checkout redirect URLs are not configured"
            })
          );
        }

        if (input.paymentMethod === "pix" && input.currency !== "BRL") {
          return yield* Effect.fail(
            new BillingGatewayError({
              gateway: "billing",
              message: "PIX is only available for BRL checkout"
            })
          );
        }

        const gateway = resolveGatewayForCurrency(input.currency);
        const adapter = gateway === "stripe" ? deps.stripeAdapter : deps.asaasAdapter;
        if (!adapter?.createCheckoutSession) {
          return yield* Effect.fail(
            new BillingGatewayError({
              gateway,
              message: "payment gateway is not configured"
            })
          );
        }

        const catalogOption = yield* mapStoreError(
          deps.gatewayStore.findCatalogEntry(
            input.productKind,
            input.internalRef,
            input.currency,
            input.billingPeriod
          )
        );
        if (Option.isNone(catalogOption)) {
          return yield* Effect.fail(
            new BillingCheckoutCatalogNotFoundError({
              productKind: input.productKind,
              internalRef: input.internalRef,
              currency: input.currency,
              billingPeriod: input.billingPeriod
            })
          );
        }
        const catalog = catalogOption.value;

        const intentId = `chk_${randomUUID()}`;
        const createdAt = deps.now().toISOString();
        yield* mapStoreError(
          deps.gatewayStore.createCheckoutIntent({
            id: intentId,
            userId: input.userId,
            productKind: input.productKind,
            internalRef: input.internalRef,
            currency: input.currency,
            gateway,
            status: "pending",
            createdAt
          })
        );

        const customerOption = yield* mapStoreError(
          deps.gatewayStore.getGatewayCustomer(input.userId, gateway)
        );
        const session = yield* adapter.createCheckoutSession({
          userId: input.userId,
          email: input.email,
          productKind: input.productKind,
          internalRef: input.internalRef,
          currency: input.currency,
          billingPeriod: input.billingPeriod,
          checkoutIntentId: intentId,
          externalPriceId: catalog.externalPriceId,
          externalCustomerId: Option.isSome(customerOption)
            ? customerOption.value.externalCustomerId
            : undefined,
          successUrl: deps.config.billingCheckoutSuccessUrl,
          cancelUrl: deps.config.billingCheckoutCancelUrl,
          paymentMethod: input.paymentMethod
        });

        yield* mapStoreError(deps.gatewayStore.attachSessionToIntent(intentId, session.sessionId));

        return {
          url: session.url,
          intentId,
          gateway: gateway === "stripe" ? "stripe" : "asaas"
        };
      })
  };
}
