import { Context, Effect, Layer } from "effect";
import type {
  BillingCreditPolicy,
  BillingCycleState,
  BillingGenerationReservation,
  BillingLedgerEntry,
  BillingLedgerEntryType,
  BillingReferenceType,
  BillingTopUpPackage,
  BillingWallet,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import {
  BillingCheckoutCatalogNotFoundError,
  BillingEntitlementNotFoundError,
  BillingGatewayError,
  BillingGatewayWebhookVerificationError,
  BillingInsufficientCreditsError,
  BillingOperationConflictError,
  BillingPlanInvalidError,
  BillingPlanNotFoundError,
  BillingReservationNotFoundError,
  BillingSubscriptionInactiveError,
  BillingTopUpPackageNotFoundError
} from "./errors.js";

export {
  BillingCheckoutCatalogNotFoundError,
  BillingEntitlementNotFoundError,
  BillingGatewayError,
  BillingGatewayWebhookVerificationError,
  BillingInsufficientCreditsError,
  BillingOperationConflictError,
  BillingPlanInvalidError,
  BillingPlanNotFoundError,
  BillingReservationNotFoundError,
  BillingSubscriptionInactiveError,
  BillingTopUpPackageNotFoundError
} from "./errors.js";

export type { BillingPlanTier, BillingPlanStatus } from "./quality-mode-entitlements.js";
export {
  canUseQualityMode,
  hasActiveBillingSubscription,
  resolveAllowedQualityModes,
  resolveMinimumPlanTierForQualityMode
} from "./quality-mode-entitlements.js";
import type { BillingPlanStatus, BillingPlanTier } from "./quality-mode-entitlements.js";
import type {
  BillingGatewayName,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  GatewayWebhookEvent
} from "./gateway/types.js";
import { createManualGateway } from "./gateway/manual-adapter.js";
export type BillingUsageKind = "generation" | "refinement" | "chat" | "inference";
export type {
  BillingCheckoutPeriod,
  BillingCurrency,
  BillingGatewayName,
  BillingProductKind,
  CheckoutSessionRequest,
  CheckoutSessionResult,
  GatewayWebhookEvent,
  GatewayWebhookEventType
} from "./gateway/types.js";
export { resolveGatewayForCurrency } from "./gateway/router.js";
export { createStripeGatewayAdapter, mapStripeEvent } from "./gateway/stripe-adapter.js";

export interface BillingFeatureAllowance {
  readonly key: string;
  readonly enabled: boolean;
  readonly limit?: number;
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
}

export interface BillingSubscription {
  readonly id: string;
  readonly userId: string;
  readonly planId: string;
  readonly status: BillingPlanStatus;
  readonly startedAt: string;
  readonly renewedAt?: string;
  readonly expiresAt?: string;
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
  readonly allowedModels: readonly string[];
  readonly features: Readonly<Record<string, boolean>>;
  readonly wallet: BillingWallet;
  readonly activeCycleId: string | null;
}

export interface BillingGatewayChargeRequest {
  readonly userId: string;
  readonly subscriptionId: string;
  readonly amount: number;
  readonly currency: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface BillingGatewayChargeResult {
  readonly gateway: BillingGatewayName;
  readonly transactionId: string;
  readonly status: "paid" | "pending" | "failed";
  readonly raw?: unknown;
}

export interface BillingGatewayAdapter {
  readonly name: BillingGatewayName;
  createCheckoutSession?(
    request: CheckoutSessionRequest
  ): Effect.Effect<CheckoutSessionResult, BillingGatewayError>;
  parseWebhook?(
    payload: unknown,
    signature: string
  ): Effect.Effect<GatewayWebhookEvent, BillingGatewayWebhookVerificationError>;
  charge(request: BillingGatewayChargeRequest): Effect.Effect<BillingGatewayChargeResult, BillingGatewayError>;
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

export class BillingService extends Context.Tag("BillingService")<BillingService, BillingServiceContract>() {}

export const DEFAULT_BILLING_CREDIT_POLICY: BillingCreditPolicy = {
  baseCredits: {
    fast: 1,
    balanced: 2.5,
    strict: 10
  },
  retrySurcharge: {
    fast: 0,
    balanced: 0.75,
    strict: 1.5
  },
  rounding: "ceil_1_decimal",
  rolloverPercent: 0.25,
  rolloverCap: 100
};

export const DEFAULT_BILLING_PLANS: readonly BillingPlanDefinition[] = [
  {
    id: "free",
    tier: "free",
    name: "Free",
    monthlyCredits: 50,
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: false }
    ],
    allowedModels: ["llama3.1", "gpt-4o-mini"]
  },
  {
    id: "pro",
    tier: "pro",
    name: "Pro",
    monthlyCredits: 2500,
    dailyCredits: 300,
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: true },
      { key: "rollout.beta.access", enabled: true }
    ],
    allowedModels: ["gpt-4o-mini", "gpt-4.1", "claude-3-5-sonnet"]
  }
];

