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

export const BillingSubscriptionStatusSchema = Schema.Literal(
  "trialing", // free trial ativo (signup + 7d / 5 gerações)
  "active", // assinatura paga vigente
  "past_due", // dunning — cobrança falhou; créditos seguem valendo (ADR 0006 §5)
  "canceled", // cancelada MAS ainda no ciclo pago — acesso até accessUntil, reativável
  "lapsed" // período acabou → paywall (terminal p/ acesso; ex-trial OU ex-assinante)
);
export type BillingSubscriptionStatus = typeof BillingSubscriptionStatusSchema.Type;

export const BillingGenerationGateSchema = Schema.Literal(
  "ok", // canGenerate = true
  "no_credits", // tem acesso vivo mas availableCredits === 0
  "trial_expired", // trial esgotou (5 gerações ou dia 7)
  "past_due", // dunning E sem créditos
  "lapsed" // assinatura lapsou (ex-assinante, pós-ciclo)
);
export type BillingGenerationGate = typeof BillingGenerationGateSchema.Type;

export const BillingPaymentMethodInfoSchema = Schema.Struct({
  kind: BillingPaymentMethodSchema,
  brandLast4: Schema.optional(Schema.String),
  gateway: Schema.Literal("asaas", "stripe")
});
export type BillingPaymentMethodInfo = typeof BillingPaymentMethodInfoSchema.Type;

// contrato #6 (ciclo de vida) — flags por gateway×estado; a UI ramifica Stripe(portal)×ASAAS(in-app).
export const BillingManagementSchema = Schema.Struct({
  canManageViaPortal: Schema.Boolean,
  canCancel: Schema.Boolean,
  canReactivate: Schema.Boolean,
  canChangeMethod: Schema.Boolean,
  canRegularize: Schema.Boolean,
  regularizeUrl: Schema.NullOr(Schema.String)
});
export type BillingManagement = typeof BillingManagementSchema.Type;

export const BillingEntitlementViewSchema = Schema.Struct({
  planId: Schema.String,
  tier: Schema.String,
  availableCredits: Schema.Number,
  monthlyCreditsRemaining: Schema.Number,
  canonicalCreditCost: Schema.Number,
  quotaRemaining: Schema.Number,
  quotaLimit: Schema.Number,
  currency: Schema.optional(BillingCurrencySchema),

  status: BillingSubscriptionStatusSchema,

  canGenerate: Schema.Boolean,
  canRefine: Schema.Boolean,
  gate: BillingGenerationGateSchema,

  trialEndsAt: Schema.optional(Schema.String),
  renewsAt: Schema.optional(Schema.String),
  accessUntil: Schema.optional(Schema.String),

  paymentMethod: Schema.NullOr(BillingPaymentMethodInfoSchema),
  management: BillingManagementSchema
});
export type BillingEntitlementView = typeof BillingEntitlementViewSchema.Type;

// N2 — retorno de checkout: intentId viaja na URL só como handle, este endpoint é a verdade de servidor.
export const BillingPortalSessionResponseSchema = Schema.Struct({ url: Schema.String });
export type BillingPortalSessionResponse = typeof BillingPortalSessionResponseSchema.Type;

export const CheckoutStatusSchema = Schema.Literal("pending", "success", "failed");
export type CheckoutStatus = typeof CheckoutStatusSchema.Type;

export const CheckoutStatusViewSchema = Schema.Struct({
  status: CheckoutStatusSchema,
  planId: Schema.optional(Schema.String),
  paymentMethod: Schema.optional(BillingPaymentMethodSchema)
});
export type CheckoutStatusView = typeof CheckoutStatusViewSchema.Type;

// preço de um período — o −20% anual já vem calculado do backend
export const BillingPlanPeriodPriceSchema = Schema.Struct({
  amountCents: Schema.Number, // menor unidade, consistente com BillingTopUpPackage.priceCents
  per: Schema.Literal("month"), // sempre "/mês" (anual = mensal-equivalente pós-desconto)
  annualTotalCents: Schema.optional(Schema.Number), // só no período annual: total cobrado no ano
  internalRef: Schema.String // bare plan id (ex.: "explorador") — o front repassa verbatim em
  // POST /me/billing/checkout junto com currency/billingPeriod (campos separados, não parte da
  // string); casa com billing_gateway_catalog.internal_ref. NÃO é "{planId}_{period}_{currency}"
  // apesar do que a ADR 0006 §4 descreveu — aquele composite nunca foi implementado no schema.
});
export type BillingPlanPeriodPrice = typeof BillingPlanPeriodPriceSchema.Type;

export const BillingPlanPeriodPricesSchema = Schema.Struct({
  monthly: BillingPlanPeriodPriceSchema,
  annual: BillingPlanPeriodPriceSchema
});
export type BillingPlanPeriodPrices = typeof BillingPlanPeriodPricesSchema.Type;

// Struct por moeda (não Record<literal>) para type-safety no consumo do SDK
export const BillingPlanPricesSchema = Schema.Struct({
  BRL: BillingPlanPeriodPricesSchema,
  USD: BillingPlanPeriodPricesSchema
});
export type BillingPlanPrices = typeof BillingPlanPricesSchema.Type;

export const BillingPlanViewSchema = Schema.Struct({
  id: Schema.Literal("explorador", "criador", "profissional"), // catálogo = 3 tiers pagos (trial não é card)
  tier: Schema.String,
  name: Schema.String,
  tag: Schema.optional(Schema.String), // "mais escolhido" — badge do featured
  monthlyGenerations: Schema.Number, // aproximação: resolveQuotaLimit(monthlyCredits, canonicalCreditCost)
  monthlyCredits: Schema.Number,
  featured: Schema.Boolean,
  features: Schema.Array(Schema.String), // bullets humanos localizados
  prices: BillingPlanPricesSchema,
  current: Schema.optional(Schema.Boolean) // true só na variante /me/
});
export type BillingPlanView = typeof BillingPlanViewSchema.Type;

export const PlanCatalogViewSchema = Schema.Struct({
  plans: Schema.Array(BillingPlanViewSchema),
  generationsDisclaimer: Schema.String // literal obrigatório — backend-owned, o front não inventa
});
export type PlanCatalogView = typeof PlanCatalogViewSchema.Type;

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
export const decodePlanCatalogView = createSchemaDecoder("PlanCatalogView", PlanCatalogViewSchema);
export const decodeBillingPortalSessionResponse = createSchemaDecoder(
  "BillingPortalSessionResponse",
  BillingPortalSessionResponseSchema
);
export const decodeCheckoutStatusView = createSchemaDecoder("CheckoutStatusView", CheckoutStatusViewSchema);
