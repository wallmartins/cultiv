import { Schema } from "effect";
import { createSchemaDecoder } from "./shared.js";
import { QualityModeSchema } from "./execution.js";

export const BillingLedgerEntryTypeSchema = Schema.Literal(
  "grant_cycle",
  "grant_rollover",
  "grant_topup",
  "reserve",
  "capture",
  "release",
  "refund",
  "expire"
);
export type BillingLedgerEntryType = typeof BillingLedgerEntryTypeSchema.Type;

export const BillingReferenceTypeSchema = Schema.Literal(
  "subscription_cycle",
  "generation_cycle",
  "topup",
  "manual_adjustment",
  "usage_record"
);
export type BillingReferenceType = typeof BillingReferenceTypeSchema.Type;

export const BillingRoundingSchema = Schema.Literal("ceil_1_decimal");
export type BillingRounding = typeof BillingRoundingSchema.Type;

export const BillingModeCreditPolicySchema = Schema.Struct({
  fast: Schema.Number,
  balanced: Schema.Number,
  strict: Schema.Number
});
export type BillingModeCreditPolicy = typeof BillingModeCreditPolicySchema.Type;

export const BillingCreditPolicySchema = Schema.Struct({
  baseCredits: BillingModeCreditPolicySchema,
  retrySurcharge: BillingModeCreditPolicySchema,
  rounding: BillingRoundingSchema,
  rolloverPercent: Schema.Number,
  rolloverCap: Schema.Number
});
export type BillingCreditPolicy = typeof BillingCreditPolicySchema.Type;

export const BillingLedgerEntrySchema = Schema.Struct({
  subscriptionId: Schema.String,
  accountId: Schema.String,
  entryType: BillingLedgerEntryTypeSchema,
  creditsDelta: Schema.Number,
  balanceAfter: Schema.Number,
  referenceType: BillingReferenceTypeSchema,
  referenceId: Schema.String,
  idempotencyKey: Schema.String,
  metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  createdAt: Schema.String
});
export type BillingLedgerEntry = typeof BillingLedgerEntrySchema.Type;

export const BillingGenerationReservationStatusSchema = Schema.Literal("reserved", "captured", "released");
export type BillingGenerationReservationStatus = typeof BillingGenerationReservationStatusSchema.Type;

export const BillingGenerationReservationSchema = Schema.Struct({
  reservationId: Schema.String,
  generationCycleId: Schema.String,
  subscriptionId: Schema.String,
  accountId: Schema.String,
  qualityMode: QualityModeSchema,
  retryCount: Schema.Number,
  reservedCredits: Schema.Number,
  status: BillingGenerationReservationStatusSchema,
  idempotencyKey: Schema.String,
  metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  createdAt: Schema.String,
  updatedAt: Schema.String
});
export type BillingGenerationReservation = typeof BillingGenerationReservationSchema.Type;

export const BillingWalletSchema = Schema.Struct({
  accountId: Schema.String,
  subscriptionId: Schema.String,
  activeCycleId: Schema.NullOr(Schema.String),
  availableCredits: Schema.Number,
  reservedCredits: Schema.Number,
  pendingCredits: Schema.Number,
  lifetimeGrantedCredits: Schema.Number,
  lifetimeDebitedCredits: Schema.Number
});
export type BillingWallet = typeof BillingWalletSchema.Type;

export const BillingTopUpPackageSchema = Schema.Struct({
  id: Schema.String,
  credits: Schema.Number,
  priceCents: Schema.Number,
  currency: Schema.String,
  description: Schema.optional(Schema.String)
});
export type BillingTopUpPackage = typeof BillingTopUpPackageSchema.Type;

export const BillingTopUpCatalogViewSchema = Schema.Struct({
  packages: Schema.Array(BillingTopUpPackageSchema)
});
export type BillingTopUpCatalogView = typeof BillingTopUpCatalogViewSchema.Type;

export const BillingCycleStateSchema = Schema.Struct({
  cycleId: Schema.String,
  subscriptionId: Schema.String,
  accountId: Schema.String,
  openedAt: Schema.String,
  closedAt: Schema.NullOr(Schema.String),
  rolloverCredits: Schema.Number,
  grantedCredits: Schema.Number,
  expiredCredits: Schema.Number
});
export type BillingCycleState = typeof BillingCycleStateSchema.Type;

export const LedgerStatementCategorySchema = Schema.Literal(
  "monthly_credits",
  "rollover",
  "topup",
  "generation",
  "refund",
  "expiration"
);
export type LedgerStatementCategory = typeof LedgerStatementCategorySchema.Type;

export const LedgerStatementRowSchema = Schema.Struct({
  id: Schema.String,
  category: LedgerStatementCategorySchema,
  creditsDelta: Schema.Number,
  occurredAt: Schema.String,
  planName: Schema.optional(Schema.String),
  topic: Schema.optional(Schema.String),
  note: Schema.optional(Schema.String)
});
export type LedgerStatementRow = typeof LedgerStatementRowSchema.Type;

export const LedgerStatementViewSchema = Schema.Struct({
  items: Schema.Array(LedgerStatementRowSchema),
  total: Schema.Number,
  limit: Schema.Number,
  offset: Schema.Number
});
export type LedgerStatementView = typeof LedgerStatementViewSchema.Type;

export const decodeBillingLedgerEntry = createSchemaDecoder("BillingLedgerEntry", BillingLedgerEntrySchema);
export const decodeBillingWallet = createSchemaDecoder("BillingWallet", BillingWalletSchema);
export const decodeBillingGenerationReservation = createSchemaDecoder(
  "BillingGenerationReservation",
  BillingGenerationReservationSchema
);
export const decodeBillingTopUpCatalogView = createSchemaDecoder(
  "BillingTopUpCatalogView",
  BillingTopUpCatalogViewSchema
);
export const decodeLedgerStatementView = createSchemaDecoder("LedgerStatementView", LedgerStatementViewSchema);