export function createBillingRepository(seed: {
  readonly plans?: readonly BillingPlanDefinition[];
  readonly subscriptions?: readonly BillingSubscription[];
  readonly usage?: readonly BillingUsageRecord[];
  readonly ledger?: readonly BillingLedgerEntry[];
  readonly topUpPackages?: readonly BillingTopUpPackage[];
  readonly reservations?: readonly BillingGenerationReservation[];
  readonly cycleStates?: readonly BillingCycleState[];
} = {}): BillingRepository {
  return {
    plans: new Map((seed.plans ?? DEFAULT_BILLING_PLANS).map((plan) => [plan.id, plan] as const)),
    subscriptions: new Map((seed.subscriptions ?? []).map((subscription) => [subscription.id, subscription] as const)),
    usage: [...(seed.usage ?? [])],
    ledger: [...(seed.ledger ?? [])],
    topUpPackages: new Map((seed.topUpPackages ?? []).map((pkg) => [pkg.id, pkg] as const)),
    reservations: new Map((seed.reservations ?? []).map((reservation) => [reservation.reservationId, reservation] as const)),
    cycleStates: new Map((seed.cycleStates ?? []).map((state) => [state.accountId, state] as const)),
    idempotency: new Map()
  };
}

export function createBillingService(options: BillingServiceOptions = {}): BillingServiceContract {
  const repository = options.repository ?? createBillingRepository();
  const gateway = options.gateway ?? createManualGateway();
  const clock = options.clock ?? createSystemClock();
  const creditPolicy = options.creditPolicy ?? DEFAULT_BILLING_CREDIT_POLICY;

  const getEntitlementFor = (userId: string, planId?: string) =>
    createEntitlementFromRepository(repository, userId, planId, clock.now());

  return {
    registerPlan(plan) {
      return Effect.map(validatePlan(plan), (validated) => {
        repository.plans.set(validated.id, validated);
        return validated;
      });
    },
    upsertSubscription(subscription) {
      repository.subscriptions.set(subscription.id, subscription);
      return subscription;
    },
    recordUsage(usage) {
      repository.usage.push(usage);
      return usage;
    },
    getEntitlement(userId, planId?) {
      const resolvedPlanId = planId ?? findPrimarySubscription(repository, userId)?.planId;
      if (!resolvedPlanId) {
        return undefined;
      }

      return getEntitlementFor(userId, resolvedPlanId);
    },
    getWallet(userId, planId = resolveDefaultPlanId(repository)) {
      return createWalletFromRepository(repository, userId, planId);
    },
    consumeCredits(userId, planId, amount, kind) {
      const subscription = findSubscription(repository, userId, planId);
      if (!subscription) {
        return Effect.fail(new BillingEntitlementNotFoundError({ userId, planId }));
      }

      const wallet = createWalletFromRepository(repository, userId, planId);
      if (!wallet) {
        return Effect.fail(new BillingEntitlementNotFoundError({ userId, planId }));
      }

      if (subscription.status !== "active") {
        return Effect.fail(new BillingSubscriptionInactiveError({ userId, planId }));
      }

      if (wallet.availableCredits < amount) {
        return Effect.fail(new BillingInsufficientCreditsError({ userId, planId, amount }));
      }

      appendLedgerEntry(repository, {
        subscriptionId: subscription.id,
        accountId: wallet.accountId,
        entryType: "capture",
        creditsDelta: -amount,
        referenceType: "usage_record",
        referenceId: createUsageId(userId, planId, kind),
        idempotencyKey: createUsageId(userId, planId, kind),
        metadata: {
          kind,
          source: "consumeCredits"
        },
        createdAt: clock.now().toISOString()
      });

      repository.usage.push({
        id: createUsageId(userId, planId, kind),
        userId,
        subscriptionId: subscription.id,
        planId,
        kind,
        amount,
        credits: amount,
        createdAt: clock.now().toISOString(),
        metadata: {
          source: "consumeCredits"
        }
      });

      return Effect.succeed(getEntitlementFor(userId, planId) as BillingEntitlement);
    },
    quoteDebitForMode(mode, retryCount = 0) {
      return calculateDebitForMode(mode, retryCount, creditPolicy);
    },
    startCycle(request) {
      return rememberOperation(repository, "startCycle", request.idempotencyKey, () =>
        Effect.gen(function* () {
          const plan = repository.plans.get(request.planId);
          if (!plan) {
            return yield* Effect.fail(new BillingPlanNotFoundError({ planId: request.planId }));
          }

          const subscription = findSubscription(repository, request.userId, request.planId);
          if (!subscription) {
            return yield* Effect.fail(new BillingEntitlementNotFoundError({ userId: request.userId, planId: request.planId }));
          }

          const accountId = createAccountId(request.userId, request.planId);
          const openedAt = clock.now().toISOString();
          const previousState = repository.cycleStates.get(accountId);
          let rolloverCredits = 0;
          let expiredCredits = 0;

          if (previousState && previousState.closedAt === null) {
            const wallet = createWalletFromRepository(repository, request.userId, request.planId);
            const remaining = wallet?.availableCredits ?? 0;
            rolloverCredits = calculateRolloverCredits(remaining, creditPolicy);
            expiredCredits = remaining;

            if (remaining > 0) {
              appendLedgerEntry(repository, {
                subscriptionId: subscription.id,
                accountId,
                entryType: "expire",
                creditsDelta: -remaining,
                referenceType: "subscription_cycle",
                referenceId: previousState.cycleId,
                idempotencyKey: `${request.idempotencyKey}:expire`,
                metadata: {
                  nextCycleId: request.cycleId
                },
                createdAt: openedAt
              });
            }
          }

          if (rolloverCredits > 0) {
            appendLedgerEntry(repository, {
              subscriptionId: subscription.id,
              accountId,
              entryType: "grant_rollover",
              creditsDelta: rolloverCredits,
              referenceType: "subscription_cycle",
              referenceId: request.cycleId,
              idempotencyKey: `${request.idempotencyKey}:rollover`,
              metadata: {
                sourceCycleId: previousState?.cycleId ?? null
              },
              createdAt: openedAt
            });
          }

          appendLedgerEntry(repository, {
            subscriptionId: subscription.id,
            accountId,
            entryType: "grant_cycle",
            creditsDelta: plan.monthlyCredits,
            referenceType: "subscription_cycle",
            referenceId: request.cycleId,
            idempotencyKey: `${request.idempotencyKey}:grant_cycle`,
            metadata: {
              planId: plan.id
            },
            createdAt: openedAt
          });

          const cycleState: BillingCycleState = {
            cycleId: request.cycleId,
            subscriptionId: subscription.id,
            accountId,
            openedAt,
            closedAt: null,
            rolloverCredits,
            grantedCredits: plan.monthlyCredits,
            expiredCredits
          };
          repository.cycleStates.set(accountId, cycleState);
          return cycleState;
        })
      );
    },
    reserveGenerationCredits(request) {
      return rememberOperation(repository, "reserveGenerationCredits", request.idempotencyKey, () =>
        Effect.gen(function* () {
          const subscription = findSubscription(repository, request.userId, request.planId);
          if (!subscription) {
            return yield* Effect.fail(
              new BillingEntitlementNotFoundError({ userId: request.userId, planId: request.planId })
            );
          }

          if (subscription.status !== "active") {
            return yield* Effect.fail(
              new BillingSubscriptionInactiveError({ userId: request.userId, planId: request.planId })
            );
          }

          const wallet = createWalletFromRepository(repository, request.userId, request.planId);
          if (!wallet) {
            return yield* Effect.fail(
              new BillingEntitlementNotFoundError({ userId: request.userId, planId: request.planId })
            );
          }

          const debit = request.creditPriceOverride ?? calculateDebitForMode(request.qualityMode, request.retryCount, creditPolicy);
          if (wallet.availableCredits < debit) {
            return yield* Effect.fail(
              new BillingInsufficientCreditsError({
                userId: request.userId,
                planId: request.planId,
                amount: debit
              })
            );
          }

          appendLedgerEntry(repository, {
            subscriptionId: subscription.id,
            accountId: wallet.accountId,
            entryType: "reserve",
            creditsDelta: -debit,
            referenceType: "generation_cycle",
            referenceId: request.generationCycleId,
            idempotencyKey: request.idempotencyKey,
            metadata: {
              qualityMode: request.qualityMode,
              retryCount: request.retryCount,
              creditPriceOverride: request.creditPriceOverride,
              ...request.metadata
            },
            createdAt: clock.now().toISOString()
          });

          const reservation: BillingGenerationReservation = {
            reservationId: createReservationId(request.generationCycleId),
            generationCycleId: request.generationCycleId,
            subscriptionId: subscription.id,
            accountId: wallet.accountId,
            qualityMode: request.qualityMode,
            retryCount: request.retryCount,
            reservedCredits: debit,
            status: "reserved",
            idempotencyKey: request.idempotencyKey,
            metadata: request.metadata ?? {},
            createdAt: clock.now().toISOString(),
            updatedAt: clock.now().toISOString()
          };
          repository.reservations.set(reservation.reservationId, reservation);
          return reservation;
        })
      );
    },
    captureReservedCredits(request) {
      return rememberOperation(repository, "captureReservedCredits", request.idempotencyKey, () =>
        Effect.gen(function* () {
          const reservation = repository.reservations.get(request.reservationId);
          if (!reservation) {
            return yield* Effect.fail(new BillingReservationNotFoundError({ reservationId: request.reservationId }));
          }

          const next: BillingGenerationReservation = {
            ...reservation,
            status: "captured",
            updatedAt: clock.now().toISOString(),
            metadata: {
              ...reservation.metadata,
              ...request.metadata
            }
          };

          repository.reservations.set(next.reservationId, next);
          appendLedgerEntry(repository, {
            subscriptionId: next.subscriptionId,
            accountId: next.accountId,
            entryType: "capture",
            creditsDelta: 0,
            referenceType: "generation_cycle",
            referenceId: next.generationCycleId,
            idempotencyKey: request.idempotencyKey,
            metadata: {
              reservationId: next.reservationId,
              reservedCredits: next.reservedCredits,
              ...request.metadata
            },
            createdAt: next.updatedAt
          });

          repository.usage.push({
            id: `${next.reservationId}:capture`,
            userId: extractUserIdFromAccountId(next.accountId),
            subscriptionId: next.subscriptionId,
            planId: extractPlanIdFromAccountId(next.accountId),
            kind: "generation",
            amount: next.reservedCredits,
            credits: next.reservedCredits,
            createdAt: next.updatedAt,
            metadata: {
              creditPriceOverride:
                typeof next.metadata?.creditPriceOverride === "number" ? next.metadata.creditPriceOverride : undefined,
              qualityMode: next.qualityMode,
              retryCount: next.retryCount,
              reservationId: next.reservationId
            }
          });

          return next;
        })
      );
    },
    releaseReservedCredits(request) {
      return rememberOperation(repository, "releaseReservedCredits", request.idempotencyKey, () =>
        Effect.gen(function* () {
          const reservation = repository.reservations.get(request.reservationId);
          if (!reservation) {
            return yield* Effect.fail(new BillingReservationNotFoundError({ reservationId: request.reservationId }));
          }

          const next: BillingGenerationReservation = {
            ...reservation,
            status: "released",
            updatedAt: clock.now().toISOString(),
            metadata: {
              ...reservation.metadata,
              ...request.metadata
            }
          };

          repository.reservations.set(next.reservationId, next);
          appendLedgerEntry(repository, {
            subscriptionId: next.subscriptionId,
            accountId: next.accountId,
            entryType: "release",
            creditsDelta: next.reservedCredits,
            referenceType: "generation_cycle",
            referenceId: next.generationCycleId,
            idempotencyKey: request.idempotencyKey,
            metadata: {
              reservationId: next.reservationId,
              releasedCredits: next.reservedCredits,
              ...request.metadata
            },
            createdAt: next.updatedAt
          });

          return next;
        })
      );
    },
    registerTopUpPackage(pkg) {
      repository.topUpPackages.set(pkg.id, pkg);
      return pkg;
    },
    listTopUpPackages() {
      return Array.from(repository.topUpPackages.values());
    },
    purchaseTopUp(request) {
      return rememberOperation(repository, "purchaseTopUp", request.idempotencyKey, () =>
        Effect.gen(function* () {
          const plan = repository.plans.get(request.planId);
          if (!plan) {
            return yield* Effect.fail(new BillingPlanNotFoundError({ planId: request.planId }));
          }

          const subscription = findSubscription(repository, request.userId, request.planId);
          if (!subscription) {
            return yield* Effect.fail(
              new BillingEntitlementNotFoundError({ userId: request.userId, planId: request.planId })
            );
          }

          const topUpPackage = repository.topUpPackages.get(request.packageId);
          if (!topUpPackage) {
            return yield* Effect.fail(new BillingTopUpPackageNotFoundError({ packageId: request.packageId }));
          }

          const charge = yield* gateway.charge(request.chargeRequest);
          if (charge.status === "paid") {
            const accountId = createAccountId(request.userId, plan.id);
            appendLedgerEntry(repository, {
              subscriptionId: subscription.id,
              accountId,
              entryType: "grant_topup",
              creditsDelta: topUpPackage.credits,
              referenceType: "topup",
              referenceId: request.packageId,
              idempotencyKey: request.idempotencyKey,
              metadata: {
                transactionId: charge.transactionId,
                ...request.metadata
              },
              createdAt: clock.now().toISOString()
            });
          }

          return {
            charge,
            wallet: createWalletFromRepository(repository, request.userId, request.planId)
          };
        })
      );
    },
    charge(request) {
      return gateway.charge(request);
    },
    listPlans() {
      return Array.from(repository.plans.values());
    },
    getPrimarySubscriptionPlanId(userId) {
      return findPrimarySubscription(repository, userId)?.planId;
    },
    listUsage(userId) {
      return userId ? repository.usage.filter((entry) => entry.userId === userId) : [...repository.usage];
    },
    listLedger(userId, planId) {
      return repository.ledger.filter((entry) => {
        if (userId && extractUserIdFromAccountId(entry.accountId) !== userId) {
          return false;
        }
        if (planId && extractPlanIdFromAccountId(entry.accountId) !== planId) {
          return false;
        }
        return true;
      });
    },
    listReservations(userId, planId) {
      return Array.from(repository.reservations.values()).filter((reservation) => {
        if (userId && extractUserIdFromAccountId(reservation.accountId) !== userId) {
          return false;
        }
        if (planId && extractPlanIdFromAccountId(reservation.accountId) !== planId) {
          return false;
        }
        return true;
      });
    }
  };
}

