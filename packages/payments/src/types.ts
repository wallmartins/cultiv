import type {
  BillingCreditPolicy,
  BillingCurrency,
  BillingCycleState,
  BillingGenerationGate,
  BillingGenerationReservation,
  BillingLedgerEntry,
  BillingPaymentMethodInfo,
  BillingTopUpPackage,
  BillingWallet,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import type { Effect } from "effect";
import type {
  BillingEntitlementNotFoundError,
  BillingGatewayError,
  BillingInsufficientCreditsError,
  BillingOperationConflictError,
  BillingPlanInvalidError,
  BillingPlanNotFoundError,
  BillingReservationNotFoundError,
  BillingSubscriptionInactiveError,
  BillingTopUpPackageNotFoundError
} from "./errors.js";
import type {
  BillingGatewayAdapter,
  BillingGatewayChargeRequest,
  BillingGatewayChargeResult
} from "./gateway/types.js";
import type { BillingPlanStatus, BillingPlanTier } from "./quality-mode-entitlements.js";

export type BillingUsageKind = "generation" | "refinement" | "chat" | "inference";

export interface BillingFeatureAllowance {
  readonly key: string;
  readonly enabled: boolean;
  readonly limit?: number;
}

export interface BillingPlanPeriodPriceDefinition {
  readonly monthlyCents: number; // canonical monthly price; annual (-20%) is derived in plan-catalog.ts
}

export interface BillingPlanDefinition {
  readonly id: string;
  readonly tier: BillingPlanTier;
  readonly name: string;
  readonly description?: string;
  readonly monthlyCredits: number;
  readonly dailyCredits?: number;
  readonly features: readonly BillingFeatureAllowance[];
  readonly allowedModels?: readonly string[];
  readonly currency?: BillingCurrency;
  readonly featured?: boolean;
  readonly prices?: {
    readonly BRL: BillingPlanPeriodPriceDefinition;
    readonly USD: BillingPlanPeriodPriceDefinition;
  };
}

export interface BillingSubscription {
  readonly id: string;
  readonly userId: string;
  readonly planId: string;
  readonly status: BillingPlanStatus;
  readonly startedAt: string;
  readonly renewedAt?: string;
  readonly expiresAt?: string; // fim do ciclo pago; dobra como accessUntil no gate
  readonly trialEndsAt?: string;
  readonly renewsAt?: string;
  readonly everSubscribed?: boolean;
}

export interface BillingUsageRecord {
  readonly id: string;
  readonly userId: string;
  readonly subscriptionId: string;
  readonly planId: string;
  readonly kind: BillingUsageKind;
  readonly amount: number;
  readonly credits: number;
  readonly createdAt: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface BillingEntitlement {
  readonly userId: string;
  readonly planId: string;
  readonly tier: BillingPlanTier;
  readonly status: BillingPlanStatus;
  readonly monthlyCreditsRemaining: number;
  readonly dailyCreditsRemaining: number | null;
  readonly canGenerate: boolean;
  readonly canRefine: boolean;
  readonly gate: BillingGenerationGate;
  readonly trialEndsAt?: string;
  readonly renewsAt?: string;
  readonly accessUntil?: string;
  readonly everSubscribed?: boolean;
  readonly paymentMethod: BillingPaymentMethodInfo | null;
  readonly allowedModels: readonly string[];
  readonly features: Readonly<Record<string, boolean>>;
  readonly wallet: BillingWallet;
  readonly activeCycleId: string | null;
}

export interface BillingOperationResult<T> {
  readonly operation: string;
  readonly idempotencyKey: string;
  readonly value: T;
}

export interface BillingReserveCreditsRequest {
  readonly userId: string;
  readonly planId: string;
  readonly generationCycleId: string;
  readonly qualityMode: QualityMode;
  readonly retryCount: number;
  readonly creditPriceOverride?: number;
  readonly idempotencyKey: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface BillingCaptureCreditsRequest {
  readonly reservationId: string;
  readonly idempotencyKey: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface BillingReleaseCreditsRequest {
  readonly reservationId: string;
  readonly idempotencyKey: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface BillingStartCycleRequest {
  readonly userId: string;
  readonly planId: string;
  readonly cycleId: string;
  readonly idempotencyKey: string;
}

export interface BillingPurchaseTopUpRequest {
  readonly userId: string;
  readonly planId: string;
  readonly packageId: string;
  readonly idempotencyKey: string;
  readonly chargeRequest: BillingGatewayChargeRequest;
  readonly skipGatewayCharge?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface BillingRepository {
  readonly plans: Map<string, BillingPlanDefinition>;
  readonly subscriptions: Map<string, BillingSubscription>;
  readonly usage: BillingUsageRecord[];
  readonly ledger: BillingLedgerEntry[];
  readonly topUpPackages: Map<string, BillingTopUpPackage>;
  readonly reservations: Map<string, BillingGenerationReservation>;
  readonly cycleStates: Map<string, BillingCycleState>;
  readonly idempotency: Map<string, BillingOperationResult<unknown>>;
}

export interface BillingServiceContract {
  readonly registerPlan: (plan: BillingPlanDefinition) => Effect.Effect<BillingPlanDefinition, BillingPlanInvalidError>;
  readonly upsertSubscription: (subscription: BillingSubscription) => BillingSubscription;
  readonly getSubscription: (userId: string, planId: string) => BillingSubscription | undefined;
  readonly recordUsage: (usage: BillingUsageRecord) => BillingUsageRecord;
  readonly getEntitlement: (userId: string, planId?: string) => BillingEntitlement | undefined;
  readonly getWallet: (userId: string, planId?: string) => BillingWallet | undefined;
  readonly consumeCredits: (
    userId: string,
    planId: string,
    amount: number,
    kind: BillingUsageKind
  ) => Effect.Effect<
    BillingEntitlement,
    | BillingPlanNotFoundError
    | BillingEntitlementNotFoundError
    | BillingSubscriptionInactiveError
    | BillingInsufficientCreditsError
  >;
  readonly quoteDebitForMode: (mode: QualityMode, retryCount?: number) => number;
  readonly startCycle: (
    request: BillingStartCycleRequest
  ) => Effect.Effect<
    BillingOperationResult<BillingCycleState>,
    BillingPlanNotFoundError | BillingEntitlementNotFoundError | BillingOperationConflictError
  >;
  readonly reserveGenerationCredits: (
    request: BillingReserveCreditsRequest
  ) => Effect.Effect<
    BillingOperationResult<BillingGenerationReservation>,
    | BillingPlanNotFoundError
    | BillingEntitlementNotFoundError
    | BillingSubscriptionInactiveError
    | BillingInsufficientCreditsError
    | BillingOperationConflictError
  >;
  readonly captureReservedCredits: (
    request: BillingCaptureCreditsRequest
  ) => Effect.Effect<
    BillingOperationResult<BillingGenerationReservation>,
    BillingReservationNotFoundError | BillingOperationConflictError
  >;
  readonly releaseReservedCredits: (
    request: BillingReleaseCreditsRequest
  ) => Effect.Effect<
    BillingOperationResult<BillingGenerationReservation>,
    BillingReservationNotFoundError | BillingOperationConflictError
  >;
  readonly registerTopUpPackage: (pkg: BillingTopUpPackage) => BillingTopUpPackage;
  readonly listTopUpPackages: () => readonly BillingTopUpPackage[];
  readonly purchaseTopUp: (
    request: BillingPurchaseTopUpRequest
  ) => Effect.Effect<
    BillingOperationResult<{ readonly charge: BillingGatewayChargeResult; readonly wallet: BillingWallet | undefined }>,
    | BillingPlanNotFoundError
    | BillingEntitlementNotFoundError
    | BillingTopUpPackageNotFoundError
    | BillingOperationConflictError
    | BillingGatewayError
  >;
  readonly charge: (request: BillingGatewayChargeRequest) => Effect.Effect<BillingGatewayChargeResult, BillingGatewayError>;
  readonly listPlans: () => readonly BillingPlanDefinition[];
  readonly getPrimarySubscriptionPlanId: (userId: string) => string | undefined;
  readonly listUsage: (userId?: string) => readonly BillingUsageRecord[];
  readonly listLedger: (userId?: string, planId?: string) => readonly BillingLedgerEntry[];
  readonly listReservations: (userId?: string, planId?: string) => readonly BillingGenerationReservation[];
}

export interface BillingServiceOptions {
  readonly gateway?: BillingGatewayAdapter;
  readonly repository?: BillingRepository;
  readonly clock?: BillingClock;
  readonly creditPolicy?: BillingCreditPolicy;
}

export interface BillingClock {
  readonly now: () => Date;
}
