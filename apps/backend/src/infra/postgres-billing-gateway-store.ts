import { Effect, Option } from "effect";
import type { Kysely } from "kysely";
import type {
  BillingCheckoutIntentsTable,
  BillingGatewayCatalogTable,
  BillingGatewayCustomersTable,
  BillingGatewaySubscriptionsTable,
  DatabaseTables
} from "./postgres-tables.js";

export interface BillingGatewayCatalogEntry {
  readonly id: string;
  readonly productKind: string;
  readonly internalRef: string;
  readonly currency: string;
  readonly gateway: string;
  readonly billingPeriod: string;
  readonly externalProductId: string;
  readonly externalPriceId: string;
  readonly active: boolean;
  readonly createdAt: string;
}

export interface BillingCheckoutIntent {
  readonly id: string;
  readonly userId: string;
  readonly productKind: string;
  readonly internalRef: string;
  readonly currency: string;
  readonly gateway: string;
  readonly status: string;
  readonly externalSessionId: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface BillingGatewayCustomer {
  readonly userId: string;
  readonly gateway: string;
  readonly externalCustomerId: string;
  readonly createdAt: string;
}

export interface BillingGatewaySubscription {
  readonly subscriptionId: string;
  readonly gateway: string;
  readonly externalSubscriptionId: string;
  readonly status: string;
  readonly currency: string;
  readonly updatedAt: string;
  readonly paymentMethodKind?: string;
  readonly paymentMethodBrandLast4?: string;
  readonly outstandingInvoiceUrl?: string;
}

export interface CreateCheckoutIntentInput {
  readonly id: string;
  readonly userId: string;
  readonly productKind: string;
  readonly internalRef: string;
  readonly currency: string;
  readonly gateway: string;
  readonly status: string;
  readonly createdAt: string;
}

export interface UpsertGatewayCustomerInput {
  readonly userId: string;
  readonly gateway: string;
  readonly externalCustomerId: string;
  readonly createdAt: string;
}

export interface UpsertGatewaySubscriptionInput {
  readonly subscriptionId: string;
  readonly gateway: string;
  readonly externalSubscriptionId: string;
  readonly status: string;
  readonly currency: string;
  readonly updatedAt: string;
  readonly paymentMethodKind?: string;
  readonly paymentMethodBrandLast4?: string;
  readonly outstandingInvoiceUrl?: string;
}

export interface RecordGatewayEventInput {
  readonly eventId: string;
  readonly gateway: string;
  readonly eventType: string;
  readonly processedAt: string;
  readonly payloadHash?: string;
}

export interface PostgresBillingGatewayStore {
  readonly findCatalogEntry: (
    productKind: string,
    internalRef: string,
    currency: string,
    billingPeriod: string
  ) => Effect.Effect<Option.Option<BillingGatewayCatalogEntry>, Error>;
  readonly createCheckoutIntent: (
    intent: CreateCheckoutIntentInput
  ) => Effect.Effect<BillingCheckoutIntent, Error>;
  readonly completeCheckoutIntent: (
    id: string,
    completedAt: string
  ) => Effect.Effect<void, Error>;
  readonly getCheckoutIntent: (id: string) => Effect.Effect<Option.Option<BillingCheckoutIntent>, Error>;
  readonly attachSessionToIntent: (
    id: string,
    externalSessionId: string
  ) => Effect.Effect<void, Error>;
  readonly upsertGatewayCustomer: (
    input: UpsertGatewayCustomerInput
  ) => Effect.Effect<void, Error>;
  readonly getGatewayCustomer: (
    userId: string,
    gateway: string
  ) => Effect.Effect<Option.Option<BillingGatewayCustomer>, Error>;
  readonly upsertGatewaySubscription: (
    input: UpsertGatewaySubscriptionInput
  ) => Effect.Effect<void, Error>;
  readonly getGatewaySubscription: (
    subscriptionId: string
  ) => Effect.Effect<Option.Option<BillingGatewaySubscription>, Error>;
  readonly recordGatewayEvent: (input: RecordGatewayEventInput) => Effect.Effect<boolean, Error>;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}

function parseCatalogRow(row: BillingGatewayCatalogTable): BillingGatewayCatalogEntry {
  return {
    id: row.id,
    productKind: row.product_kind,
    internalRef: row.internal_ref,
    currency: row.currency,
    gateway: row.gateway,
    billingPeriod: row.billing_period,
    externalProductId: row.external_product_id,
    externalPriceId: row.external_price_id,
    active: row.active,
    createdAt: row.created_at
  };
}

function parseCheckoutIntentRow(row: BillingCheckoutIntentsTable): BillingCheckoutIntent {
  return {
    id: row.id,
    userId: row.user_id,
    productKind: row.product_kind,
    internalRef: row.internal_ref,
    currency: row.currency,
    gateway: row.gateway,
    status: row.status,
    externalSessionId: row.external_session_id,
    createdAt: row.created_at,
    completedAt: row.completed_at
  };
}

function parseGatewayCustomerRow(row: BillingGatewayCustomersTable): BillingGatewayCustomer {
  return {
    userId: row.user_id,
    gateway: row.gateway,
    externalCustomerId: row.external_customer_id,
    createdAt: row.created_at
  };
}

function parseGatewaySubscriptionRow(row: BillingGatewaySubscriptionsTable): BillingGatewaySubscription {
  return {
    subscriptionId: row.subscription_id,
    gateway: row.gateway,
    externalSubscriptionId: row.external_subscription_id,
    status: row.status,
    currency: row.currency,
    updatedAt: row.updated_at,
    ...(row.payment_method_kind ? { paymentMethodKind: row.payment_method_kind } : {}),
    ...(row.payment_method_brand_last4 ? { paymentMethodBrandLast4: row.payment_method_brand_last4 } : {}),
    ...(row.outstanding_invoice_url ? { outstandingInvoiceUrl: row.outstanding_invoice_url } : {})
  };
}

export function createPostgresBillingGatewayStore(
  db: Kysely<DatabaseTables>
): PostgresBillingGatewayStore {
  return {
    findCatalogEntry(productKind, internalRef, currency, billingPeriod) {
      return Effect.tryPromise({
        try: () =>
          db
            .selectFrom("billing_gateway_catalog")
            .selectAll()
            .where("product_kind", "=", productKind)
            .where("internal_ref", "=", internalRef)
            .where("currency", "=", currency)
            .where("billing_period", "=", billingPeriod)
            .where("active", "=", true)
            .executeTakeFirst(),
        catch: toError
      }).pipe(
        Effect.map((row) => (row ? Option.some(parseCatalogRow(row)) : Option.none()))
      );
    },

    createCheckoutIntent(intent) {
      const row: BillingCheckoutIntentsTable = {
        id: intent.id,
        user_id: intent.userId,
        product_kind: intent.productKind,
        internal_ref: intent.internalRef,
        currency: intent.currency,
        gateway: intent.gateway,
        status: intent.status,
        external_session_id: null,
        created_at: intent.createdAt,
        completed_at: null
      };

      return Effect.tryPromise({
        try: () => db.insertInto("billing_checkout_intents").values(row).execute(),
        catch: toError
      }).pipe(Effect.as(parseCheckoutIntentRow(row)));
    },

    completeCheckoutIntent(id, completedAt) {
      return Effect.tryPromise({
        try: () =>
          db
            .updateTable("billing_checkout_intents")
            .set({
              status: "completed",
              completed_at: completedAt
            })
            .where("id", "=", id)
            .execute(),
        catch: toError
      }).pipe(Effect.asVoid);
    },

    getCheckoutIntent(id) {
      return Effect.tryPromise({
        try: () =>
          db
            .selectFrom("billing_checkout_intents")
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirst(),
        catch: toError
      }).pipe(
        Effect.map((row) => (row ? Option.some(parseCheckoutIntentRow(row)) : Option.none()))
      );
    },

    attachSessionToIntent(id, externalSessionId) {
      return Effect.tryPromise({
        try: () =>
          db
            .updateTable("billing_checkout_intents")
            .set({ external_session_id: externalSessionId })
            .where("id", "=", id)
            .execute(),
        catch: toError
      }).pipe(Effect.asVoid);
    },

    upsertGatewayCustomer(input) {
      const row: BillingGatewayCustomersTable = {
        user_id: input.userId,
        gateway: input.gateway,
        external_customer_id: input.externalCustomerId,
        created_at: input.createdAt
      };

      return Effect.tryPromise({
        try: () =>
          db
            .insertInto("billing_gateway_customers")
            .values(row)
            .onConflict((oc) =>
              oc.columns(["user_id", "gateway"]).doUpdateSet({
                external_customer_id: input.externalCustomerId
              })
            )
            .execute(),
        catch: toError
      }).pipe(Effect.asVoid);
    },

    getGatewayCustomer(userId, gateway) {
      return Effect.tryPromise({
        try: () =>
          db
            .selectFrom("billing_gateway_customers")
            .selectAll()
            .where("user_id", "=", userId)
            .where("gateway", "=", gateway)
            .executeTakeFirst(),
        catch: toError
      }).pipe(
        Effect.map((row) => (row ? Option.some(parseGatewayCustomerRow(row)) : Option.none()))
      );
    },

    upsertGatewaySubscription(input) {
      const row: BillingGatewaySubscriptionsTable = {
        subscription_id: input.subscriptionId,
        gateway: input.gateway,
        external_subscription_id: input.externalSubscriptionId,
        status: input.status,
        currency: input.currency,
        updated_at: input.updatedAt,
        payment_method_kind: input.paymentMethodKind ?? null,
        payment_method_brand_last4: input.paymentMethodBrandLast4 ?? null,
        outstanding_invoice_url: input.outstandingInvoiceUrl ?? null
      };

      return Effect.tryPromise({
        try: () =>
          db
            .insertInto("billing_gateway_subscriptions")
            .values(row)
            .onConflict((oc) =>
              oc.column("subscription_id").doUpdateSet({
                gateway: input.gateway,
                external_subscription_id: input.externalSubscriptionId,
                status: input.status,
                currency: input.currency,
                updated_at: input.updatedAt,
                // só sobrescreve quando o evento traz o dado; preserva o já capturado.
                ...(input.paymentMethodKind ? { payment_method_kind: input.paymentMethodKind } : {}),
                ...(input.paymentMethodBrandLast4
                  ? { payment_method_brand_last4: input.paymentMethodBrandLast4 }
                  : {}),
                ...(input.outstandingInvoiceUrl
                  ? { outstanding_invoice_url: input.outstandingInvoiceUrl }
                  : {})
              })
            )
            .execute(),
        catch: toError
      }).pipe(Effect.asVoid);
    },

    getGatewaySubscription(subscriptionId) {
      return Effect.tryPromise({
        try: () =>
          db
            .selectFrom("billing_gateway_subscriptions")
            .selectAll()
            .where("subscription_id", "=", subscriptionId)
            .executeTakeFirst(),
        catch: toError
      }).pipe(
        Effect.map((row) => (row ? Option.some(parseGatewaySubscriptionRow(row)) : Option.none()))
      );
    },

    recordGatewayEvent(input) {
      return Effect.tryPromise({
        try: () =>
          db
            .insertInto("billing_gateway_events")
            .values({
              event_id: input.eventId,
              gateway: input.gateway,
              event_type: input.eventType,
              processed_at: input.processedAt,
              payload_hash: input.payloadHash ?? null
            })
            .execute(),
        catch: toError
      }).pipe(
        Effect.map(() => true),
        Effect.catchIf(isUniqueViolation, () => Effect.succeed(false))
      );
    }
  };
}