export function createBillingServiceLayer(options: BillingServiceOptions = {}) {
  return Layer.succeed(BillingService, createBillingService(options));
}

export function withBilling<T>(effect: Effect.Effect<T>, options: BillingServiceOptions = {}) {
  return effect.pipe(Effect.provide(createBillingServiceLayer(options)));
}

export { createManualGateway };

export function createStripeGateway(): BillingGatewayAdapter {
  return {
    name: "stripe",
    createCheckoutSession: () =>
      Effect.fail(new BillingGatewayError({ gateway: "stripe", message: "checkout not implemented" })),
    parseWebhook: () =>
      Effect.fail(
        new BillingGatewayWebhookVerificationError({ gateway: "stripe", message: "webhook not implemented" })
      ),
    charge: (request) =>
      Effect.succeed({
        gateway: "stripe",
        transactionId: `stripe_${request.userId}_${request.subscriptionId}`,
        status: "paid",
        raw: request
      })
  };
}

export function createAsaasGateway(): BillingGatewayAdapter {
  return {
    name: "asaas",
    createCheckoutSession: () =>
      Effect.fail(new BillingGatewayError({ gateway: "asaas", message: "checkout not implemented" })),
    parseWebhook: () =>
      Effect.fail(
        new BillingGatewayWebhookVerificationError({ gateway: "asaas", message: "webhook not implemented" })
      ),
    charge: (request) =>
      Effect.succeed({
        gateway: "asaas",
        transactionId: `asaas_${request.userId}_${request.subscriptionId}`,
        status: "paid",
        raw: request
      })
  };
}

