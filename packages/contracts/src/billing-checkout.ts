import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";

export const BillingCurrencySchema = Schema.Literal("BRL", "USD");
export type BillingCurrency = typeof BillingCurrencySchema.Type;

export const BillingProductKindSchema = Schema.Literal("subscription", "topup");
export type BillingProductKind = typeof BillingProductKindSchema.Type;

export const BillingCheckoutPeriodSchema = Schema.Literal("monthly", "annual", "one_time");
export type BillingCheckoutPeriod = typeof BillingCheckoutPeriodSchema.Type;

export const BillingPaymentMethodSchema = Schema.Literal("card", "pix");
export type BillingPaymentMethod = typeof BillingPaymentMethodSchema.Type;

export const BillingCheckoutRequestSchema = Schema.Struct({
  productKind: BillingProductKindSchema,
  internalRef: Schema.String,
  currency: BillingCurrencySchema,
  billingPeriod: BillingCheckoutPeriodSchema,
  paymentMethod: Schema.optional(BillingPaymentMethodSchema)
});
export type BillingCheckoutRequest = typeof BillingCheckoutRequestSchema.Type;

export const BillingCheckoutResponseSchema = Schema.Struct({
  url: Schema.String,
  intentId: Schema.String,
  gateway: Schema.Literal("stripe", "asaas")
});
export type BillingCheckoutResponse = typeof BillingCheckoutResponseSchema.Type;

export const BillingEntitlementViewSchema = Schema.Struct({
  planId: Schema.String,
  tier: Schema.String,
  status: Schema.String,
  availableCredits: Schema.Number,
  monthlyCreditsRemaining: Schema.Number,
  canonicalCreditCost: Schema.Number,
  quotaRemaining: Schema.Number,
  quotaLimit: Schema.Number,
  currency: Schema.optional(BillingCurrencySchema)
});
export type BillingEntitlementView = typeof BillingEntitlementViewSchema.Type;

export const decodeBillingCheckoutRequest = createSchemaDecoder(
  "BillingCheckoutRequest",
  BillingCheckoutRequestSchema
);
export const decodeBillingCheckoutResponse = createSchemaDecoder(
  "BillingCheckoutResponse",
  BillingCheckoutResponseSchema
);
export const decodeBillingEntitlementView = createSchemaDecoder(
  "BillingEntitlementView",
  BillingEntitlementViewSchema
);
