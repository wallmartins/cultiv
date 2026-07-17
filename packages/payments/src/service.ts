import { Context, Effect, Layer } from "effect";
import { createAccountId, extractPlanIdFromAccountId, extractUserIdFromAccountId } from "./billing-utils.js";
import { startCycle as createStartCycle } from "./billing-cycle-operations.js";
import { createGenerationCreditOperations } from "./billing-generation-credits.js";
import {
  createSystemClock,
  createUsageId,
  rememberOperation,
  type BillingServiceRuntimeContext
} from "./billing-service-runtime.js";
import {
  calculateDebitForMode,
  DEFAULT_BILLING_CREDIT_POLICY
} from "./credit-policy.js";
import {
  BillingEntitlementNotFoundError,
  BillingInsufficientCreditsError,
  BillingPlanNotFoundError,
  BillingSubscriptionInactiveError,
  BillingTopUpPackageNotFoundError
} from "./errors.js";
import { createManualGateway } from "./gateway/index.js";
import { computeEntitlementGate } from "./entitlement.js";
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
  BillingEntitlement,
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

  const runtimeContext: BillingServiceRuntimeContext = {
    repository,
    clock,
    creditPolicy,
    rememberOperation
  };

  const generationCredits = createGenerationCreditOperations(runtimeContext);
  const startCycle = createStartCycle(runtimeContext);

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
    getSubscription(userId, planId) {
      return findSubscription(repository, userId, planId);
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

      // ADR 0006 §5 — acesso vivo (active | trial na janela | past_due | canceled no ciclo
      // pago), não só "active"; espelha computeEntitlementGate (mesmo critério do gate real).
      const { hasLiveAccess } = computeEntitlementGate({
        status: subscription.status,
        availableCredits: wallet.availableCredits,
        now: clock.now(),
        trialEndsAt: subscription.trialEndsAt,
        accessUntil: subscription.expiresAt,
        everSubscribed: subscription.everSubscribed
      });
      if (!hasLiveAccess) {
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
    startCycle,
    ...generationCredits,
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

          const charge = request.skipGatewayCharge
            ? {
                gateway: "webhook" as const,
                transactionId: request.idempotencyKey,
                status: "paid" as const
              }
            : yield* gateway.charge(request.chargeRequest);
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