export function validatePlan(plan: BillingPlanDefinition): Effect.Effect<BillingPlanDefinition, BillingPlanInvalidError> {
  if (!plan.id || !plan.tier || !plan.name) {
    return Effect.fail(
      new BillingPlanInvalidError({
        message: "Billing plan must have id, tier and name"
      })
    );
  }
  if (plan.monthlyCredits < 0) {
    return Effect.fail(
      new BillingPlanInvalidError({
        planId: plan.id,
        message: `Billing plan "${plan.id}" cannot have negative monthly credits`
      })
    );
  }
  if (plan.dailyCredits !== undefined && plan.dailyCredits < 0) {
    return Effect.fail(
      new BillingPlanInvalidError({
        planId: plan.id,
        message: `Billing plan "${plan.id}" cannot have negative daily credits`
      })
    );
  }
  return Effect.succeed(plan);
}

export function defineBillingPlan(plan: BillingPlanDefinition): Effect.Effect<BillingPlanDefinition, BillingPlanInvalidError> {
  return validatePlan(plan);
}

export function createBillingEntitlement(
  plan: BillingPlanDefinition,
  subscription: BillingSubscription,
  usage: readonly BillingUsageRecord[] = [],
  referenceDate: Date = new Date()
): BillingEntitlement {
  const consumed = usage
    .filter((entry) => entry.planId === plan.id && entry.userId === subscription.userId)
    .reduce((total, entry) => total + entry.credits, 0);
  const dailyConsumed = usage
    .filter(
      (entry) =>
        entry.planId === plan.id &&
        entry.userId === subscription.userId &&
        isSameUtcDay(entry.createdAt, referenceDate)
    )
    .reduce((total, entry) => total + entry.credits, 0);

  const wallet: BillingWallet = {
    accountId: createAccountId(subscription.userId, plan.id),
    subscriptionId: subscription.id,
    activeCycleId: null,
    availableCredits: Math.max(0, plan.monthlyCredits - consumed),
    reservedCredits: 0,
    pendingCredits: 0,
    lifetimeGrantedCredits: plan.monthlyCredits,
    lifetimeDebitedCredits: consumed
  };

  return {
    userId: subscription.userId,
    planId: plan.id,
    tier: plan.tier,
    status: subscription.status,
    monthlyCreditsRemaining: wallet.availableCredits,
    dailyCreditsRemaining: plan.dailyCredits === undefined ? null : Math.max(0, plan.dailyCredits - dailyConsumed),
    canGenerate: subscription.status === "active" && wallet.availableCredits > 0,
    canRefine: subscription.status === "active" && hasFeature(plan, "content.language.refinement"),
    allowedModels: plan.allowedModels ?? [],
    features: Object.fromEntries(plan.features.map((feature) => [feature.key, feature.enabled])),
    wallet,
    activeCycleId: null
  };
}

