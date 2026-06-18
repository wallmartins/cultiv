import type { BillingCycleState, BillingGenerationReservation } from "@my-ai-orchestrator/contracts";
import { Context, Effect, Layer } from "effect";
import { clone, createAccountId, extractPlanIdFromAccountId, extractUserIdFromAccountId } from "./billing-utils.js";
import {
  calculateDebitForMode,
  calculateRolloverCredits,
  DEFAULT_BILLING_CREDIT_POLICY
} from "./credit-policy.js";
import {
  BillingEntitlementNotFoundError,
  BillingInsufficientCreditsError,
  BillingOperationConflictError,
  BillingPlanNotFoundError,
  BillingReservationNotFoundError,
  BillingSubscriptionInactiveError,
  BillingTopUpPackageNotFoundError
} from "./errors.js";
import { createManualGateway } from "./gateway/index.js";
import {
  appendLedgerEntry,
  createEntitlementFromRepository,
  createWalletFromRepository
} from "./ledger.js";
import { validatePlan } from "./plan-validation.js";
import { createBillingRepository } from "./repository.js";
import {
  findPrimarySubscription,
  findSubscription,
  resolveDefaultPlanId
} from "./subscription-lookup.js";
import type {
  BillingClock,
  BillingEntitlement,
  BillingOperationResult,
  BillingRepository,
  BillingServiceContract,
  BillingServiceOptions,
  BillingUsageKind
} from "./types.js";

export class BillingService extends Context.Tag("BillingService")<BillingService, BillingServiceContract>() {}

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