export function listBillingFeatures(entitlement: BillingEntitlement): string[] {
  return Object.entries(entitlement.features)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
}

export function resolveDefaultPlanId(repository: BillingRepository): string {
  return repository.plans.has("pro") ? "pro" : repository.plans.keys().next().value ?? "free";
}

export function findSubscription(
  repository: BillingRepository,
  userId: string,
  planId: string
): BillingSubscription | undefined {
  return Array.from(repository.subscriptions.values()).find(
    (subscription) => subscription.userId === userId && subscription.planId === planId
  );
}

export function findPrimarySubscription(
  repository: BillingRepository,
  userId: string
): BillingSubscription | undefined {
  const subscriptions = Array.from(repository.subscriptions.values()).filter(
    (subscription) => subscription.userId === userId
  );

  if (subscriptions.length === 0) {
    return undefined;
  }

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "active");
  const pool = activeSubscriptions.length > 0 ? activeSubscriptions : subscriptions;

  return [...pool].sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];
}

export function createSubscriptionId(userId: string, planId: string): string {
  return `${userId}:${planId}:subscription`;
}

export const DEFAULT_FREE_PLAN_ID = "free";

export interface BillingActivationOptions {
  readonly now: () => Date;
  readonly idempotencyNamespace?: string;
}

export interface ActivateSubscriptionRequest extends BillingActivationOptions {
  readonly userId: string;
  readonly planId: string;
  readonly status?: BillingSubscription["status"];
  readonly startedAt?: string;
  readonly cycleId?: string;
}

function defaultBillingCycleId(userId: string, planId: string): string {
  return `${userId}:${planId}:cycle:default`;
}

function defaultBillingCycleIdempotencyKey(
  userId: string,
  planId: string,
  namespace: string
): string {
  return `${namespace}:${userId}:${planId}:default-cycle`;
}

export function ensureBillingCycleInitialized(
  billing: BillingServiceContract,
  userId: string,
  planId: string,
  options: BillingActivationOptions
): Effect.Effect<
  BillingEntitlement | undefined,
  BillingPlanNotFoundError | BillingEntitlementNotFoundError | BillingOperationConflictError
> {
  return Effect.gen(function* () {
    const plan = billing.listPlans().find((candidate) => candidate.id === planId);
    if (!plan) {
      return undefined;
    }

    const entitlement = billing.getEntitlement(userId, planId);
    if (!entitlement) {
      return undefined;
    }

    if (entitlement.status !== "active") {
      return entitlement;
    }

    if (entitlement.activeCycleId !== null) {
      return entitlement;
    }

    const namespace = options.idempotencyNamespace ?? "billing";
    yield* billing.startCycle({
      userId,
      planId,
      cycleId: defaultBillingCycleId(userId, planId),
      idempotencyKey: defaultBillingCycleIdempotencyKey(userId, planId, namespace)
    });

    return billing.getEntitlement(userId, planId);
  });
}

export function activateSubscription(
  billing: BillingServiceContract,
  request: ActivateSubscriptionRequest
): Effect.Effect<
  BillingEntitlement,
  BillingPlanNotFoundError | BillingEntitlementNotFoundError | BillingOperationConflictError
> {
  return Effect.gen(function* () {
    const plan = billing.listPlans().find((candidate) => candidate.id === request.planId);
    if (!plan) {
      return yield* Effect.fail(
        new BillingPlanNotFoundError({
          planId: request.planId
        })
      );
    }

    billing.upsertSubscription({
      id: createSubscriptionId(request.userId, request.planId),
      userId: request.userId,
      planId: request.planId,
      status: request.status ?? "active",
      startedAt: request.startedAt ?? request.now().toISOString()
    });

    const namespace = request.idempotencyNamespace ?? "billing";
    const entitlementBefore = billing.getEntitlement(request.userId, request.planId);
    if (entitlementBefore?.activeCycleId == null) {
      yield* billing.startCycle({
        userId: request.userId,
        planId: request.planId,
        cycleId: request.cycleId ?? defaultBillingCycleId(request.userId, request.planId),
        idempotencyKey: defaultBillingCycleIdempotencyKey(request.userId, request.planId, namespace)
      });
    }

    const entitlement = billing.getEntitlement(request.userId, request.planId);
    if (!entitlement) {
      return yield* Effect.fail(
        new BillingEntitlementNotFoundError({
          userId: request.userId,
          planId: request.planId
        })
      );
    }

    return entitlement;
  });
}

export function ensureDefaultFreeSubscription(
  billing: BillingServiceContract,
  userId: string,
  options: BillingActivationOptions
): Effect.Effect<
  BillingEntitlement | undefined,
  BillingPlanNotFoundError | BillingEntitlementNotFoundError | BillingOperationConflictError
> {
  return Effect.gen(function* () {
    const assignedPlanId = billing.getPrimarySubscriptionPlanId(userId);
    if (assignedPlanId) {
      return yield* ensureBillingCycleInitialized(billing, userId, assignedPlanId, options);
    }

    return yield* activateSubscription(billing, {
      userId,
      planId: DEFAULT_FREE_PLAN_ID,
      now: options.now,
      idempotencyNamespace: options.idempotencyNamespace
    });
  });
}

export function calculateDebitForMode(
  mode: QualityMode,
  retryCount = 0,
  creditPolicy: BillingCreditPolicy = DEFAULT_BILLING_CREDIT_POLICY
): number {
  const base = creditPolicy.baseCredits[mode];
  const surcharge = creditPolicy.retrySurcharge[mode];
  return roundCredits(base + retryCount * surcharge, creditPolicy.rounding);
}

export function calculateRolloverCredits(
  remainingCredits: number,
  creditPolicy: BillingCreditPolicy = DEFAULT_BILLING_CREDIT_POLICY
): number {
  return roundCredits(
    Math.min(remainingCredits * creditPolicy.rolloverPercent, creditPolicy.rolloverCap),
    creditPolicy.rounding
  );
}

function createWalletFromRepository(
  repository: BillingRepository,
  userId: string,
  planId: string
): BillingWallet | undefined {
  const subscription = findSubscription(repository, userId, planId);
  const plan = repository.plans.get(planId);
  if (!subscription) {
    return undefined;
  }

  const accountId = createAccountId(userId, planId);
  const ledger = repository.ledger.filter((entry) => entry.accountId === accountId);
  const reservations = Array.from(repository.reservations.values()).filter(
    (reservation) => reservation.accountId === accountId && reservation.status === "reserved"
  );
  const cycleState = repository.cycleStates.get(accountId);
  const baselineCredits = !cycleState && plan ? plan.monthlyCredits : 0;

  const availableCredits = roundCredits(baselineCredits + sumLedger(ledger), "ceil_1_decimal");

  return {
    accountId,
    subscriptionId: subscription.id,
    activeCycleId: cycleState?.cycleId ?? null,
    availableCredits,
    reservedCredits: reservations.reduce((total, reservation) => total + reservation.reservedCredits, 0),
    pendingCredits: 0,
    lifetimeGrantedCredits:
      baselineCredits + ledger.filter((entry) => entry.creditsDelta > 0).reduce((total, entry) => total + entry.creditsDelta, 0),
    lifetimeDebitedCredits: Math.abs(
      ledger.filter((entry) => entry.creditsDelta < 0).reduce((total, entry) => total + entry.creditsDelta, 0)
    )
  };
}

function createEntitlementFromRepository(
  repository: BillingRepository,
  userId: string,
  planId: string = resolveDefaultPlanId(repository),
  referenceDate: Date = new Date()
): BillingEntitlement | undefined {
  const plan = repository.plans.get(planId);
  const subscription = findSubscription(repository, userId, planId);
  if (!plan || !subscription) {
    return undefined;
  }

  const wallet = createWalletFromRepository(repository, userId, planId);
  if (!wallet) {
    return undefined;
  }

  const dailyCreditsRemaining =
    plan.dailyCredits === undefined
      ? null
      : Math.max(
          0,
          plan.dailyCredits -
            repository.usage
              .filter(
                (entry) =>
                  entry.userId === userId && entry.planId === planId && isSameUtcDay(entry.createdAt, referenceDate)
              )
              .reduce((total, entry) => total + entry.credits, 0)
        );

  return {
    userId,
    planId,
    tier: plan.tier,
    status: subscription.status,
    monthlyCreditsRemaining: wallet.availableCredits,
    dailyCreditsRemaining,
    canGenerate: subscription.status === "active" && wallet.availableCredits > 0,
    canRefine: subscription.status === "active" && hasFeature(plan, "content.language.refinement"),
    allowedModels: plan.allowedModels ?? [],
    features: Object.fromEntries(plan.features.map((feature) => [feature.key, feature.enabled])),
    wallet,
    activeCycleId: wallet.activeCycleId
  };
}

function rememberOperation<T, E>(
  repository: BillingRepository,
  operation: string,
  idempotencyKey: string,
  compute: () => Effect.Effect<T, E>
): Effect.Effect<BillingOperationResult<T>, E | BillingOperationConflictError> {
  return Effect.suspend(() => {
    const compositeKey = `${operation}:${idempotencyKey}`;
    const existing = repository.idempotency.get(compositeKey);
    if (existing) {
      return Effect.succeed(clone(existing) as BillingOperationResult<T>);
    }

    return Effect.map(compute(), (value) => {
      const result: BillingOperationResult<T> = {
        operation,
        idempotencyKey,
        value
      };
      repository.idempotency.set(compositeKey, clone(result));
      return result;
    });
  });
}

function appendLedgerEntry(
  repository: BillingRepository,
  entry: Omit<BillingLedgerEntry, "balanceAfter">
): BillingLedgerEntry {
  const accountLedger = repository.ledger.filter((candidate) => candidate.accountId === entry.accountId);
  const currentPlan = repository.plans.get(extractPlanIdFromAccountId(entry.accountId));
  const currentBalance =
    accountLedger.length === 0 && !repository.cycleStates.get(entry.accountId) && currentPlan
      ? currentPlan.monthlyCredits
      : accountLedger.reduce((total, candidate) => total + candidate.creditsDelta, 0);

  const next: BillingLedgerEntry = {
    ...entry,
    balanceAfter: roundCredits(currentBalance + entry.creditsDelta, "ceil_1_decimal")
  };
  repository.ledger.push(next);
  return next;
}

function roundCredits(value: number, mode: BillingCreditPolicy["rounding"]): number {
  if (mode === "ceil_1_decimal") {
    return Math.ceil(value * 10) / 10;
  }
  return value;
}

function hasFeature(plan: BillingPlanDefinition, key: string): boolean {
  return plan.features.some((feature) => feature.key === key && feature.enabled);
}

function sumLedger(entries: readonly BillingLedgerEntry[]): number {
  return roundCredits(entries.reduce((total, entry) => total + entry.creditsDelta, 0), "ceil_1_decimal");
}

function createAccountId(userId: string, planId: string): string {
  return `${userId}:${planId}`;
}

function extractUserIdFromAccountId(accountId: string): string {
  return accountId.split(":")[0] ?? accountId;
}

function extractPlanIdFromAccountId(accountId: string): string {
  return accountId.split(":")[1] ?? accountId;
}

function createReservationId(generationCycleId: string): string {
  return `${generationCycleId}:reservation`;
}

function createUsageId(userId: string, planId: string, kind: BillingUsageKind): string {
  return `${userId}:${planId}:${kind}:${Date.now()}`;
}

function createSystemClock(): BillingClock {
  return {
    now: () => new Date()
  };
}

function isSameUtcDay(isoDate: string, referenceDate: Date): boolean {
  const entryDate = new Date(isoDate);
  return (
    entryDate.getUTCFullYear() === referenceDate.getUTCFullYear() &&
    entryDate.getUTCMonth() === referenceDate.getUTCMonth() &&
    entryDate.getUTCDate() === referenceDate.getUTCDate()
  );
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
