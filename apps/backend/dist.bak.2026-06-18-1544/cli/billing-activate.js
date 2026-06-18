// src/cli/billing-activate.ts
import { Effect as Effect134 } from "effect";

// ../../packages/payments/src/index.ts
import { Context, Effect, Layer } from "effect";

// ../../packages/payments/src/errors.ts
import { Data } from "effect";
var BillingPlanInvalidError = class extends Data.TaggedError("BillingPlanInvalidError") {
};
var BillingPlanNotFoundError = class extends Data.TaggedError("BillingPlanNotFoundError") {
};
var BillingEntitlementNotFoundError = class extends Data.TaggedError("BillingEntitlementNotFoundError") {
};
var BillingSubscriptionInactiveError = class extends Data.TaggedError("BillingSubscriptionInactiveError") {
};
var BillingInsufficientCreditsError = class extends Data.TaggedError("BillingInsufficientCreditsError") {
};
var BillingTopUpPackageNotFoundError = class extends Data.TaggedError("BillingTopUpPackageNotFoundError") {
};
var BillingReservationNotFoundError = class extends Data.TaggedError("BillingReservationNotFoundError") {
};
var BillingOperationConflictError = class extends Data.TaggedError("BillingOperationConflictError") {
};

// ../../packages/payments/src/quality-mode-entitlements.ts
var MODES_BY_TIER = {
  free: ["fast"],
  starter: ["fast", "balanced"],
  pro: ["fast", "balanced", "strict"],
  enterprise: ["fast", "balanced", "strict"]
};
function resolveAllowedQualityModes(tier) {
  return MODES_BY_TIER[tier];
}
function hasActiveBillingSubscription(entitlement) {
  return entitlement.status === "active";
}
function canUseQualityMode(entitlement, mode) {
  if (!hasActiveBillingSubscription(entitlement)) {
    return false;
  }
  return resolveAllowedQualityModes(entitlement.tier).includes(mode);
}

// ../../packages/payments/src/index.ts
var BillingService = class extends Context.Tag("BillingService")() {
};
var DEFAULT_BILLING_CREDIT_POLICY = {
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
var DEFAULT_BILLING_PLANS = [
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
function createBillingRepository(seed = {}) {
  return {
    plans: new Map((seed.plans ?? DEFAULT_BILLING_PLANS).map((plan) => [plan.id, plan])),
    subscriptions: new Map((seed.subscriptions ?? []).map((subscription) => [subscription.id, subscription])),
    usage: [...seed.usage ?? []],
    ledger: [...seed.ledger ?? []],
    topUpPackages: new Map((seed.topUpPackages ?? []).map((pkg) => [pkg.id, pkg])),
    reservations: new Map((seed.reservations ?? []).map((reservation) => [reservation.reservationId, reservation])),
    cycleStates: new Map((seed.cycleStates ?? []).map((state) => [state.accountId, state])),
    idempotency: /* @__PURE__ */ new Map()
  };
}
function createBillingService(options = {}) {
  const repository = options.repository ?? createBillingRepository();
  const gateway = options.gateway ?? createManualGateway();
  const clock = options.clock ?? createSystemClock();
  const creditPolicy = options.creditPolicy ?? DEFAULT_BILLING_CREDIT_POLICY;
  const getEntitlementFor = (userId, planId) => createEntitlementFromRepository(repository, userId, planId, clock.now());
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
    recordUsage(usage2) {
      repository.usage.push(usage2);
      return usage2;
    },
    getEntitlement(userId, planId) {
      const resolvedPlanId = planId ?? findPrimarySubscription(repository, userId)?.planId;
      if (!resolvedPlanId) {
        return void 0;
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
      return Effect.succeed(getEntitlementFor(userId, planId));
    },
    quoteDebitForMode(mode, retryCount = 0) {
      return calculateDebitForMode(mode, retryCount, creditPolicy);
    },
    startCycle(request) {
      return rememberOperation(
        repository,
        "startCycle",
        request.idempotencyKey,
        () => Effect.gen(function* () {
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
          const cycleState = {
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
      return rememberOperation(
        repository,
        "reserveGenerationCredits",
        request.idempotencyKey,
        () => Effect.gen(function* () {
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
          const reservation = {
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
      return rememberOperation(
        repository,
        "captureReservedCredits",
        request.idempotencyKey,
        () => Effect.gen(function* () {
          const reservation = repository.reservations.get(request.reservationId);
          if (!reservation) {
            return yield* Effect.fail(new BillingReservationNotFoundError({ reservationId: request.reservationId }));
          }
          const next = {
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
              creditPriceOverride: typeof next.metadata?.creditPriceOverride === "number" ? next.metadata.creditPriceOverride : void 0,
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
      return rememberOperation(
        repository,
        "releaseReservedCredits",
        request.idempotencyKey,
        () => Effect.gen(function* () {
          const reservation = repository.reservations.get(request.reservationId);
          if (!reservation) {
            return yield* Effect.fail(new BillingReservationNotFoundError({ reservationId: request.reservationId }));
          }
          const next = {
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
      return rememberOperation(
        repository,
        "purchaseTopUp",
        request.idempotencyKey,
        () => Effect.gen(function* () {
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
function createManualGateway() {
  return {
    name: "manual",
    charge: (request) => Effect.succeed({
      gateway: "manual",
      transactionId: `manual_${request.userId}_${request.subscriptionId}`,
      status: "pending",
      raw: request
    })
  };
}
function validatePlan(plan) {
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
  if (plan.dailyCredits !== void 0 && plan.dailyCredits < 0) {
    return Effect.fail(
      new BillingPlanInvalidError({
        planId: plan.id,
        message: `Billing plan "${plan.id}" cannot have negative daily credits`
      })
    );
  }
  return Effect.succeed(plan);
}
function resolveDefaultPlanId(repository) {
  return repository.plans.has("pro") ? "pro" : repository.plans.keys().next().value ?? "free";
}
function findSubscription(repository, userId, planId) {
  return Array.from(repository.subscriptions.values()).find(
    (subscription) => subscription.userId === userId && subscription.planId === planId
  );
}
function findPrimarySubscription(repository, userId) {
  const subscriptions = Array.from(repository.subscriptions.values()).filter(
    (subscription) => subscription.userId === userId
  );
  if (subscriptions.length === 0) {
    return void 0;
  }
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "active");
  const pool = activeSubscriptions.length > 0 ? activeSubscriptions : subscriptions;
  return [...pool].sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];
}
function createSubscriptionId(userId, planId) {
  return `${userId}:${planId}:subscription`;
}
function defaultBillingCycleId(userId, planId) {
  return `${userId}:${planId}:cycle:default`;
}
function defaultBillingCycleIdempotencyKey(userId, planId, namespace) {
  return `${namespace}:${userId}:${planId}:default-cycle`;
}
function activateSubscription(billing, request) {
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
function calculateDebitForMode(mode, retryCount = 0, creditPolicy = DEFAULT_BILLING_CREDIT_POLICY) {
  const base = creditPolicy.baseCredits[mode];
  const surcharge = creditPolicy.retrySurcharge[mode];
  return roundCredits(base + retryCount * surcharge, creditPolicy.rounding);
}
function calculateRolloverCredits(remainingCredits, creditPolicy = DEFAULT_BILLING_CREDIT_POLICY) {
  return roundCredits(
    Math.min(remainingCredits * creditPolicy.rolloverPercent, creditPolicy.rolloverCap),
    creditPolicy.rounding
  );
}
function createWalletFromRepository(repository, userId, planId) {
  const subscription = findSubscription(repository, userId, planId);
  const plan = repository.plans.get(planId);
  if (!subscription) {
    return void 0;
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
    lifetimeGrantedCredits: baselineCredits + ledger.filter((entry) => entry.creditsDelta > 0).reduce((total, entry) => total + entry.creditsDelta, 0),
    lifetimeDebitedCredits: Math.abs(
      ledger.filter((entry) => entry.creditsDelta < 0).reduce((total, entry) => total + entry.creditsDelta, 0)
    )
  };
}
function createEntitlementFromRepository(repository, userId, planId = resolveDefaultPlanId(repository), referenceDate = /* @__PURE__ */ new Date()) {
  const plan = repository.plans.get(planId);
  const subscription = findSubscription(repository, userId, planId);
  if (!plan || !subscription) {
    return void 0;
  }
  const wallet = createWalletFromRepository(repository, userId, planId);
  if (!wallet) {
    return void 0;
  }
  const dailyCreditsRemaining = plan.dailyCredits === void 0 ? null : Math.max(
    0,
    plan.dailyCredits - repository.usage.filter(
      (entry) => entry.userId === userId && entry.planId === planId && isSameUtcDay(entry.createdAt, referenceDate)
    ).reduce((total, entry) => total + entry.credits, 0)
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
function rememberOperation(repository, operation, idempotencyKey, compute) {
  return Effect.suspend(() => {
    const compositeKey = `${operation}:${idempotencyKey}`;
    const existing = repository.idempotency.get(compositeKey);
    if (existing) {
      return Effect.succeed(clone(existing));
    }
    return Effect.map(compute(), (value) => {
      const result = {
        operation,
        idempotencyKey,
        value
      };
      repository.idempotency.set(compositeKey, clone(result));
      return result;
    });
  });
}
function appendLedgerEntry(repository, entry) {
  const accountLedger = repository.ledger.filter((candidate) => candidate.accountId === entry.accountId);
  const currentPlan = repository.plans.get(extractPlanIdFromAccountId(entry.accountId));
  const currentBalance = accountLedger.length === 0 && !repository.cycleStates.get(entry.accountId) && currentPlan ? currentPlan.monthlyCredits : accountLedger.reduce((total, candidate) => total + candidate.creditsDelta, 0);
  const next = {
    ...entry,
    balanceAfter: roundCredits(currentBalance + entry.creditsDelta, "ceil_1_decimal")
  };
  repository.ledger.push(next);
  return next;
}
function roundCredits(value, mode) {
  if (mode === "ceil_1_decimal") {
    return Math.ceil(value * 10) / 10;
  }
  return value;
}
function hasFeature(plan, key) {
  return plan.features.some((feature) => feature.key === key && feature.enabled);
}
function sumLedger(entries) {
  return roundCredits(entries.reduce((total, entry) => total + entry.creditsDelta, 0), "ceil_1_decimal");
}
function createAccountId(userId, planId) {
  return `${userId}:${planId}`;
}
function extractUserIdFromAccountId(accountId) {
  return accountId.split(":")[0] ?? accountId;
}
function extractPlanIdFromAccountId(accountId) {
  return accountId.split(":")[1] ?? accountId;
}
function createReservationId(generationCycleId) {
  return `${generationCycleId}:reservation`;
}
function createUsageId(userId, planId, kind) {
  return `${userId}:${planId}:${kind}:${Date.now()}`;
}
function createSystemClock() {
  return {
    now: () => /* @__PURE__ */ new Date()
  };
}
function isSameUtcDay(isoDate, referenceDate) {
  const entryDate = new Date(isoDate);
  return entryDate.getUTCFullYear() === referenceDate.getUTCFullYear() && entryDate.getUTCMonth() === referenceDate.getUTCMonth() && entryDate.getUTCDate() === referenceDate.getUTCDate();
}
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// src/config/config.ts
import { config as loadDotEnv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// src/config/config-auth.ts
function readBackendAuthConfig(envVars) {
  return {
    authIssuerUrl: normalizeIssuerUrl(readOptionalString(envVars.AUTH_ISSUER_URL)),
    authAudience: readOptionalString(envVars.AUTH_AUDIENCE),
    authJwksUrl: readOptionalString(envVars.AUTH_JWKS_URL),
    authClockToleranceSeconds: readPositiveInteger(envVars.AUTH_CLOCK_TOLERANCE_SECONDS),
    authJwksCacheTtlMs: readPositiveInteger(envVars.AUTH_JWKS_CACHE_TTL_MS)
  };
}
function validateBackendAuthConfig(args) {
  const issues = [];
  if (args.envVars.AUTH_ISSUER_URL && !isValidUrl(args.envVars.AUTH_ISSUER_URL)) {
    issues.push("AUTH_ISSUER_URL must be a valid URL");
  }
  if (args.envVars.AUTH_JWKS_URL && !isValidUrl(args.envVars.AUTH_JWKS_URL)) {
    issues.push("AUTH_JWKS_URL must be a valid URL");
  }
  if (args.environment === "production") {
    if (!args.config.authIssuerUrl) {
      issues.push("AUTH_ISSUER_URL is required in production");
    }
    if (!args.config.authAudience) {
      issues.push("AUTH_AUDIENCE is required in production");
    }
    if (!args.config.authJwksUrl) {
      issues.push("AUTH_JWKS_URL is required in production");
    }
  }
  return issues;
}
function readOptionalString(value) {
  if (!value) {
    return void 0;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : void 0;
}
function readPositiveInteger(value) {
  if (!value) {
    return void 0;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : void 0;
}
function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
function normalizeIssuerUrl(value) {
  if (!value) {
    return void 0;
  }
  const withProtocol = value.includes("://") ? value : `https://${value}`;
  const parsed = new URL(withProtocol);
  return `${parsed.origin}/`;
}

// src/internal/utils.ts
function dedupeStrings(values) {
  return [...new Set(values)];
}

// src/config/config.ts
var backendBooleanLiterals = ["true", "false"];
var backendEnvironments = ["development", "production", "test"];
var backendExecutionModes = ["sync", "async"];
var backendQualityModes = ["fast", "balanced", "strict"];
var BackendConfigValidationError = class extends Error {
  issues;
  constructor(issues) {
    super(`Backend config validation failed: ${issues.join("; ")}`);
    this.name = "BackendConfigValidationError";
    this.issues = issues;
  }
};
function bootstrapBackendConfig(options = {}) {
  return readValidatedBackendConfig(options);
}
function readBackendConfig(envVars = process.env) {
  return {
    environment: readEnvironment(envVars.NODE_ENV),
    executionMode: envVars.EXECUTION_MODE === "async" ? "async" : "sync",
    qualityMode: readQualityMode(envVars.QUALITY_MODE),
    defaultLanguage: envVars.DEFAULT_LANGUAGE ?? "pt-BR",
    serviceName: envVars.SERVICE_NAME ?? "backend",
    host: envVars.HOST ?? "0.0.0.0",
    port: readPort(envVars.PORT),
    version: envVars.APP_VERSION ?? "0.1.0",
    ...readBackendAuthConfig(envVars),
    billingUserId: readOptionalString2(envVars.BILLING_USER_ID),
    billingPlanId: readOptionalString2(envVars.BILLING_PLAN_ID),
    aiPolicyManifestPath: readOptionalString2(envVars.AI_POLICY_MANIFEST_PATH),
    aiPolicyAttachedVersion: readOptionalString2(envVars.AI_POLICY_ATTACHED_VERSION),
    experimentalAIPolicyManifestPath: readOptionalString2(envVars.EXPERIMENTAL_AI_POLICY_MANIFEST_PATH),
    safetyPolicyManifestPath: readOptionalString2(envVars.SAFETY_POLICY_MANIFEST_PATH),
    experimentalDebugEnabled: envVars.EXPERIMENTAL_DEBUG_ENABLED === "true",
    reasoningSignatureV1Enabled: envVars.VOICE_REASONING_SIGNATURE_V1 === "true",
    aiPolicyReloadIntervalMs: readPositiveInteger2(envVars.AI_POLICY_RELOAD_INTERVAL_MS),
    readinessCacheTtlMs: readPositiveInteger2(envVars.READINESS_CACHE_TTL_MS),
    corsAllowedOrigins: readCsvList(envVars.CORS_ALLOWED_ORIGINS),
    rateLimitWindowMs: readPositiveInteger2(envVars.RATE_LIMIT_WINDOW_MS),
    rateLimitMaxRequests: readPositiveInteger2(envVars.RATE_LIMIT_MAX_REQUESTS),
    databaseUrl: readOptionalString2(envVars.DATABASE_URL),
    redisUrl: readOptionalString2(envVars.REDIS_URL),
    allowInMemoryRuntime: envVars.BACKEND_ALLOW_IN_MEMORY_RUNTIME === "true",
    trustProxy: readTrustProxy(envVars),
    executionWorkerConcurrency: readPositiveInteger2(envVars.EXECUTION_WORKER_CONCURRENCY),
    voiceDataProtectionKey: readOptionalString2(envVars.VOICE_DATA_PROTECTION_KEY),
    voiceDataProtectionPreviousKey: readOptionalString2(envVars.VOICE_DATA_PROTECTION_KEY_PREVIOUS),
    openAIApiKey: readOptionalString2(envVars.OPENAI_API_KEY),
    openAIBaseUrl: readOptionalString2(envVars.OPENAI_BASE_URL),
    anthropicApiKey: readOptionalString2(envVars.ANTHROPIC_API_KEY),
    anthropicBaseUrl: readOptionalString2(envVars.ANTHROPIC_BASE_URL),
    anthropicVersion: readOptionalString2(envVars.ANTHROPIC_VERSION),
    geminiApiKey: readOptionalString2(envVars.GEMINI_API_KEY),
    geminiBaseUrl: readOptionalString2(envVars.GEMINI_BASE_URL),
    deepSeekApiKey: readOptionalString2(envVars.DEEPSEEK_API_KEY),
    deepSeekBaseUrl: readOptionalString2(envVars.DEEPSEEK_BASE_URL),
    groqApiKey: readOptionalString2(envVars.GROQ_API_KEY),
    groqBaseUrl: readOptionalString2(envVars.GROQ_BASE_URL),
    ollamaBaseUrl: readOptionalString2(envVars.OLLAMA_BASE_URL)
  };
}
function loadBackendEnvironment(options = {}) {
  const env = options.env ?? process.env;
  const mode = options.mode ?? inferBackendEnvLoadMode(env);
  if (mode === "production") {
    return env;
  }
  const envPaths = resolveBackendEnvPaths(options);
  if (envPaths.length > 0) {
    loadDotEnv({
      processEnv: env,
      path: [...envPaths],
      override: options.override
    });
  }
  return env;
}
function readValidatedBackendConfig(options = {}) {
  const envVars = options.envVars ?? options.env ?? process.env;
  const hydratedEnv = options.loadEnvFile === false ? envVars : loadBackendEnvironment({
    env: envVars,
    envFilePath: options.envFilePath,
    override: options.override,
    mode: options.mode
  });
  const config = readBackendConfig(hydratedEnv);
  validateBackendConfig(hydratedEnv, config, options.requiredEnvVars);
  return config;
}
function validateBackendConfig(envVars, config, requiredEnvVars = []) {
  const issues = [];
  if (!config.serviceName.trim()) {
    issues.push("SERVICE_NAME must not be empty");
  }
  if (!config.host.trim()) {
    issues.push("HOST must not be empty");
  }
  if (!config.version.trim()) {
    issues.push("APP_VERSION must not be empty");
  }
  if (envVars.NODE_ENV && !backendEnvironments.includes(envVars.NODE_ENV)) {
    issues.push(`NODE_ENV must be one of: ${backendEnvironments.join(", ")}`);
  }
  if (envVars.EXECUTION_MODE && !backendExecutionModes.includes(envVars.EXECUTION_MODE)) {
    issues.push(`EXECUTION_MODE must be one of: ${backendExecutionModes.join(", ")}`);
  }
  if (envVars.QUALITY_MODE && !backendQualityModes.includes(envVars.QUALITY_MODE)) {
    issues.push(`QUALITY_MODE must be one of: ${backendQualityModes.join(", ")}`);
  }
  if (envVars.PORT && !isPositiveInteger(envVars.PORT)) {
    issues.push("PORT must be a positive integer");
  }
  if (envVars.AI_POLICY_RELOAD_INTERVAL_MS && !isPositiveInteger(envVars.AI_POLICY_RELOAD_INTERVAL_MS)) {
    issues.push("AI_POLICY_RELOAD_INTERVAL_MS must be a positive integer");
  }
  if (envVars.READINESS_CACHE_TTL_MS && !isPositiveInteger(envVars.READINESS_CACHE_TTL_MS)) {
    issues.push("READINESS_CACHE_TTL_MS must be a positive integer");
  }
  if (envVars.RATE_LIMIT_WINDOW_MS && !isPositiveInteger(envVars.RATE_LIMIT_WINDOW_MS)) {
    issues.push("RATE_LIMIT_WINDOW_MS must be a positive integer");
  }
  if (envVars.RATE_LIMIT_MAX_REQUESTS && !isPositiveInteger(envVars.RATE_LIMIT_MAX_REQUESTS)) {
    issues.push("RATE_LIMIT_MAX_REQUESTS must be a positive integer");
  }
  if (envVars.EXPERIMENTAL_DEBUG_ENABLED && !backendBooleanLiterals.includes(envVars.EXPERIMENTAL_DEBUG_ENABLED)) {
    issues.push('EXPERIMENTAL_DEBUG_ENABLED must be either "true" or "false"');
  }
  if (envVars.BACKEND_TRUST_PROXY && !backendBooleanLiterals.includes(envVars.BACKEND_TRUST_PROXY)) {
    issues.push('BACKEND_TRUST_PROXY must be either "true" or "false"');
  }
  for (const envVar of requiredEnvVars) {
    if (!envVars[envVar] || envVars[envVar]?.trim().length === 0) {
      issues.push(`${envVar} is required`);
    }
  }
  if (config.environment === "production" && !config.databaseUrl) {
    issues.push("DATABASE_URL is required in production");
  }
  if (config.environment === "production" && !config.redisUrl) {
    issues.push("REDIS_URL is required in production");
  }
  if (config.environment === "production") {
    if (config.allowInMemoryRuntime) {
      issues.push("BACKEND_ALLOW_IN_MEMORY_RUNTIME must not be true in production");
    }
    if (config.executionMode !== "async") {
      issues.push("EXECUTION_MODE must be async in production");
    }
    if (!config.corsAllowedOrigins || config.corsAllowedOrigins.length === 0) {
      issues.push("CORS_ALLOWED_ORIGINS is required in production");
    }
    if (!config.voiceDataProtectionKey) {
      issues.push("VOICE_DATA_PROTECTION_KEY is required in production");
    } else if (config.voiceDataProtectionKey.length < 32) {
      issues.push("VOICE_DATA_PROTECTION_KEY must be at least 32 characters in production");
    }
    if (config.voiceDataProtectionPreviousKey && config.voiceDataProtectionPreviousKey.length < 32) {
      issues.push("VOICE_DATA_PROTECTION_KEY_PREVIOUS must be at least 32 characters when set");
    }
    if (config.voiceDataProtectionPreviousKey && config.voiceDataProtectionKey && config.voiceDataProtectionPreviousKey === config.voiceDataProtectionKey) {
      issues.push("VOICE_DATA_PROTECTION_KEY_PREVIOUS must differ from VOICE_DATA_PROTECTION_KEY");
    }
  }
  if (config.environment === "development" && !config.allowInMemoryRuntime) {
    if (!config.databaseUrl) {
      issues.push("DATABASE_URL is required in development unless BACKEND_ALLOW_IN_MEMORY_RUNTIME=true");
    }
    if (!config.redisUrl) {
      issues.push("REDIS_URL is required in development unless BACKEND_ALLOW_IN_MEMORY_RUNTIME=true");
    }
  }
  issues.push(...validateBackendAuthConfig({
    config,
    environment: config.environment,
    envVars
  }));
  if (issues.length > 0) {
    throw new BackendConfigValidationError(issues);
  }
}
function readEnvironment(value) {
  if (value === "production" || value === "test") {
    return value;
  }
  return "development";
}
function readQualityMode(value) {
  if (value === "fast" || value === "balanced" || value === "strict") {
    return value;
  }
  return "balanced";
}
function readPort(value) {
  const parsed = Number.parseInt(value ?? "3000", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3e3;
}
function readPositiveInteger2(value) {
  if (!value) {
    return void 0;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : void 0;
}
function isPositiveInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0;
}
function inferBackendEnvLoadMode(envVars) {
  return envVars.NODE_ENV === "production" ? "production" : "local";
}
function readTrustProxy(envVars) {
  if (envVars.BACKEND_TRUST_PROXY === "true") {
    return true;
  }
  if (envVars.BACKEND_TRUST_PROXY === "false") {
    return false;
  }
  return envVars.NODE_ENV === "production" ? true : void 0;
}
function readOptionalString2(value) {
  if (!value) {
    return void 0;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : void 0;
}
function readCsvList(value) {
  if (!value) {
    return void 0;
  }
  const items = value.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  return items.length > 0 ? dedupeStrings(items) : void 0;
}
function resolveBackendEnvPaths(options) {
  if (options.envFilePath) {
    return [options.envFilePath];
  }
  const cwd = options.cwd ?? process.cwd();
  const candidates = [
    resolve(cwd, ".env.local"),
    resolve(cwd, ".env"),
    resolve(backendPackageRoot, ".env.local"),
    resolve(backendPackageRoot, ".env"),
    resolve(repositoryRoot, ".env.local"),
    resolve(repositoryRoot, ".env")
  ];
  return dedupeStrings(candidates.filter((candidate) => existsSync(candidate)));
}
var currentFilePath = fileURLToPath(import.meta.url);
var currentDirectory = dirname(currentFilePath);
var backendPackageRoot = resolve(currentDirectory, "../..");
var repositoryRoot = resolve(currentDirectory, "../../../..");

// src/product/billing/billing-bootstrap.ts
import { Effect as Effect3 } from "effect";

// src/effects/non-blocking-diagnostics.ts
import { Effect as Effect2 } from "effect";
function swallowWithDiagnostic(args) {
  return (error) => Effect2.logWarning(args.operation, {
    ...args.context,
    cause: toDiagnosticMessage(error)
  }).pipe(
    Effect2.orElse(() => Effect2.void),
    Effect2.zipRight(Effect2.void)
  );
}
function toDiagnosticMessage(error) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim();
  }
  return "unknown non-blocking failure";
}

// src/product/billing/billing-bootstrap.ts
function seedUserBillingState(billing, config, userId, now) {
  const planId = config.billingPlanId;
  if (!planId) {
    return Effect3.void;
  }
  return activateSubscription(billing, {
    userId,
    planId,
    now,
    idempotencyNamespace: config.serviceName,
    cycleId: `${userId}:${planId}:cycle:${config.version}`
  }).pipe(
    Effect3.catchAll(
      swallowWithDiagnostic({
        operation: "Failed to seed billing cycle state",
        context: { userId, planId }
      })
    )
  );
}
function seedBillingState(billing, config, now) {
  const userId = config.billingUserId ?? config.serviceName;
  return seedUserBillingState(billing, config, userId, now);
}
function registerBackendBillingPlans(billing) {
  return Effect3.gen(function* () {
    const plans = billing.listPlans().length > 0 ? billing.listPlans() : DEFAULT_BILLING_PLANS;
    for (const plan of plans) {
      const allowedModels = new Set(plan.allowedModels ?? []);
      allowedModels.add("backend-fast");
      allowedModels.add("backend-balanced");
      allowedModels.add("backend-strict");
      allowedModels.add("gpt-4.1");
      allowedModels.add("gpt-4o-mini");
      yield* billing.registerPlan({
        ...plan,
        allowedModels: Array.from(allowedModels)
      });
    }
  }).pipe(Effect3.catchAll(swallowWithDiagnostic({
    operation: "Failed to register backend billing plans"
  })));
}

// src/product/core/services.ts
import { Effect as Effect133 } from "effect";

// src/product/catalog/persistence-content-types.ts
import { Effect as Effect4 } from "effect";
function persistContentType(database, plan, at) {
  return database.contentTypes.put(
    {
      id: plan.contentType.id,
      label: plan.contentType.label,
      defaultLanguage: plan.contentType.defaultLanguage,
      steps: [...plan.contentType.steps],
      inputSchema: { ...plan.contentType.inputSchema }
    },
    1,
    at
  ).pipe(
    Effect4.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist content type snapshot",
      context: { contentTypeId: plan.contentType.id }
    })),
    Effect4.map(() => void 0)
  );
}

// src/product/persistence/persistence-jobs.ts
import { Effect as Effect6 } from "effect";

// src/product/core/audit-trail.ts
import { createHash } from "node:crypto";
import { Effect as Effect5 } from "effect";
function persistBackendAuditEvent(database, event, redaction) {
  const metadata = event.metadata && redaction ? redaction.redactObject(event.metadata).redacted : event.metadata ?? {};
  return database.audit.putIfAbsent({
    id: buildAuditRecordId(event.logicalKey),
    logicalKey: event.logicalKey,
    actorId: event.actorId,
    actorType: event.actorType,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    mutationType: event.mutationType,
    occurredAt: event.occurredAt,
    metadata
  }).pipe(Effect5.orDie);
}
function buildAuditRecordId(logicalKey) {
  return `audit:${createHash("sha256").update(logicalKey).digest("hex").slice(0, 24)}`;
}

// src/product/persistence/persistence-jobs.ts
function persistQueuedJob(database, args) {
  const actor = resolveQueuedJobActor(requestActorSource(args.request));
  return database.transaction(
    (trxDatabase) => Effect6.gen(function* () {
      yield* trxDatabase.jobs.create(
        {
          id: args.jobId,
          status: "queued",
          executionMode: args.plan.request.executionMode,
          contentType: args.plan.contentType.id,
          createdAt: args.createdAt,
          completedAt: null,
          pipelineId: args.plan.pipeline.name
        },
        {
          progress: {
            currentStep: "queued",
            stepIndex: 0,
            totalSteps: Math.max(1, args.plan.pipeline.steps.length),
            percent: 0
          },
          updatedAt: args.createdAt,
          history: [
            {
              type: "created",
              at: args.createdAt,
              payload: {
                contentType: args.plan.contentType.id,
                executionMode: args.plan.request.executionMode,
                pipelineName: args.plan.pipeline.name,
                requestVariant: "pipeline" in args.request ? "explicit" : "simplified"
              }
            }
          ]
        }
      );
      yield* persistContentType(trxDatabase, args.plan, args.createdAt);
      yield* persistBackendAuditEvent(trxDatabase, {
        logicalKey: `job:${args.jobId}:queued:${args.createdAt}`,
        actorId: actor.actorId,
        actorType: actor.actorType,
        resourceType: "job",
        resourceId: args.jobId,
        mutationType: "job.queued",
        occurredAt: args.createdAt,
        metadata: {
          contentType: args.plan.contentType.id,
          executionMode: args.plan.request.executionMode,
          pipelineName: args.plan.pipeline.name
        }
      });
    })
  ).pipe(
    Effect6.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist queued job",
      context: { jobId: args.jobId, pipelineName: args.plan.pipeline.name }
    })),
    Effect6.map(() => void 0)
  );
}
function persistJobProgress(database, args) {
  return database.transaction(
    (trxDatabase) => Effect6.gen(function* () {
      yield* trxDatabase.jobs.recordProgress(args.jobId, args.progress, args.updatedAt);
      yield* persistBackendAuditEvent(trxDatabase, {
        logicalKey: `job:${args.jobId}:progress:${args.updatedAt}:${args.progress.currentStep}:${args.progress.percent}`,
        actorId: "system",
        actorType: "system",
        resourceType: "job",
        resourceId: args.jobId,
        mutationType: "job.progress_recorded",
        occurredAt: args.updatedAt,
        metadata: {
          currentStep: args.progress.currentStep,
          stepIndex: args.progress.stepIndex,
          totalSteps: args.progress.totalSteps,
          percent: args.progress.percent
        }
      });
    })
  ).pipe(
    Effect6.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist job progress",
      context: { jobId: args.jobId, currentStep: args.progress.currentStep }
    })),
    Effect6.map(() => void 0)
  );
}
function requestActorSource(request) {
  return "userId" in request && typeof request.userId === "string" ? request.userId : void 0;
}
function resolveQueuedJobActor(actorId) {
  return actorId ? { actorId, actorType: "application_user" } : { actorId: "system", actorType: "system" };
}
function persistJobCompletion(database, args) {
  return database.transaction(
    (trxDatabase) => Effect6.gen(function* () {
      yield* trxDatabase.jobs.complete(args.jobId, args.result, args.completedAt);
      yield* persistBackendAuditEvent(trxDatabase, {
        logicalKey: `job:${args.jobId}:completed:${args.completedAt}`,
        actorId: "system",
        actorType: "system",
        resourceType: "job",
        resourceId: args.jobId,
        mutationType: "job.completed",
        occurredAt: args.completedAt,
        metadata: {
          outputKeys: Object.keys(args.result)
        }
      });
    })
  ).pipe(
    Effect6.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist job completion",
      context: { jobId: args.jobId }
    })),
    Effect6.map(() => void 0)
  );
}
function persistJobFailure(database, args) {
  return database.transaction(
    (trxDatabase) => Effect6.gen(function* () {
      yield* trxDatabase.jobs.fail(args.jobId, args.error, args.completedAt);
      yield* persistBackendAuditEvent(trxDatabase, {
        logicalKey: `job:${args.jobId}:failed:${args.completedAt}`,
        actorId: "system",
        actorType: "system",
        resourceType: "job",
        resourceId: args.jobId,
        mutationType: "job.failed",
        occurredAt: args.completedAt,
        metadata: {
          message: args.error.message,
          step: args.error.step ?? null
        }
      });
    })
  ).pipe(
    Effect6.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist job failure",
      context: { jobId: args.jobId, step: args.error.step ?? null }
    })),
    Effect6.map(() => void 0)
  );
}

// src/product/persistence/persistence-memory.ts
import { Effect as Effect7 } from "effect";
function persistMemoryWrite(database, args) {
  const namespace = "backend";
  return database.memories.put(
    {
      id: `${namespace}:${args.key}`,
      userId: namespace,
      key: args.key,
      value: args.value,
      createdAt: args.at,
      updatedAt: args.at
    },
    1
  ).pipe(
    Effect7.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist backend memory write",
      context: { key: args.key }
    })),
    Effect7.map(() => void 0)
  );
}

// src/product/persistence/persistence.ts
function createBackendPersistence(database, now) {
  return {
    recordExecutionPlan(plan) {
      return persistContentType(database, plan, now().toISOString());
    },
    recordQueuedJob(args) {
      return persistQueuedJob(database, args);
    },
    recordJobProgress(args) {
      return persistJobProgress(database, args);
    },
    recordJobCompletion(args) {
      return persistJobCompletion(database, args);
    },
    recordJobFailure(args) {
      return persistJobFailure(database, args);
    },
    recordMemoryWrite(args) {
      return persistMemoryWrite(database, args);
    }
  };
}

// src/product/usage/usage-policy.ts
import { Effect as Effect11 } from "effect";

// src/http/errors.ts
import { Data as Data2 } from "effect";
var BackendRequestBodyParseError = class extends Data2.TaggedError("BackendRequestBodyParseError") {
};
var BackendReadinessError = class extends Data2.TaggedError("BackendReadinessError") {
};
var BackendRequestRateLimitError = class extends Data2.TaggedError("BackendRequestRateLimitError") {
};
var BackendAuthenticationError = class extends Data2.TaggedError("BackendAuthenticationError") {
};
var BackendAuthorizationError = class extends Data2.TaggedError("BackendAuthorizationError") {
};
var BackendJobNotFoundError = class extends Data2.TaggedError("BackendJobNotFoundError") {
};
var BackendVoiceProfileNotFoundError = class extends Data2.TaggedError("BackendVoiceProfileNotFoundError") {
};
var BackendVoiceExampleNotFoundError = class extends Data2.TaggedError("BackendVoiceExampleNotFoundError") {
};
var BackendExecutionNotFoundError = class extends Data2.TaggedError("BackendExecutionNotFoundError") {
};
var BackendResponseValidationError = class extends Data2.TaggedError("BackendResponseValidationError") {
};
var BackendExecutionConflictError = class extends Data2.TaggedError("BackendExecutionConflictError") {
};
var BackendExecutionFailedError = class extends Data2.TaggedError("BackendExecutionFailedError") {
};
var BackendExecutionIntegrityError = class extends Data2.TaggedError("BackendExecutionIntegrityError") {
};
var BackendUsageAuthorizationError = class extends Data2.TaggedError("BackendUsageAuthorizationError") {
};
var BackendExperimentalAccessError = class extends Data2.TaggedError("BackendExperimentalAccessError") {
};
var BackendAIPolicyLoadError = class extends Data2.TaggedError("BackendAIPolicyLoadError") {
};
var BackendAIPolicyValidationError = class extends Data2.TaggedError("BackendAIPolicyValidationError") {
};
var BackendAIPolicyCatalogError = class extends Data2.TaggedError("BackendAIPolicyCatalogError") {
};
var BackendAIPolicyPricingError = class extends Data2.TaggedError("BackendAIPolicyPricingError") {
};
var BackendSafetyPolicyLoadError = class extends Data2.TaggedError("BackendSafetyPolicyLoadError") {
};
var BackendSafetyPolicyValidationError = class extends Data2.TaggedError("BackendSafetyPolicyValidationError") {
};
var BackendSafetyPolicyDefinitionError = class extends Data2.TaggedError("BackendSafetyPolicyDefinitionError") {
};
var BackendInputSafetyGatewayFailureError = class extends Data2.TaggedError("BackendInputSafetyGatewayFailureError") {
};
var BackendInputSafetyPolicyError = class extends Data2.TaggedError("BackendInputSafetyPolicyError") {
};
var BackendInstructionOverrideDetectorFailureError = class extends Data2.TaggedError("BackendInstructionOverrideDetectorFailureError") {
};
var BackendStepScopeViolationError = class extends Data2.TaggedError("BackendStepScopeViolationError") {
};
var BackendUserSuspendedError = class extends Data2.TaggedError("BackendUserSuspendedError") {
};
var BackendVoiceTrainingConsentRequiredError = class extends Data2.TaggedError("BackendVoiceTrainingConsentRequiredError") {
};
var BackendVoiceTrainingConsentFailureError = class extends Data2.TaggedError("BackendVoiceTrainingConsentFailureError") {
};
var BackendGenerationQuoteMismatchError = class extends Data2.TaggedError("BackendGenerationQuoteMismatchError") {
};
var BackendOutputReleaseGateFailureError = class extends Data2.TaggedError("BackendOutputReleaseGateFailureError") {
};
var BackendOutputReleasePolicyError = class extends Data2.TaggedError("BackendOutputReleasePolicyError") {
};
var BackendOperationalOverrideStateError = class extends Data2.TaggedError("BackendOperationalOverrideStateError") {
};

// src/product/usage/usage-policy-guards.ts
import { Effect as Effect8 } from "effect";
function enforceUsagePolicyGuards(args) {
  if (args.requestedExecutionMode === "sync" && args.resolvedExecutionMode === "async") {
    return Effect8.fail(
      new BackendUsageAuthorizationError({
        userId: args.userId,
        planId: args.planId,
        reason: "feature_disabled",
        message: "Sync execution is disabled by feature flags"
      })
    );
  }
  if (args.entitlement && args.entitlement.status !== "active") {
    return Effect8.fail(
      new BackendUsageAuthorizationError({
        userId: args.userId,
        planId: args.planId,
        reason: "plan_inactive",
        message: `Plan "${args.planId}" is not active`
      })
    );
  }
  if (args.entitlement && args.entitlement.allowedModels.length > 0 && !args.allowedModel) {
    return Effect8.fail(
      new BackendUsageAuthorizationError({
        userId: args.userId,
        planId: args.planId,
        reason: "model_not_allowed",
        message: `Model "${args.model}" is not allowed for plan "${args.planId}"`
      })
    );
  }
  return Effect8.void;
}

// src/execution/billing.ts
import { Effect as Effect9 } from "effect";

// src/product/billing/resolve-user-billing.ts
function resolveStoredUserEntitlement(billing, userId) {
  return billing.getEntitlement(userId);
}
function resolveStoredUserPlanId(billing, userId) {
  return billing.getPrimarySubscriptionPlanId(userId) ?? billing.getEntitlement(userId)?.planId ?? "free";
}

// src/execution/billing.ts
function resolveBackendBillingIdentity(request, billing, config, fallbackCycleId) {
  const requestRecord = request;
  const requestUserId = typeof requestRecord.userId === "string" ? requestRecord.userId : void 0;
  const userId = requestUserId ?? config.billingUserId ?? config.serviceName;
  return {
    userId,
    planId: resolveStoredUserPlanId(billing, userId),
    generationCycleId: request.idempotencyKey ?? fallbackCycleId
  };
}

// ../../packages/feature-flags/src/index.ts
import { Context as Context2, Effect as Effect10, Layer as Layer2 } from "effect";

// ../../packages/feature-flags/src/errors.ts
import { Data as Data3 } from "effect";
var FeatureFlagDefinitionError = class extends Data3.TaggedError("FeatureFlagDefinitionError") {
};
var FeatureFlagRolloutError = class extends Data3.TaggedError("FeatureFlagRolloutError") {
};
var FeatureFlagVariantError = class extends Data3.TaggedError("FeatureFlagVariantError") {
};

// ../../packages/feature-flags/src/index.ts
var DEFAULT_FEATURE_FLAGS = [
  {
    key: "execution.sync_mode",
    scope: "execution",
    enabled: true,
    defaultVariant: "sync",
    variants: ["sync", "async"]
  },
  {
    key: "content.language.refinement",
    scope: "content",
    enabled: true,
    defaultVariant: "on",
    variants: ["on", "off"]
  },
  {
    key: "generation.lexicalQualityV2",
    scope: "content",
    enabled: true,
    defaultVariant: "on",
    variants: ["on", "off"]
  },
  {
    key: "voice.reasoningSignatureV1",
    scope: "content",
    enabled: false,
    description: "Author reasoning signature extraction, injection, and evaluation",
    defaultVariant: "off",
    variants: ["off", "on"]
  },
  {
    key: "rollout.beta.access",
    scope: "rollout",
    enabled: false,
    defaultVariant: "control",
    variants: ["control", "beta"],
    rollout: {
      percentage: 0,
      stickyBy: "userId",
      allowedVariants: ["control", "beta"]
    }
  }
];
var FeatureFlagRegistryService = class extends Context2.Tag("FeatureFlagRegistryService")() {
};
var FeatureFlagEvaluatorService = class extends Context2.Tag("FeatureFlagEvaluatorService")() {
};
var FeatureFlagService = class extends Context2.Tag("FeatureFlagService")() {
};
function createFeatureFlagRegistry(initialFlags = DEFAULT_FEATURE_FLAGS) {
  const flags = /* @__PURE__ */ new Map();
  return Effect10.gen(function* () {
    for (const flag of initialFlags) {
      const validated = yield* validateFeatureFlag(flag);
      flags.set(validated.key, validated);
    }
    return {
      register(flag) {
        return Effect10.map(validateFeatureFlag(flag), (validated) => {
          flags.set(validated.key, validated);
        });
      },
      resolve(key) {
        return flags.get(key);
      },
      list() {
        return Array.from(flags.values());
      },
      snapshot() {
        return Object.fromEntries(flags.entries());
      }
    };
  });
}
function createFeatureFlagEvaluator(registry) {
  return {
    resolve(key, context = {}) {
      const definition = registry.resolve(key);
      if (!definition) {
        return createMissingFlagResolution(key, context);
      }
      if (!definition.enabled) {
        return {
          key,
          scope: definition.scope,
          enabled: false,
          variant: null,
          reason: "disabled",
          target: context
        };
      }
      const targetMatch = matchTargetRule(definition, context);
      if (targetMatch) {
        return {
          key,
          scope: definition.scope,
          enabled: targetMatch.enabled ?? true,
          variant: targetMatch.variant ?? definition.defaultVariant ?? null,
          reason: "target",
          target: context
        };
      }
      const rolloutMatch = matchRollout(definition, context);
      if (rolloutMatch) {
        return {
          key,
          scope: definition.scope,
          enabled: true,
          variant: rolloutMatch,
          reason: "rollout",
          target: context
        };
      }
      return {
        key,
        scope: definition.scope,
        enabled: true,
        variant: definition.defaultVariant ?? null,
        reason: "default",
        target: context
      };
    },
    isEnabled(key, context) {
      return this.resolve(key, context).enabled;
    },
    getVariant(key, context) {
      return this.resolve(key, context).variant;
    }
  };
}
function createFeatureFlagService(options = {}) {
  return Effect10.gen(function* () {
    const registry = options.registry ? options.registry : yield* createFeatureFlagRegistry();
    const evaluator = createFeatureFlagEvaluator(registry);
    return {
      resolve: evaluator.resolve,
      isEnabled: evaluator.isEnabled,
      getVariant: evaluator.getVariant,
      refresh: () => Effect10.gen(function* () {
        if (!options.provider) {
          return;
        }
        const loaded = yield* options.provider.load();
        for (const flag of loaded) {
          yield* registry.register(flag);
        }
      })
    };
  });
}
function validateFeatureFlag(flag) {
  if (!flag || typeof flag !== "object") {
    return Effect10.fail(
      new FeatureFlagDefinitionError({
        message: "Feature flag definition is required"
      })
    );
  }
  if (typeof flag.key !== "string" || flag.key.trim().length === 0) {
    return Effect10.fail(
      new FeatureFlagDefinitionError({
        message: "Feature flag must have a non-empty key"
      })
    );
  }
  if (flag.variants) {
    const normalized = /* @__PURE__ */ new Set();
    for (const variant of flag.variants) {
      if (typeof variant !== "string" || variant.trim().length === 0) {
        return Effect10.fail(
          new FeatureFlagVariantError({
            key: flag.key,
            message: `Feature flag "${flag.key}" has an invalid variant`
          })
        );
      }
      normalized.add(variant);
    }
    if (flag.defaultVariant && !normalized.has(flag.defaultVariant)) {
      return Effect10.fail(
        new FeatureFlagVariantError({
          key: flag.key,
          message: `Feature flag "${flag.key}" defaultVariant must be included in variants`
        })
      );
    }
    if (flag.rollout?.allowedVariants) {
      for (const variant of flag.rollout.allowedVariants) {
        if (!normalized.has(variant)) {
          return Effect10.fail(
            new FeatureFlagRolloutError({
              key: flag.key,
              message: `Feature flag "${flag.key}" rollout allowedVariants must be included in variants`
            })
          );
        }
      }
    }
  }
  if (flag.rollout?.percentage !== void 0 && (flag.rollout.percentage < 0 || flag.rollout.percentage > 100)) {
    return Effect10.fail(
      new FeatureFlagRolloutError({
        key: flag.key,
        message: `Feature flag "${flag.key}" rollout.percentage must be between 0 and 100`
      })
    );
  }
  return Effect10.succeed(flag);
}
function resolveExecutionModeFlag(registry, context = {}) {
  return registry.resolve("execution.sync_mode")?.enabled ? "sync" : "async";
}
function resolveContentRefinementFlag(registry, context = {}) {
  return createFeatureFlagEvaluator(registry).isEnabled("content.language.refinement", context);
}
function resolveRolloutFlag(registry, key, context = {}) {
  return createFeatureFlagEvaluator(registry).resolve(key, context);
}
function createMissingFlagResolution(key, context) {
  return {
    key,
    scope: "rollout",
    enabled: false,
    variant: null,
    reason: "disabled",
    target: context
  };
}
function matchTargetRule(definition, context) {
  return definition.targets?.find((rule) => {
    if (rule.environment && rule.environment !== context.environment) {
      return false;
    }
    if (rule.locale && rule.locale !== context.locale) {
      return false;
    }
    if (rule.userId && rule.userId !== context.userId) {
      return false;
    }
    if (rule.pipelineType && rule.pipelineType !== context.pipelineType) {
      return false;
    }
    if (rule.contentType && rule.contentType !== context.contentType) {
      return false;
    }
    if (rule.tags && rule.tags.length > 0) {
      const currentTags = new Set(context.tags ?? []);
      if (!rule.tags.every((tag) => currentTags.has(tag))) {
        return false;
      }
    }
    return true;
  });
}
function matchRollout(definition, context) {
  const rollout = definition.rollout;
  if (!rollout || rollout.percentage === void 0 || rollout.percentage <= 0) {
    return void 0;
  }
  const basis = rollout.stickyBy && context[rollout.stickyBy] ? String(context[rollout.stickyBy]) : JSON.stringify({
    key: definition.key,
    userId: context.userId,
    pipelineType: context.pipelineType,
    contentType: context.contentType,
    locale: context.locale
  });
  const hash = hashString(basis);
  const bucket = hash % 100;
  if (bucket < rollout.percentage) {
    return rollout.allowedVariants?.[1] ?? definition.variants?.[1] ?? definition.defaultVariant ?? "beta";
  }
  return rollout.allowedVariants?.[0] ?? definition.variants?.[0] ?? definition.defaultVariant ?? "control";
}
function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = hash * 31 + value.charCodeAt(index) >>> 0;
  }
  return hash;
}

// src/product/usage/usage-policy-context.ts
function resolveUsagePolicyContext(options) {
  const billingIdentity = resolveBackendBillingIdentity(
    options.request.request,
    options.billing,
    options.config,
    options.request.plan.executionPlan.id
  );
  const entitlement = options.billing.getEntitlement(billingIdentity.userId) ?? null;
  const executionMode = resolveExecutionModeFlag(options.featureFlagRegistry);
  const refinementFlagEnabled = resolveContentRefinementFlag(options.featureFlagRegistry, {
    environment: options.config.environment,
    contentType: options.request.plan.contentType.id,
    userId: billingIdentity.userId
  });
  const betaEnabled = resolveRolloutFlag(options.featureFlagRegistry, "rollout.beta.access", {
    environment: options.config.environment,
    contentType: options.request.plan.contentType.id,
    userId: billingIdentity.userId
  }).enabled;
  const refinementEnabled = refinementFlagEnabled && (entitlement === null || entitlement.canRefine);
  return {
    billingIdentity,
    entitlement,
    executionMode,
    refinementEnabled,
    betaEnabled
  };
}

// src/product/usage/usage-policy-traffic.ts
var baseLimitByTier = {
  free: 25,
  starter: 100,
  pro: 500,
  enterprise: 5e3
};
function resolveTrafficLimit(tier, betaEnabled) {
  const baseLimit = baseLimitByTier[tier];
  if (baseLimit === null) {
    return null;
  }
  return betaEnabled ? baseLimit * 2 : baseLimit;
}

// src/product/usage/usage-policy.ts
function createBackendUsagePolicy(options) {
  const trafficCounters = /* @__PURE__ */ new Map();
  return {
    authorize(args) {
      return Effect11.gen(function* () {
        const {
          billingIdentity,
          entitlement,
          executionMode,
          refinementEnabled,
          betaEnabled
        } = resolveUsagePolicyContext({
          billing: options.billing,
          featureFlagRegistry: options.featureFlagRegistry,
          config: options.config,
          request: args
        });
        const trafficWindow = `${billingIdentity.userId}:${billingIdentity.planId}:${options.now().toISOString().slice(0, 10)}`;
        const trafficLimit = resolveTrafficLimit(entitlement?.tier ?? "free", betaEnabled);
        let trafficUsed;
        if (options.incrementTraffic) {
          const nextCount = yield* options.incrementTraffic(trafficWindow);
          if (trafficLimit !== null && nextCount > trafficLimit) {
            return yield* Effect11.fail(
              new BackendUsageAuthorizationError({
                userId: billingIdentity.userId,
                planId: billingIdentity.planId,
                reason: "traffic_limit",
                message: `Traffic limit reached for plan "${billingIdentity.planId}"`
              })
            );
          }
          trafficUsed = nextCount - 1;
        } else {
          trafficUsed = trafficCounters.get(trafficWindow) ?? 0;
        }
        const modelAllowed = entitlement === null || entitlement.allowedModels.length === 0 || entitlement.allowedModels.includes(args.model);
        yield* enforceUsagePolicyGuards({
          userId: billingIdentity.userId,
          planId: billingIdentity.planId,
          requestedExecutionMode: args.executionMode,
          resolvedExecutionMode: executionMode,
          entitlement,
          model: args.model,
          allowedModel: modelAllowed
        });
        if (trafficLimit !== null && trafficUsed >= trafficLimit) {
          return yield* Effect11.fail(
            new BackendUsageAuthorizationError({
              userId: billingIdentity.userId,
              planId: billingIdentity.planId,
              reason: "traffic_limit",
              message: `Traffic limit reached for plan "${billingIdentity.planId}"`
            })
          );
        }
        if (!options.incrementTraffic) {
          trafficCounters.set(trafficWindow, trafficUsed + 1);
        }
        return {
          userId: billingIdentity.userId,
          planId: billingIdentity.planId,
          executionMode: args.executionMode,
          qualityMode: args.qualityMode,
          trafficWindow,
          trafficLimit,
          trafficUsed: trafficUsed + 1,
          modelAllowed,
          refinementEnabled,
          betaEnabled,
          entitlement
        };
      });
    }
  };
}

// src/product/generation/generation-preview.ts
import { Effect as Effect32 } from "effect";

// src/product/billing/commercial-access.ts
function resolveQualityModeBlockedReason(args) {
  if (!args.entitlement) {
    return "plan_restriction";
  }
  if (!hasActiveBillingSubscription(args.entitlement)) {
    return "subscription_inactive";
  }
  if (!canUseQualityMode(args.entitlement, args.qualityMode)) {
    return "quality_mode_plan_restriction";
  }
  if (args.currentBalance < args.creditPrice) {
    return "insufficient_credits";
  }
  return void 0;
}
function isQualityModeAllowed(args) {
  return resolveQualityModeBlockedReason(args) === void 0;
}

// src/product/catalog/content-type-presets.ts
var CONTENT_TYPE_PRESETS = {
  "linkedin-post": {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "topic",
        label: "Topic",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Describe the main idea of the post."
      },
      {
        key: "audience",
        label: "Audience",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Specify who should care about the post."
      },
      {
        key: "angle",
        label: "Angle",
        type: "string",
        required: false,
        highImpact: false,
        helpText: "State the opinion or framing you want."
      },
      {
        key: "proof",
        label: "Proof points",
        type: "array",
        required: false,
        highImpact: false,
        helpText: "List concrete examples or evidence."
      }
    ],
    briefingGuidance: {
      objective: "Generate a concise LinkedIn post with a clear opinion.",
      tips: ["Use one concrete idea.", "Open with a direct hook.", "Keep the brief focused."],
      exampleBriefing: "I want a LinkedIn post about trade-offs in monorepos for senior engineers.",
      commonMistakes: ["Being too broad.", "Leaving the audience undefined."]
    }
  },
  newsletter: {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "topic",
        label: "Topic",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Describe the main theme of the newsletter."
      },
      {
        key: "audience",
        label: "Audience",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Specify the reader segment."
      },
      {
        key: "promise",
        label: "Core promise",
        type: "string",
        required: false,
        highImpact: false,
        helpText: "State the value the reader gets."
      },
      {
        key: "sections",
        label: "Sections",
        type: "array",
        required: false,
        highImpact: false,
        helpText: "List the sections or beats to include."
      }
    ],
    briefingGuidance: {
      objective: "Generate a newsletter brief with structure and payoff.",
      tips: ["Define the audience.", "Include the takeaway upfront.", "Suggest a section flow."],
      exampleBriefing: "I want a newsletter about shipping process improvements for product teams.",
      commonMistakes: ["Overloading the brief with unrelated topics."]
    }
  },
  "validation-post": {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "topic",
        label: "Topic",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Describe the issue being validated."
      },
      {
        key: "hypothesis",
        label: "Hypothesis",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "State what you want to prove or disprove."
      },
      {
        key: "evidence",
        label: "Evidence",
        type: "array",
        required: false,
        highImpact: false,
        helpText: "List the supporting facts or examples."
      }
    ],
    briefingGuidance: {
      objective: "Generate a short post that validates an idea with evidence.",
      tips: ["State the hypothesis clearly.", "Use examples that can be checked.", "Keep the brief direct."],
      exampleBriefing: "I want to validate a post about using a single domain model across services.",
      commonMistakes: ["Making the post sound like a generic announcement."]
    }
  },
  "architecture-post": {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "systemContext",
        label: "System context",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Describe the architecture or system boundaries."
      },
      {
        key: "tradeoffs",
        label: "Trade-offs",
        type: "array",
        required: true,
        highImpact: true,
        helpText: "List the main design trade-offs."
      },
      {
        key: "decision",
        label: "Decision",
        type: "string",
        required: false,
        highImpact: false,
        helpText: "State the recommendation or conclusion."
      }
    ],
    briefingGuidance: {
      objective: "Generate a post that explains a technical architecture decision.",
      tips: ["Give enough context to understand the system.", "Highlight the constraints.", "Make the trade-offs explicit."],
      exampleBriefing: "I want a post about why we split execution and voice services in the backend.",
      commonMistakes: ["Focusing on implementation details before the design choice."]
    }
  },
  "long-form-blog": {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "topic",
        label: "Topic",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Describe the article subject."
      },
      {
        key: "thesis",
        label: "Thesis",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "State the main argument."
      },
      {
        key: "outline",
        label: "Outline",
        type: "array",
        required: false,
        highImpact: false,
        helpText: "List the article sections."
      },
      {
        key: "audience",
        label: "Audience",
        type: "string",
        required: false,
        highImpact: false,
        helpText: "Specify who the article is for."
      }
    ],
    briefingGuidance: {
      objective: "Generate a long-form blog brief with thesis and structure.",
      tips: ["Define the thesis early.", "Keep the outline actionable.", "Add the audience and desired depth."],
      exampleBriefing: "I want a long-form blog post explaining how to migrate a backend to Hono and Effect.",
      commonMistakes: ["Creating a vague outline with no opinion."]
    }
  },
  "twitter-thread": {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "topic",
        label: "Topic",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Describe the thread subject."
      },
      {
        key: "hook",
        label: "Hook",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Write the opening hook."
      },
      {
        key: "beats",
        label: "Beats",
        type: "array",
        required: false,
        highImpact: false,
        helpText: "List the key thread beats."
      }
    ],
    briefingGuidance: {
      objective: "Generate a short thread with a strong hook and tight flow.",
      tips: ["Lead with tension.", "Keep each beat focused.", "End with a clear conclusion."],
      exampleBriefing: "I want a thread about the trade-offs of composition over inheritance in product code.",
      commonMistakes: ["Trying to fit too many ideas into one thread."]
    }
  }
};

// src/product/catalog/content-type-catalog.ts
function buildContentTypeCatalogView(definitions, context) {
  return definitions.map((definition) => buildContentTypeCatalogItem(definition, context)).sort((left, right) => left.label.localeCompare(right.label));
}
function buildContentTypeCatalogItem(definition, context) {
  const preset = CONTENT_TYPE_PRESETS[definition.id] ?? fallbackPreset(definition.id, definition.label);
  const available = context.subscriptionActive;
  const reasonCode = available ? void 0 : "subscription_inactive";
  const supportedLanguages = uniqueStrings([definition.defaultLanguage, context.userLanguage, ...preset.supportedLanguages]);
  const briefingGuidanceByLanguage = buildGuidanceByLanguage(preset.briefingGuidance, context.userLanguage);
  return {
    id: definition.id,
    label: definition.label,
    available,
    defaultLanguage: definition.defaultLanguage,
    supportedLanguages,
    steps: [...definition.steps],
    inputSchema: preset.inputSchema,
    briefingGuidance: briefingGuidanceByLanguage[definition.defaultLanguage] ?? preset.briefingGuidance,
    ...reasonCode ? { reasonCode } : {},
    ...Object.keys(briefingGuidanceByLanguage).length > 1 ? { briefingGuidanceByLanguage } : {}
  };
}
function buildGuidanceByLanguage(baseGuidance, userLanguage) {
  const guidance = {
    "pt-BR": baseGuidance,
    "en-US": translateGuidance(baseGuidance)
  };
  if (userLanguage !== "pt-BR" && userLanguage !== "en-US") {
    guidance[userLanguage] = baseGuidance;
  }
  return guidance;
}
function translateGuidance(guidance) {
  return {
    objective: `Generate a brief that leads to: ${guidance.objective}`,
    tips: guidance.tips.map((tip) => `Tip: ${tip}`),
    exampleBriefing: `Example brief: ${guidance.exampleBriefing}`,
    commonMistakes: guidance.commonMistakes.map((mistake) => `Avoid: ${mistake}`)
  };
}
function fallbackPreset(contentTypeId, label) {
  return {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "topic",
        label: "Topic",
        type: "string",
        required: true,
        highImpact: true,
        helpText: `Describe the main subject for ${label}.`
      }
    ],
    briefingGuidance: {
      objective: `Generate a useful ${label.toLowerCase()} brief.`,
      tips: ["State the topic clearly.", "Include the intended audience."],
      exampleBriefing: `I want a ${contentTypeId} about a practical topic.`,
      commonMistakes: ["Too much context without a clear goal."]
    }
  };
}
function uniqueStrings(values) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

// src/product/catalog/resolve-catalog-content-types.ts
function resolveCatalogContentTypeDefinitions(orchestrationCatalog) {
  return Object.values(orchestrationCatalog.contentTypes).map((contentType) => ({
    id: contentType.id,
    label: contentType.label,
    defaultLanguage: contentType.defaultLanguage,
    steps: [...contentType.steps],
    inputSchema: { ...contentType.inputSchema }
  }));
}

// src/product/billing/generation-pricing-snapshot.ts
import { createHash as createHash2 } from "node:crypto";
import { Effect as Effect31 } from "effect";

// ../../packages/orchestrator/src/catalog.ts
function createPipelineStep(name, skill, config) {
  return config ? { name, skill, config } : { name, skill };
}
function createPipelineDefinition(name, steps) {
  return { name, steps: [...steps] };
}
function humanizeLabel(value) {
  return value.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function createFallbackContentType(id, pipeline, language) {
  return {
    id,
    label: humanizeLabel(id),
    steps: pipeline.steps.map((step) => step.name),
    defaultLanguage: language,
    inputSchema: {}
  };
}
function createFallbackPipelineType(request) {
  return "pipelineType" in request ? request.pipelineType : null;
}
function createDefaultOrchestrationCatalog() {
  return {
    pipelines: {
      "long-form-blog": createPipelineDefinition("long-form-blog", [
        createPipelineStep("research", "research"),
        createPipelineStep("outline", "outline"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("finalize", "publish"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      "validation-post": createPipelineDefinition("validation-post", [
        createPipelineStep("analyze", "analyze"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      "architecture-post": createPipelineDefinition("architecture-post", [
        createPipelineStep("analyze", "analyze"),
        createPipelineStep("structure", "structure"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      "linkedin-post": createPipelineDefinition("linkedin-post", [
        createPipelineStep("hook", "hook"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      "twitter-thread": createPipelineDefinition("twitter-thread", [
        createPipelineStep("hook", "hook"),
        createPipelineStep("expand", "draft"),
        createPipelineStep("tighten", "refine"),
        createPipelineStep("sanitize", "sanitize")
      ]),
      newsletter: createPipelineDefinition("newsletter", [
        createPipelineStep("outline", "outline"),
        createPipelineStep("draft", "draft"),
        createPipelineStep("refine", "refine"),
        createPipelineStep("finalize", "publish"),
        createPipelineStep("sanitize", "sanitize")
      ])
    },
    contentTypes: {
      "long-form-blog": {
        id: "long-form-blog",
        label: "Long Form Blog",
        steps: ["research", "outline", "draft", "refine", "finalize", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      "validation-post": {
        id: "validation-post",
        label: "Validation Post",
        steps: ["analyze", "draft", "refine", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      "architecture-post": {
        id: "architecture-post",
        label: "Architecture Post",
        steps: ["analyze", "structure", "draft", "refine", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      "linkedin-post": {
        id: "linkedin-post",
        label: "LinkedIn Post",
        steps: ["hook", "draft", "refine", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      "twitter-thread": {
        id: "twitter-thread",
        label: "Twitter Thread",
        steps: ["hook", "expand", "tighten", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      },
      newsletter: {
        id: "newsletter",
        label: "Newsletter",
        steps: ["outline", "draft", "refine", "finalize", "sanitize"],
        defaultLanguage: "pt-BR",
        inputSchema: {}
      }
    },
    defaultLanguageByPipeline: {
      "long-form-blog": "pt-BR",
      "validation-post": "pt-BR",
      "architecture-post": "pt-BR",
      "linkedin-post": "pt-BR",
      "twitter-thread": "pt-BR",
      newsletter: "pt-BR"
    },
    defaultQualityModeByPipeline: {
      "long-form-blog": "strict",
      "validation-post": "balanced",
      "architecture-post": "strict",
      "linkedin-post": "balanced",
      "twitter-thread": "fast",
      newsletter: "balanced"
    }
  };
}

// ../../packages/orchestrator/src/execution.ts
import { Cause, Effect as Effect19, Option } from "effect";

// ../../packages/skills/src/errors.ts
import { Data as Data4 } from "effect";
var SkillAlreadyRegisteredError = class extends Data4.TaggedError("SkillAlreadyRegisteredError") {
};
var SkillDefinitionInvalidError = class extends Data4.TaggedError("SkillDefinitionInvalidError") {
};
var SkillPathForbiddenError = class extends Data4.TaggedError("SkillPathForbiddenError") {
};
var SkillModuleInvalidError = class extends Data4.TaggedError("SkillModuleInvalidError") {
};
var SkillModuleLoadError = class extends Data4.TaggedError("SkillModuleLoadError") {
};
var SkillTemplateError = class extends Data4.TaggedError("SkillTemplateError") {
};
var SkillSpecifierError = class extends Data4.TaggedError("SkillSpecifierError") {
};
var SkillPackageNameError = class extends Data4.TaggedError("SkillPackageNameError") {
};
var LanguageProfileNotFoundError = class extends Data4.TaggedError("LanguageProfileNotFoundError") {
};

// ../../packages/skills/src/context-path.ts
import { Effect as Effect12 } from "effect";

// ../../packages/skills/src/template.ts
import { Effect as Effect13 } from "effect";

// ../../packages/skills/src/language.ts
import { Effect as Effect14 } from "effect";

// ../../packages/skills/src/validation.ts
import { Effect as Effect15 } from "effect";

// ../../packages/skills/src/executor.ts
import { Effect as Effect16 } from "effect";

// ../../packages/skills/src/registry.ts
import { Context as Context3, Effect as Effect17, Layer as Layer3 } from "effect";
var SkillRegistryService = class extends Context3.Tag("SkillRegistryService")() {
};

// ../../packages/skills/src/loader.ts
import { Effect as Effect18 } from "effect";

// ../../packages/orchestrator/src/defaults.ts
var DEFAULT_ORCHESTRATION_POLICY = {
  allowPartialResults: true,
  retryLimitPerStep: 2,
  defaultExecutionMode: "sync",
  defaultQualityMode: "balanced",
  defaultLanguage: "pt-BR"
};
var DEFAULT_ORCHESTRATION_CATALOG = createDefaultOrchestrationCatalog();

// ../../packages/orchestrator/src/planning.ts
import { Effect as Effect20 } from "effect";

// ../../packages/domain/src/core.ts
function createExecutionPlan(plan) {
  return plan;
}
function createContentType(contentType) {
  return contentType;
}

// ../../packages/domain/src/errors.ts
import { Data as Data5 } from "effect";
var reasonCodeDefaultNextActions = {
  insufficient_examples: ["add_more_examples"],
  insufficient_diversity: ["add_examples_from_other_content_types"],
  conflicting_signals: ["review_conflicting_examples"],
  processing_failed: ["wait_for_profile_update"],
  plan_restriction: ["upgrade_plan"],
  subscription_inactive: ["upgrade_plan"],
  feature_flag_disabled: ["wait_for_profile_update"],
  rebuild_failed: ["wait_for_profile_update"],
  rebuild_in_progress: ["wait_for_profile_update"],
  reasoning_extraction_failed: ["wait_for_profile_update"],
  development_extraction_failed: ["wait_for_profile_update"],
  voice_signature_reconciliation_failed: ["wait_for_profile_update"],
  language_conflict: ["review_conflicting_examples"],
  too_many_pinned_examples: ["remove_pinned_example"],
  invalid_example_payload: ["retry_batch_commit"],
  batch_expired: ["retry_batch_commit"]
};
function nextActionCodesForReason(reasonCode) {
  return reasonCodeDefaultNextActions[reasonCode];
}
var VoiceExampleValidationError = class extends Data5.TaggedError("VoiceExampleValidationError") {
};
var VoiceBatchNotFoundError = class extends Data5.TaggedError("VoiceBatchNotFoundError") {
};
var VoiceBatchExpiredError = class extends Data5.TaggedError("VoiceBatchExpiredError") {
};
var VoiceProfileRebuildFailedError = class extends Data5.TaggedError("VoiceProfileRebuildFailedError") {
};
var VoicePinnedLimitExceededError = class extends Data5.TaggedError("VoicePinnedLimitExceededError") {
};
var ContentTypeUnavailableError = class extends Data5.TaggedError("ContentTypeUnavailableError") {
};

// ../../packages/orchestrator/src/planning.ts
function isExplicitPipelineRequest(request) {
  return "pipeline" in request;
}
function normalizePipelineRequest(request, options = {}) {
  const catalog = options.catalog ?? DEFAULT_ORCHESTRATION_CATALOG;
  const executionMode = options.executionMode ?? DEFAULT_ORCHESTRATION_POLICY.defaultExecutionMode;
  const qualityMode = options.qualityMode ?? DEFAULT_ORCHESTRATION_POLICY.defaultQualityMode;
  const defaultLanguage = options.defaultLanguage ?? DEFAULT_ORCHESTRATION_POLICY.defaultLanguage;
  const pipelineType = createFallbackPipelineType(request);
  const pipeline = resolvePipelineDefinition(request, catalog);
  const contentTypeId = "contentType" in request && request.contentType ? request.contentType : pipeline.name;
  const resolvedLanguage = "language" in request && request.language ? request.language : pipelineType ? catalog.defaultLanguageByPipeline[pipelineType] ?? defaultLanguage : defaultLanguage;
  const resolvedQualityMode = "qualityMode" in request && request.qualityMode ? request.qualityMode : pipelineType ? catalog.defaultQualityModeByPipeline[pipelineType] ?? qualityMode : qualityMode;
  let input;
  if (isExplicitPipelineRequest(request)) {
    input = {
      ...request.inputs ?? {},
      ...request.importedContext !== void 0 ? { importedContext: request.importedContext } : {}
    };
  } else if (typeof request.briefing === "object") {
    input = request.briefing;
  } else {
    input = { briefing: request.briefing };
  }
  return {
    variant: isExplicitPipelineRequest(request) ? "explicit" : "simplified",
    pipelineType,
    pipelineName: pipeline.name,
    contentTypeId,
    language: resolvedLanguage,
    qualityMode: resolvedQualityMode,
    executionMode,
    idempotencyKey: "idempotencyKey" in request && request.idempotencyKey ? request.idempotencyKey : null,
    input,
    pipeline
  };
}
function resolvePipelineDefinition(request, catalog = DEFAULT_ORCHESTRATION_CATALOG) {
  if (isExplicitPipelineRequest(request)) {
    return request.pipeline;
  }
  return catalog.pipelines[request.pipelineType];
}
function resolveContentType(request, catalog = DEFAULT_ORCHESTRATION_CATALOG) {
  const normalized = normalizePipelineRequest(request, { catalog });
  const definition = catalog.contentTypes[normalized.contentTypeId] ?? createFallbackContentType(
    normalized.contentTypeId,
    normalized.pipeline,
    normalized.language
  );
  return createContentType({
    id: definition.id,
    label: definition.label,
    defaultLanguage: definition.defaultLanguage,
    steps: [...definition.steps],
    inputSchema: definition.inputSchema
  });
}
function estimateStepCount(pipeline) {
  return pipeline.steps.length;
}
function calculateProgressPercent(completedSteps, totalSteps) {
  if (totalSteps <= 0) {
    return 0;
  }
  const boundedCompletedSteps = Math.max(0, Math.min(completedSteps, totalSteps));
  return Math.round(boundedCompletedSteps / totalSteps * 100);
}
function buildStepProgress(pipeline) {
  const totalSteps = pipeline.steps.length;
  return pipeline.steps.map((step, index) => ({
    stepName: step.name,
    stepIndex: index,
    totalSteps,
    percent: calculateProgressPercent(index + 1, totalSteps),
    status: index === 0 ? "running" : "pending",
    skill: step.skill
  }));
}
function buildOrchestrationPlan(request, options = {}) {
  const catalog = options.catalog ?? DEFAULT_ORCHESTRATION_CATALOG;
  const normalized = normalizePipelineRequest(request, {
    catalog,
    executionMode: options.executionMode ?? DEFAULT_ORCHESTRATION_POLICY.defaultExecutionMode,
    qualityMode: options.qualityMode ?? DEFAULT_ORCHESTRATION_POLICY.defaultQualityMode,
    defaultLanguage: options.defaultLanguage ?? DEFAULT_ORCHESTRATION_POLICY.defaultLanguage
  });
  const contentType = resolveContentType(request, catalog);
  const executionPlan = createExecutionPlan({
    id: normalized.contentTypeId,
    pipeline: normalized.pipeline,
    input: normalized.input,
    mode: normalized.executionMode,
    qualityMode: normalized.qualityMode
  });
  const estimatedSteps = estimateStepCount(normalized.pipeline);
  const qualityLanes = buildQualityLanes(normalized.pipeline, {
    laneCount: normalized.qualityMode === "strict" ? 3 : normalized.qualityMode === "balanced" ? 2 : 1,
    adapter: normalized.executionMode === "async" ? "backend-async" : "backend-sync",
    model: `${normalized.contentTypeId}-${normalized.qualityMode}`
  });
  return {
    request: normalized,
    pipelineType: normalized.pipelineType,
    pipeline: normalized.pipeline,
    contentType,
    executionPlan,
    estimatedSteps,
    progress: {
      currentStep: normalized.pipeline.steps[0]?.name ?? "queued",
      stepIndex: 0,
      totalSteps: estimatedSteps,
      percent: 0
    },
    stepProgress: buildStepProgress(normalized.pipeline),
    qualityLanes
  };
}
function buildQualityLanes(pipeline, options) {
  const laneCount = Math.max(1, Math.min(options.laneCount ?? 1, 3));
  const baseTemperature = options.baseTemperature ?? 0.4;
  const strategies = ["conservative", "balanced", "creative"];
  return Array.from({ length: laneCount }, (_, index) => {
    const strategy = strategies[index] ?? "balanced";
    return {
      laneId: `${pipeline.name}:lane:${index + 1}`,
      adapter: options.adapter,
      model: `${options.model}:${strategy}`,
      temperature: clampTemperature(baseTemperature + index * 0.2),
      strategy,
      generate: () => Effect20.succeed(
        [
          `Pipeline: ${pipeline.name}`,
          `Lane: ${index + 1}`,
          `Strategy: ${strategy}`,
          `Focus: preserve user voice, remove LLM tone, keep fidelity`
        ].join("\n")
      )
    };
  });
}
function clampTemperature(value) {
  return Math.max(0, Math.min(1, value));
}

// ../../packages/orchestrator/src/orchestration-runtime.ts
import { Effect as Effect28 } from "effect";

// ../../packages/core/src/index.ts
import { Context as Context7, Effect as Effect24, Layer as Layer7 } from "effect";

// ../../packages/core/src/errors.ts
import { Data as Data6 } from "effect";
var ValidationError = class extends Data6.TaggedError("ValidationError") {
};
var StepExecutionError = class extends Data6.TaggedError("StepExecutionError") {
};
var TemplateError = class extends Data6.TaggedError("TemplateError") {
};

// ../../packages/core/src/context-manager.ts
import { Context as Context4, Effect as Effect21, Layer as Layer4, Ref } from "effect";
var ContextManagerService = class extends Context4.Tag("ContextManagerService")() {
};

// ../../packages/core/src/trace.ts
import { Context as Context5, Effect as Effect22, Layer as Layer5, Ref as Ref2 } from "effect";
var TraceRecorderService = class extends Context5.Tag("TraceRecorderService")() {
};

// ../../packages/core/src/template-service.ts
import { Context as Context6, Effect as Effect23, Layer as Layer6 } from "effect";
var TemplateService = class extends Context6.Tag("TemplateService")() {
};

// ../../packages/core/src/index.ts
var RuntimeConfigService = class extends Context7.Tag("RuntimeConfigService")() {
};
var LoggerService = class extends Context7.Tag("LoggerService")() {
};
var TracerService = class extends Context7.Tag("TracerService")() {
};
var ExecutionStrategyService = class extends Context7.Tag("ExecutionStrategyService")() {
};

// ../../packages/orchestrator/src/orchestration-loop-progress.ts
import { Effect as Effect26 } from "effect";

// ../../packages/orchestrator/src/progress-handler.ts
import { Effect as Effect25 } from "effect";

// ../../packages/orchestrator/src/orchestration-errors.ts
import { Data as Data7 } from "effect";
var OrchestrationSkillNotFoundError = class extends Data7.TaggedError("OrchestrationSkillNotFoundError") {
};
var OrchestrationStepFailedError = class extends Data7.TaggedError("OrchestrationStepFailedError") {
};
var OrchestrationPipelineExhaustedError = class extends Data7.TaggedError("OrchestrationPipelineExhaustedError") {
};
var OrchestrationContextError = class extends Data7.TaggedError("OrchestrationContextError") {
};
var OrchestrationRetryExhaustedError = class extends Data7.TaggedError("OrchestrationRetryExhaustedError") {
};
var OrchestrationCancelledError = class extends Data7.TaggedError("OrchestrationCancelledError") {
};
var OrchestrationAdapterError = class extends Data7.TaggedError("OrchestrationAdapterError") {
};

// ../../packages/orchestrator/src/orchestration-step-runtime.ts
import { Effect as Effect27 } from "effect";

// ../../packages/orchestrator/src/orchestration-service.ts
import { Context as Context8 } from "effect";
var OrchestratorServiceTag = class extends Context8.Tag("OrchestratorService")() {
};

// ../../packages/orchestrator/src/orchestrator-layer.ts
import { Effect as Effect30, Layer as Layer8 } from "effect";

// ../../packages/orchestrator/src/orchestrator-services.ts
import { Context as Context9 } from "effect";
var OrchestrationCatalogService = class extends Context9.Tag("OrchestrationCatalogService")() {
};
var OrchestrationPlannerService = class extends Context9.Tag("OrchestrationPlannerService")() {
};
var OrchestrationPolicyServiceTag = class extends Context9.Tag("OrchestrationPolicyService")() {
};
var OrchestrationStrategyService = class extends Context9.Tag("OrchestrationStrategyService")() {
};
var OrchestrationJobCoordinatorService = class extends Context9.Tag("OrchestrationJobCoordinatorService")() {
};

// src/product/billing/generation-pricing-snapshot.ts
function toGenerationPricingSnapshot(pricingEnvelope) {
  return {
    quoteId: createGenerationQuoteId({
      policyVersion: pricingEnvelope.policyVersion,
      planTier: pricingEnvelope.planTier,
      contentType: pricingEnvelope.contentType,
      qualityMode: pricingEnvelope.qualityMode,
      creditPrice: pricingEnvelope.creditPrice
    }),
    policyVersion: pricingEnvelope.policyVersion,
    contentType: pricingEnvelope.contentType,
    qualityMode: pricingEnvelope.qualityMode,
    creditPrice: pricingEnvelope.creditPrice
  };
}
function createGenerationQuoteId(seed) {
  const canonical = JSON.stringify([
    seed.policyVersion,
    seed.planTier,
    seed.contentType,
    seed.qualityMode,
    seed.creditPrice
  ]);
  return `quote_${createHash2("sha256").update(canonical).digest("hex")}`;
}

// src/product/generation/generation-preview-recommendation.ts
var QUALITY_MODE_FALLBACK_ORDER = {
  fast: ["fast", "balanced", "strict"],
  balanced: ["balanced", "fast", "strict"],
  strict: ["strict", "balanced", "fast"]
};
function recommendGenerationPreviewQualityMode(args) {
  const allowedModes = args.qualityModes.filter((mode) => mode.allowed).map((mode) => mode.id);
  if (allowedModes.length === 0) {
    return null;
  }
  const briefing = analyzeBriefing(args.briefing);
  const preferredMode = selectPreferredQualityMode(args.contentType, briefing, args.hasVoiceProfile);
  const qualityMode = selectAllowedQualityMode(preferredMode, allowedModes);
  const reasonCodes = buildReasonCodes({
    contentType: args.contentType,
    briefing,
    hasVoiceProfile: args.hasVoiceProfile,
    preferredMode,
    recommendedMode: qualityMode
  });
  return {
    qualityMode,
    reasonCodes,
    explanation: buildExplanation(qualityMode, preferredMode, reasonCodes)
  };
}
function selectPreferredQualityMode(contentType, briefing, hasVoiceProfile) {
  const hasComplexContentType = contentType.steps.length >= 4 || countHighImpactFields(contentType) >= 3;
  const hasDetailedBriefing = briefing.wordCount >= 80 || briefing.filledFieldCount >= 4;
  const hasStructuredBriefing = briefing.arrayItemCount >= 3;
  const hasSimpleRequest = contentType.steps.length <= 2 && countHighImpactFields(contentType) <= 2 && briefing.wordCount > 0 && briefing.wordCount <= 24 && briefing.filledFieldCount <= 2 && briefing.arrayItemCount === 0 && !hasVoiceProfile;
  if (hasComplexContentType && (hasDetailedBriefing || hasStructuredBriefing || hasVoiceProfile)) {
    return "strict";
  }
  if (hasSimpleRequest) {
    return "fast";
  }
  return "balanced";
}
function selectAllowedQualityMode(preferredMode, allowedModes) {
  return QUALITY_MODE_FALLBACK_ORDER[preferredMode].find((mode) => allowedModes.includes(mode)) ?? allowedModes[0] ?? "balanced";
}
function buildReasonCodes(args) {
  const reasonCodes = [];
  const highImpactFields = countHighImpactFields(args.contentType);
  if (args.preferredMode === "strict") {
    if (args.contentType.steps.length >= 4 || highImpactFields >= 3) {
      reasonCodes.push("complex_content_type");
    }
    if (args.briefing.wordCount >= 80 || args.briefing.filledFieldCount >= 4) {
      reasonCodes.push("detailed_briefing");
    }
    if (args.briefing.arrayItemCount >= 3) {
      reasonCodes.push("structured_briefing");
    }
    if (args.hasVoiceProfile) {
      reasonCodes.push("voice_profile_available");
    }
  }
  if (args.preferredMode === "fast") {
    reasonCodes.push("simple_request");
  }
  if (args.preferredMode === "balanced") {
    if (args.briefing.filledFieldCount >= 3 || args.briefing.arrayItemCount >= 1) {
      reasonCodes.push("structured_briefing");
    }
    reasonCodes.push("balanced_default");
  }
  if (args.recommendedMode !== args.preferredMode) {
    reasonCodes.push("allowed_option_guard");
  }
  return reasonCodes.length > 0 ? unique(reasonCodes) : ["balanced_default"];
}
function buildExplanation(recommendedMode, preferredMode, reasonCodes) {
  if (reasonCodes.includes("allowed_option_guard") && recommendedMode !== preferredMode) {
    return `${capitalize(recommendedMode)} is recommended because it best fits this request within your currently available options.`;
  }
  if (recommendedMode === "strict") {
    return "Strict is recommended for a more complex request with richer context to preserve.";
  }
  if (recommendedMode === "fast") {
    return "Fast is recommended for a shorter request with lower structural complexity.";
  }
  return "Balanced is recommended because this request benefits from structure without needing the highest-cost mode.";
}
function countHighImpactFields(contentType) {
  return contentType.inputSchema.filter((field) => field.highImpact).length;
}
function analyzeBriefing(briefing) {
  if (!briefing) {
    return {
      wordCount: 0,
      filledFieldCount: 0,
      arrayItemCount: 0
    };
  }
  if (typeof briefing === "string") {
    return {
      wordCount: countWords(briefing),
      filledFieldCount: briefing.trim().length > 0 ? 1 : 0,
      arrayItemCount: 0
    };
  }
  const values = Object.values(briefing);
  return {
    wordCount: values.reduce((total, value) => total + countWordsFromUnknown(value), 0),
    filledFieldCount: values.filter(hasMeaningfulValue).length,
    arrayItemCount: values.reduce((total, value) => total + countArrayItems(value), 0)
  };
}
function countWordsFromUnknown(value) {
  if (typeof value === "string") {
    return countWords(value);
  }
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countWordsFromUnknown(item), 0);
  }
  if (value && typeof value === "object") {
    return Object.values(value).reduce((total, item) => total + countWordsFromUnknown(item), 0);
  }
  return 0;
}
function countArrayItems(value) {
  if (!Array.isArray(value)) {
    return 0;
  }
  return value.filter(hasMeaningfulValue).length;
}
function hasMeaningfulValue(value) {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.some(hasMeaningfulValue);
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(hasMeaningfulValue);
  }
  return value !== null && value !== void 0;
}
function countWords(value) {
  const normalized = value.trim();
  return normalized.length === 0 ? 0 : normalized.split(/\s+/u).length;
}
function unique(values) {
  return [...new Set(values)];
}
function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// src/product/generation/generation-preview.ts
var QUALITY_MODES = ["fast", "balanced", "strict"];
function createBackendGenerationPreviewService(options) {
  return {
    preview(args) {
      return Effect32.gen(function* () {
        const sanitizedArgs = yield* options.inputSafety.authorizePreviewInput(args);
        const voiceProfile = yield* options.database.voiceProfiles.getByUser(sanitizedArgs.userId);
        const entitlement = resolveStoredUserEntitlement(options.billing, sanitizedArgs.userId) ?? null;
        const currentBalance = entitlement?.wallet.availableCredits ?? 0;
        const primaryLanguage = sanitizedArgs.language ?? voiceProfile?.primaryLanguage ?? options.config.defaultLanguage;
        const orchestrationCatalog = options.aiPolicy.getActiveOrchestrationCatalog();
        const contentTypes = buildContentTypeCatalogView(
          resolveCatalogContentTypeDefinitions(orchestrationCatalog),
          {
            userLanguage: primaryLanguage,
            subscriptionActive: entitlement?.status === "active"
          }
        );
        const planTier = entitlement?.tier ?? "free";
        const selectedContentType = selectContentType(sanitizedArgs.contentType, contentTypes);
        const qualityModePricing = yield* Effect32.all(
          QUALITY_MODES.map(
            (mode) => options.aiPolicy.resolvePricingEnvelope({
              planTier,
              contentType: selectedContentType.id,
              qualityMode: mode,
              attachedPolicyVersion: options.config.aiPolicyAttachedVersion
            })
          )
        );
        const qualityModes = qualityModePricing.map((pricing) => {
          const creditPrice = pricing.creditPrice;
          const allowed = isQualityModeAllowed({
            entitlement,
            qualityMode: pricing.qualityMode,
            creditPrice,
            currentBalance
          });
          const blockedReason = allowed ? void 0 : resolvePreviewQualityModeBlockedReason({
            entitlement,
            qualityMode: pricing.qualityMode,
            creditPrice,
            currentBalance
          });
          return {
            id: pricing.qualityMode,
            allowed,
            creditPrice,
            ...blockedReason ? { blockedReason } : {}
          };
        });
        const selectedQualityMode = selectQualityMode(sanitizedArgs.qualityMode, qualityModes);
        const includeRecommendation = sanitizedArgs.includeRecommendation !== false;
        const recommendation = includeRecommendation ? recommendGenerationPreviewQualityMode({
          contentType: selectedContentType,
          briefing: sanitizedArgs.briefing,
          hasVoiceProfile: voiceProfile !== null,
          qualityModes
        }) : null;
        const pricingSnapshot = yield* options.aiPolicy.resolvePricingEnvelope({
          planTier,
          contentType: selectedContentType.id,
          qualityMode: selectedQualityMode,
          attachedPolicyVersion: options.config.aiPolicyAttachedVersion
        });
        const commercialPricingSnapshot = toGenerationPricingSnapshot(pricingSnapshot);
        return {
          pricingSnapshot: commercialPricingSnapshot,
          currentBalance,
          projectedBalanceAfterGeneration: roundCredits2(currentBalance - pricingSnapshot.creditPrice),
          recommendation: recommendation ? {
            qualityMode: recommendation.qualityMode,
            reasonCodes: [...recommendation.reasonCodes],
            explanation: recommendation.explanation
          } : void 0,
          options: {
            contentTypes: contentTypes.map((contentType) => ({
              id: contentType.id,
              label: contentType.label,
              allowed: contentType.available,
              ...contentType.reasonCode ? {
                blockedReason: !entitlement ? "plan_restriction" : contentType.reasonCode
              } : {}
            })),
            qualityModes: qualityModes.map((mode) => ({
              ...mode,
              ...recommendation && recommendation.qualityMode === mode.id ? {
                recommended: true,
                recommendation: {
                  reasonCodes: [...recommendation.reasonCodes],
                  explanation: recommendation.explanation
                }
              } : {}
            }))
          }
        };
      });
    }
  };
}
function selectContentType(requestedContentType, contentTypes) {
  return (requestedContentType ? contentTypes.find((contentType) => contentType.id === requestedContentType) : void 0) ?? contentTypes.find((contentType) => contentType.available) ?? contentTypes[0] ?? {
    id: "unknown",
    label: "Unknown",
    available: false,
    defaultLanguage: "pt-BR",
    supportedLanguages: ["pt-BR"],
    steps: [],
    inputSchema: [],
    briefingGuidance: {
      objective: "No content type available.",
      tips: [],
      exampleBriefing: "",
      commonMistakes: []
    }
  };
}
function selectQualityMode(requestedQualityMode, qualityModes) {
  if (requestedQualityMode) {
    const requested = qualityModes.find((mode) => mode.id === requestedQualityMode);
    if (requested?.allowed) {
      return requested.id;
    }
  }
  return qualityModes.find((mode) => mode.allowed)?.id ?? qualityModes[0]?.id ?? "balanced";
}
function roundCredits2(value) {
  return Math.ceil(value * 10) / 10;
}
function resolvePreviewQualityModeBlockedReason(args) {
  return resolveQualityModeBlockedReason(args) ?? "plan_restriction";
}

// src/safety/public-input-safety.ts
import { Effect as Effect37 } from "effect";

// src/safety/instruction-override-detector.ts
import { Effect as Effect33 } from "effect";
var detectorId = "instruction-override-classifier";
var heuristicRules = [
  {
    rationaleCategory: "prompt_exfiltration",
    confidence: "high",
    blocking: true,
    pattern: /\b(reveal|show|print|dump|return|expose)\b[\s\S]{0,80}\b(system prompt|developer message|hidden instructions?)\b/i
  },
  {
    rationaleCategory: "role_escalation",
    confidence: "high",
    blocking: true,
    pattern: /\b(you are now|act as|switch to)\b[\s\S]{0,40}\b(system|developer|admin|root)\b/i
  },
  {
    rationaleCategory: "ignore_previous_instructions",
    confidence: "high",
    blocking: false,
    pattern: /\b(ignore|disregard|override|forget)\b[\s\S]{0,50}\b(previous|prior|above)\b[\s\S]{0,40}\b(instructions?|rules?)\b/i
  },
  {
    rationaleCategory: "ignore_previous_instructions",
    confidence: "high",
    blocking: false,
    pattern: /\b(ignor[ae]|esque[cç]a|desconsider[ae])\b[\s\S]{0,50}\b(instru[cç][oõ]es?|regras?)\b[\s\S]{0,40}\b(anteriores?|pr[eé]vias?|acima)\b/i
  },
  {
    rationaleCategory: "prompt_exfiltration",
    confidence: "high",
    blocking: true,
    pattern: /\b(revele?|mostre|exiba|imprima|retorne)\b[\s\S]{0,80}\b(prompt do sistema|instru[cç][oõ]es? ocultas?|mensagem do desenvolvedor)\b/i
  },
  {
    rationaleCategory: "role_escalation",
    confidence: "high",
    blocking: true,
    pattern: /\b(voc[eê] agora [eé]|aja como|mude para)\b[\s\S]{0,40}\b(sistema|desenvolvedor|admin|root)\b/i
  },
  {
    rationaleCategory: "policy_bypass_request",
    confidence: "high",
    blocking: false,
    pattern: /\b(bypass|disable|turn off)\b[\s\S]{0,40}\b(safety|guardrails?|policy|filters?)\b/i
  },
  {
    rationaleCategory: "system_prompt_reference",
    confidence: "low",
    blocking: false,
    pattern: /\bsystem prompt\b/i
  },
  {
    rationaleCategory: "developer_message_reference",
    confidence: "low",
    blocking: false,
    pattern: /\bdeveloper message\b/i
  }
];
function createHeuristicInstructionOverrideDetector(options = {}) {
  return {
    detect(args) {
      if (options.shouldFail) {
        return Effect33.fail(
          new BackendInstructionOverrideDetectorFailureError({
            boundary: args.boundary,
            detectorId,
            critical: options.criticalFailure ?? true,
            message: options.failureMessage ?? "Instruction override detector is unavailable"
          })
        );
      }
      return Effect33.succeed(
        args.fields.flatMap((field) => detectField(field.field, field.value))
      );
    }
  };
}
function detectField(field, value) {
  return heuristicRules.flatMap(
    (rule) => rule.pattern.test(value) ? [
      {
        detectorId,
        field,
        confidence: rule.confidence,
        rationaleCategory: rule.rationaleCategory,
        blocking: rule.blocking
      }
    ] : []
  );
}

// src/safety/public-input-safety-decision.ts
import { Effect as Effect34 } from "effect";

// src/safety/public-input-safety-shared.ts
var inputFieldKeys = ["briefing", "context", "importedContext", "inputs"];
function dedupeStrings2(values) {
  return [...new Set(values)];
}

// src/safety/public-input-safety-decision.ts
function requireAllowedDecision(decision) {
  if (decision.outcome === "approve" || decision.outcome === "sanitize") {
    return Effect34.succeed(decision.sanitizedInput);
  }
  const categories = dedupeStrings2(decision.findings.map((finding) => finding.category));
  const fields = dedupeStrings2(decision.findings.map((finding) => finding.field));
  const message = decision.outcome === "quarantine" ? "Input requires manual review before preview or generation can continue." : "Input includes restricted or sensitive material and cannot be used for generation.";
  return Effect34.fail(
    new BackendInputSafetyPolicyError({
      boundary: decision.boundary,
      outcome: decision.outcome,
      message,
      categories,
      fields
    })
  );
}
function determineDecisionOutcome(args) {
  const classificationOutcomes = args.findings.map((finding) => {
    const classification = args.classifications.get(finding.category);
    if (!classification) {
      return "block";
    }
    if (!finding.field.startsWith("importedContext")) {
      return classification.defaultOutcome;
    }
    if (finding.category === "imported_context_out_of_scope") {
      return "block";
    }
    if (classification.defaultOutcome === "sanitize") {
      return "quarantine";
    }
    return classification.defaultOutcome;
  });
  if (args.overrideAttempt.status === "block") {
    return "block";
  }
  if (args.overrideAttempt.status === "quarantine") {
    return "quarantine";
  }
  if (classificationOutcomes.some((outcome) => outcome === "block")) {
    return "block";
  }
  if (classificationOutcomes.some((outcome) => outcome === "quarantine")) {
    return "quarantine";
  }
  if (args.findings.some((finding) => finding.sanitized) || classificationOutcomes.some((outcome) => outcome === "sanitize")) {
    return "sanitize";
  }
  if (args.hasImportedContext && args.importedContextFamily && !args.importedContextFamily.allowedOutcomes.includes("approve")) {
    return "block";
  }
  return "approve";
}

// src/safety/public-input-safety-inspection.ts
import { Effect as Effect35 } from "effect";
var personalDataPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/,
  /\b\+?\d{2,3}\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}\b/
];
var confidentialDataPatterns = [
  /\bconfidential\b/i,
  /\bnda\b/i,
  /\bproprietary\b/i,
  /\bcustomer list\b/i,
  /\binternal roadmap\b/i
];
var operationalDataPatterns = [
  /\b(internal|hidden|current)\s+system prompt\b/i,
  /\b(internal|hidden|current)\s+developer message\b/i,
  /\binternal runbook\b/i,
  /\bops[-\s]?only\b/i
];
var securitySensitivePatterns = [
  /\bapi[_\s-]?key\b/i,
  /\bauthorization:\s*bearer\b/i,
  /\bsecret[_\s-]?access[_\s-]?key\b/i,
  /\bpassword\s*[:=]/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bssh-rsa\b/
];
var prohibitedPatterns = [
  /\bcvv\b/i,
  /\bsocial security number\b/i,
  /\bfull card number\b/i
];
var securitySensitiveKeyPattern = /(password|secret|token|api[_-]?key|authorization)/i;
var importedContextMaxLength = 8e3;
function inspectRequestInput(request) {
  return Effect35.sync(() => {
    const findings = [];
    const sanitizedInput = {};
    for (const key of inputFieldKeys) {
      const value = request[key];
      if (value === void 0) {
        continue;
      }
      const previousFindingsCount = findings.length;
      const inspection = key === "importedContext" ? inspectImportedContext(value, key) : inspectValue(value, key);
      findings.push(...inspection.findings);
      if (findings.length === previousFindingsCount) {
        findings.push({
          category: "ordinary_generation_input",
          field: key,
          sanitized: false
        });
      }
      if (key === "briefing") {
        sanitizedInput.briefing = inspection.sanitizedValue;
      } else if (key === "context") {
        sanitizedInput.context = inspection.sanitizedValue;
      } else if (key === "importedContext") {
        sanitizedInput.importedContext = inspection.sanitizedValue;
      } else {
        sanitizedInput.inputs = inspection.sanitizedValue;
      }
    }
    return {
      sanitizedInput,
      findings
    };
  });
}
function inspectImportedContext(value, fieldPath) {
  if (typeof value !== "string") {
    return {
      sanitizedValue: "",
      findings: [
        {
          category: "imported_context_out_of_scope",
          field: fieldPath,
          sanitized: false
        }
      ]
    };
  }
  if (value.length > importedContextMaxLength) {
    return {
      sanitizedValue: value.slice(0, importedContextMaxLength),
      findings: [
        {
          category: "imported_context_out_of_scope",
          field: fieldPath,
          sanitized: false
        }
      ]
    };
  }
  return inspectText(value, fieldPath);
}
function inspectValue(value, fieldPath) {
  if (typeof value === "string") {
    return inspectText(value, fieldPath);
  }
  if (Array.isArray(value)) {
    const findings = [];
    const sanitizedValue = value.map((entry, index) => {
      const inspected = inspectValue(entry, `${fieldPath}[${index}]`);
      findings.push(...inspected.findings);
      return inspected.sanitizedValue;
    });
    return {
      sanitizedValue,
      findings
    };
  }
  if (value && typeof value === "object") {
    const findings = [];
    const sanitizedEntries = Object.entries(value).map(([key, entryValue]) => {
      if (securitySensitiveKeyPattern.test(key)) {
        findings.push({
          category: "security_sensitive_data",
          field: `${fieldPath}.${key}`,
          sanitized: false
        });
      }
      const inspected = inspectValue(entryValue, `${fieldPath}.${key}`);
      findings.push(...inspected.findings);
      return [key, inspected.sanitizedValue];
    });
    return {
      sanitizedValue: Object.fromEntries(sanitizedEntries),
      findings
    };
  }
  return {
    sanitizedValue: value,
    findings: []
  };
}
function inspectText(value, fieldPath) {
  const normalized = normalizeWhitespace(stripMarkup(value));
  const markupSanitized = normalized !== value;
  if (matchesAny(securitySensitivePatterns, normalized)) {
    return blockedResult("security_sensitive_data", fieldPath, normalized, markupSanitized);
  }
  if (matchesAny(prohibitedPatterns, normalized)) {
    return blockedResult("llm_prohibited_data", fieldPath, normalized, markupSanitized);
  }
  if (matchesAny(operationalDataPatterns, normalized)) {
    return blockedResult("operational_data", fieldPath, normalized, markupSanitized);
  }
  if (matchesAny(confidentialDataPatterns, normalized)) {
    return {
      sanitizedValue: normalized,
      findings: [
        {
          category: "customer_confidential_data",
          field: fieldPath,
          sanitized: markupSanitized
        }
      ]
    };
  }
  const redactedPersonalData = redactPersonalData(normalized);
  if (redactedPersonalData !== normalized) {
    return {
      sanitizedValue: redactedPersonalData,
      findings: [
        {
          category: "personal_data",
          field: fieldPath,
          sanitized: true
        }
      ]
    };
  }
  return {
    sanitizedValue: normalized,
    findings: normalized !== value ? [
      {
        category: "ordinary_generation_input",
        field: fieldPath,
        sanitized: true
      }
    ] : []
  };
}
function blockedResult(category, field, sanitizedValue, sanitized) {
  return {
    sanitizedValue,
    findings: [
      {
        category,
        field,
        sanitized
      }
    ]
  };
}
function stripMarkup(value) {
  return value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}
function normalizeWhitespace(value) {
  return value.replace(/\u0000/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function redactPersonalData(value) {
  return personalDataPatterns.reduce((current, pattern) => {
    if (!pattern.test(current)) {
      return current;
    }
    return current.replace(pattern, "[redacted-personal-data]");
  }, value);
}
function matchesAny(patterns, value) {
  return patterns.some((pattern) => pattern.test(value));
}

// src/safety/instruction-override-verdict.ts
import { Effect as Effect36 } from "effect";
function evaluateInstructionOverrideAttempt(args) {
  const fields = collectInstructionOverrideFields(args.request);
  return Effect36.gen(function* () {
    const events = yield* args.detector.detect({
      boundary: args.boundary,
      fields
    }).pipe(
      Effect36.catchTag(
        "BackendInstructionOverrideDetectorFailureError",
        (error) => error.critical ? Effect36.fail(
          new BackendInputSafetyGatewayFailureError({
            boundary: args.boundary,
            reason: "override_detector_failed",
            message: "Input safety checks are temporarily unavailable. Try again later."
          })
        ) : Effect36.succeed([])
      )
    );
    return toInstructionOverrideVerdict(events);
  });
}
function collectInstructionOverrideFields(request) {
  return inputFieldKeys.flatMap((key) => collectTextFieldsForValue(key, request[key]));
}
function collectTextFieldsForValue(field, value) {
  if (typeof value === "string") {
    return value.trim().length > 0 ? [{ field, value }] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectTextFieldsForValue(`${field}[${index}]`, entry));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(
      ([key, entryValue]) => collectTextFieldsForValue(`${field}.${key}`, entryValue)
    );
  }
  return [];
}
function toInstructionOverrideVerdict(events) {
  if (events.length === 0) {
    return {
      status: "clear",
      blocking: false,
      confidence: null,
      rationaleCategories: [],
      events: []
    };
  }
  const highestConfidence = selectHighestConfidence(events.map((event) => event.confidence));
  const hasBlockingEvent = events.some((event) => event.blocking && event.confidence === "high");
  const hasHighConfidenceEvent = events.some((event) => event.confidence === "high");
  return {
    status: hasBlockingEvent ? "block" : hasHighConfidenceEvent ? "quarantine" : "observe",
    blocking: hasBlockingEvent || hasHighConfidenceEvent,
    confidence: highestConfidence,
    rationaleCategories: dedupeStrings2(events.map((event) => event.rationaleCategory)),
    events
  };
}
function selectHighestConfidence(confidences) {
  if (confidences.includes("high")) {
    return "high";
  }
  if (confidences.includes("medium")) {
    return "medium";
  }
  return "low";
}

// src/safety/public-input-safety.ts
function createBackendPublicInputSafetyGatewayService(args) {
  const instructionOverrideDetector = args.instructionOverrideDetector ?? createHeuristicInstructionOverrideDetector();
  return {
    evaluatePreviewInput(request) {
      return evaluateInput({
        boundary: "preview",
        request,
        safetyPolicy: args.safetyPolicy,
        instructionOverrideDetector,
        policyEvidence: args.policyEvidence
      });
    },
    evaluateGenerationInput(request) {
      return evaluateInput({
        boundary: "generation",
        request,
        safetyPolicy: args.safetyPolicy,
        instructionOverrideDetector,
        policyEvidence: args.policyEvidence
      });
    },
    authorizePreviewInput(request) {
      return Effect37.flatMap(
        evaluateInput({
          boundary: "preview",
          request,
          safetyPolicy: args.safetyPolicy,
          instructionOverrideDetector,
          policyEvidence: args.policyEvidence
        }),
        (decision) => Effect37.map(requireAllowedDecision(decision), (sanitizedInput) => ({
          ...request,
          ...sanitizedInput
        }))
      );
    },
    authorizeGenerationInput(request) {
      return Effect37.flatMap(
        evaluateInput({
          boundary: "generation",
          request,
          safetyPolicy: args.safetyPolicy,
          instructionOverrideDetector,
          policyEvidence: args.policyEvidence
        }),
        (decision) => Effect37.map(requireAllowedDecision(decision), (sanitizedInput) => ({
          ...request,
          ...sanitizedInput
        }))
      );
    }
  };
}
function evaluateInput(args) {
  return Effect37.gen(function* () {
    const inputFamily = yield* args.safetyPolicy.getPolicyFamily("input");
    const hasImportedContext = args.request.importedContext !== void 0;
    const importedContextFamily = hasImportedContext ? yield* args.safetyPolicy.getPolicyFamily("imported_context") : null;
    const sanitizedInput = yield* inspectRequestInput(args.request).pipe(
      Effect37.mapError(
        () => new BackendInputSafetyGatewayFailureError({
          boundary: args.boundary,
          reason: "sanitization_failed",
          message: "Input safety checks are temporarily unavailable. Try again later."
        })
      )
    );
    const categories = dedupeStrings2(sanitizedInput.findings.map((finding) => finding.category));
    const classifications = yield* Effect37.all(
      categories.map((category) => args.safetyPolicy.getClassification(category).pipe(Effect37.map((definition) => [category, definition])))
    );
    const classificationMap = new Map(classifications);
    const overrideAttempt = yield* evaluateInstructionOverrideAttempt({
      boundary: args.boundary,
      request: args.request,
      detector: args.instructionOverrideDetector
    });
    const decisionOutcome = determineDecisionOutcome({
      findings: sanitizedInput.findings,
      classifications: classificationMap,
      hasImportedContext,
      importedContextFamily,
      overrideAttempt
    });
    const applicableFamilies = [inputFamily, ...importedContextFamily ? [importedContextFamily] : []];
    if (applicableFamilies.some((family) => !family.allowedOutcomes.includes(decisionOutcome))) {
      return yield* Effect37.fail(
        new BackendInputSafetyGatewayFailureError({
          boundary: args.boundary,
          reason: "decision_failed",
          message: "Input safety checks are temporarily unavailable. Try again later."
        })
      );
    }
    const decision = decisionOutcome === "approve" || decisionOutcome === "sanitize" ? {
      outcome: decisionOutcome,
      boundary: args.boundary,
      findings: sanitizedInput.findings,
      sanitizedInput: sanitizedInput.sanitizedInput,
      overrideAttempt
    } : {
      outcome: decisionOutcome,
      boundary: args.boundary,
      findings: sanitizedInput.findings,
      overrideAttempt
    };
    if (args.policyEvidence) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      yield* args.policyEvidence.recordInputEvidence({
        actorId: "system",
        actorType: "system",
        resourceId: `${args.boundary}:${timestamp}`,
        outcome: decision.outcome,
        boundary: args.boundary,
        findings: decision.findings.map((f) => ({ category: f.category, field: f.field })),
        overrideAttempt: decision.overrideAttempt ? { verdict: decision.overrideAttempt.status, confidence: decision.overrideAttempt.confidence ?? null } : null,
        occurredAt: timestamp
      }).pipe(Effect37.orElse(swallowWithDiagnostic({
        operation: "Failed to persist input policy evidence",
        context: {
          boundary: args.boundary,
          outcome: decision.outcome
        }
      })));
    }
    return decision;
  });
}

// src/safety/output-release.ts
import { Effect as Effect39 } from "effect";

// src/safety/output-release-verdict.ts
import { Effect as Effect38 } from "effect";
function requireAllowedOutputDecision(decision) {
  if (decision.outcome === "approve" || decision.outcome === "sanitize") {
    return Effect38.succeed(decision.sanitizedOutput);
  }
  const categories = dedupeStrings3(decision.findings.map((finding) => finding.category));
  const fields = dedupeStrings3(decision.findings.map((finding) => finding.field));
  const message = decision.outcome === "block" ? "Output includes restricted or sensitive material and cannot be released." : "Output requires manual review before release.";
  return Effect38.fail(
    new BackendOutputReleasePolicyError({
      boundary: "output",
      outcome: decision.outcome,
      message,
      categories,
      fields
    })
  );
}
function determineOutputReleaseOutcome(args) {
  if (args.hasUnsafeCode) {
    return "block";
  }
  const unsanitizedBlockFindings = args.findings.filter(
    (f) => !f.sanitized && (f.category === "operational_data" || f.category === "security_sensitive_data" || f.category === "llm_prohibited_data")
  );
  if (unsanitizedBlockFindings.length > 0) {
    return "block";
  }
  if (args.hasSensitiveLeak && !args.canSanitize) {
    return "block";
  }
  if (args.findings.some((f) => f.sanitized) || args.hasSensitiveLeak && args.canSanitize) {
    return "sanitize";
  }
  return "approve";
}
function dedupeStrings3(values) {
  return Array.from(new Set(values));
}

// src/safety/output-release-scanner.ts
function containsDestructivePatterns(content) {
  const destructive = [
    /rm\s+-rf\s+\/[^\s]*$/gim,
    /format\s+c:/gim,
    /dd\s+if=.+of=\/dev\/sda/gim,
    /drop\s+database\s+/gim,
    /delete\s+from\s+.+where\s+/gim
  ];
  return destructive.some((pattern) => pattern.test(content));
}
function containsExfiltrativePatterns(content) {
  const exfiltrative = [
    /fetch\(.+?\)\s*\.then\(.*?=>\s*console\.log/gim,
    /process\.env\.[A-Z_]+/gim,
    /document\.cookie/gim,
    /localStorage\.getItem/gim,
    /XMLHttpRequest\(\).*?open\(/gim
  ];
  return exfiltrative.some((pattern) => pattern.test(content));
}
function containsOperationalLeakPatterns(content) {
  const operational = [
    /system\s+prompt\s*[:=]/gim,
    /hidden\s+instruction/gim,
    /operational\s+context\s*[:=]/gim,
    /internal\s+policy/gim
  ];
  return operational.some((pattern) => pattern.test(content));
}
function containsPromptEchoPatterns(content) {
  const promptEcho = [
    /ignore\s+previous\s+instructions/gim,
    /reveal\s+the\s+system\s+prompt/gim,
    /you\s+are\s+an\s+ai\s+assistant/gim,
    /as\s+a\s+language\s+model/gim
  ];
  return promptEcho.some((pattern) => pattern.test(content));
}
function createHeuristicOutputReleaseScannerAdapter() {
  return {
    scanForUnsafeCode: (content, context) => {
      if (containsDestructivePatterns(content)) {
        return { unsafe: true, category: "destructive", rationale: "Output contains destructive code patterns" };
      }
      if (containsExfiltrativePatterns(content)) {
        return { unsafe: true, category: "exfiltrative", rationale: "Output contains exfiltrative code patterns" };
      }
      return { unsafe: false };
    },
    scanForSensitiveDataLeak: (content) => {
      if (containsOperationalLeakPatterns(content) || containsPromptEchoPatterns(content)) {
        const sanitized = content.replace(/system\s+prompt\s*[:=].*?(\n|$)/gim, "[redacted-system-prompt]$1").replace(/hidden\s+instruction.*?(\n|$)/gim, "[redacted-instruction]$1").replace(/operational\s+context\s*[:=].*?(\n|$)/gim, "[redacted-context]$1").replace(/ignore\s+previous\s+instructions/gim, "[redacted-override-attempt]").replace(/reveal\s+the\s+system\s+prompt/gim, "[redacted-exfiltration-attempt]");
        return {
          leaked: true,
          category: "operational_leak",
          sanitized
        };
      }
      return { leaked: false };
    }
  };
}

// src/safety/output-release.ts
function createBackendOutputReleaseGateService(deps) {
  const scanner = deps.scannerAdapter ?? createHeuristicOutputReleaseScannerAdapter();
  const evaluateOutput = (output, context) => Effect39.gen(function* () {
    const family = yield* deps.safetyPolicy.getPolicyFamily("output_release");
    const codeScan = scanner.scanForUnsafeCode(output, { contentType: context.contentType });
    const dataLeakScan = scanner.scanForSensitiveDataLeak(output);
    const findings = [];
    if (codeScan.unsafe && codeScan.category) {
      findings.push({
        category: mapCodeCategoryToClassification(codeScan.category),
        field: "content",
        sanitized: false
      });
    }
    if (dataLeakScan.leaked && dataLeakScan.category) {
      findings.push({
        category: "operational_data",
        field: "content",
        sanitized: dataLeakScan.sanitized !== void 0
      });
    }
    const canSanitize = dataLeakScan.sanitized !== void 0 && dataLeakScan.sanitized !== output;
    const outcome = determineOutputReleaseOutcome({
      findings,
      hasUnsafeCode: codeScan.unsafe,
      hasSensitiveLeak: dataLeakScan.leaked,
      canSanitize
    });
    if (!family.allowedOutcomes.includes(outcome)) {
      return yield* Effect39.fail(
        new BackendOutputReleaseGateFailureError({
          boundary: "output",
          reason: "evaluation_failed",
          message: `Computed outcome "${outcome}" is not allowed for output_release family`
        })
      );
    }
    const decision = outcome === "approve" || outcome === "sanitize" ? {
      outcome,
      sanitizedOutput: { content: canSanitize && dataLeakScan.sanitized ? dataLeakScan.sanitized : output },
      findings
    } : {
      outcome,
      findings
    };
    if (deps.policyEvidence) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      yield* deps.policyEvidence.recordOutputEvidence({
        actorId: "system",
        actorType: "system",
        resourceId: `${context.contentType}:${timestamp}`,
        outcome: decision.outcome,
        contentType: context.contentType,
        findings: decision.findings.map((f) => ({ category: f.category, field: f.field, sanitized: f.sanitized })),
        occurredAt: timestamp
      }).pipe(Effect39.orElse(swallowWithDiagnostic({
        operation: "Failed to persist output policy evidence",
        context: {
          contentType: context.contentType,
          outcome: decision.outcome
        }
      })));
    }
    return decision;
  }).pipe(
    Effect39.catchAll((error) => {
      if (error instanceof BackendOutputReleaseGateFailureError) {
        return Effect39.fail(error);
      }
      return Effect39.fail(
        new BackendOutputReleaseGateFailureError({
          boundary: "output",
          reason: "evaluation_failed",
          message: error instanceof Error ? error.message : "Unexpected output release evaluation failure"
        })
      );
    })
  );
  return {
    evaluateOutput,
    authorizeOutput: (output, context) => Effect39.gen(function* () {
      const decision = yield* evaluateOutput(output, context);
      return yield* requireAllowedOutputDecision(decision);
    })
  };
}
function mapCodeCategoryToClassification(category) {
  switch (category) {
    case "destructive":
      return "llm_prohibited_data";
    case "exfiltrative":
      return "security_sensitive_data";
    case "out_of_scope":
      return "operational_data";
  }
}

// src/safety/voice-consent-assertion.ts
import { Effect as Effect40 } from "effect";

// src/safety/voice-consent-shared.ts
function buildVoiceConsentResourceId(userId) {
  return `voice-consent:${userId}`;
}
function isRevocationPending(consent) {
  return Boolean(consent && !consent.granted && consent.grantedAt && !consent.revokedAt);
}

// src/safety/voice-consent-assertion.ts
function assertVoiceTrainingConsent(userId, dependencies) {
  return Effect40.gen(function* () {
    const timestamp = dependencies.now().toISOString();
    const consent = yield* dependencies.database.voiceTrainingConsents.getByUser(userId).pipe(
      Effect40.mapError(
        () => new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "consent_unavailable",
          message: "Failed to retrieve voice training consent state"
        })
      ),
      Effect40.catchAllDefect(
        () => Effect40.fail(
          new BackendVoiceTrainingConsentFailureError({
            userId,
            reason: "consent_unavailable",
            message: "Consent repository failed unexpectedly"
          })
        )
      )
    );
    if (!consent || !consent.granted || consent.revokedAt !== void 0) {
      if (dependencies.policyEvidence) {
        const resourceId = consent?.id ?? buildVoiceConsentResourceId(userId);
        yield* dependencies.policyEvidence.recordConsentEvidence({
          actorId: userId,
          actorType: "application_user",
          resourceId,
          outcome: "block",
          consentAction: "assert",
          occurredAt: timestamp
        }).pipe(Effect40.orElse(swallowWithDiagnostic({
          operation: "Failed to persist blocked consent assertion evidence",
          context: { userId, resourceId }
        })));
      }
      return yield* Effect40.fail(
        new BackendVoiceTrainingConsentRequiredError({
          userId,
          message: "Voice training consent is required before voice examples can be stored or used"
        })
      );
    }
  });
}
function getVoiceTrainingConsentStatus(userId, dependencies) {
  return Effect40.gen(function* () {
    const consent = yield* dependencies.database.voiceTrainingConsents.getByUser(userId).pipe(
      Effect40.mapError(
        () => new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "consent_unavailable",
          message: "Failed to retrieve voice training consent state"
        })
      )
    );
    return {
      granted: consent?.granted ?? false,
      grantedAt: consent?.grantedAt,
      revokedAt: consent?.revokedAt
    };
  }).pipe(
    Effect40.catchAll(
      (error) => Effect40.fail(
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "consent_unavailable",
          message: error instanceof Error ? error.message : "Unexpected consent status failure"
        })
      )
    )
  );
}

// src/safety/voice-consent-grant.ts
import { Effect as Effect41 } from "effect";
function grantVoiceTrainingConsent(userId, dependencies) {
  return Effect41.gen(function* () {
    const existing = yield* dependencies.database.voiceTrainingConsents.getByUser(userId).pipe(
      Effect41.mapError(
        () => new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "consent_unavailable",
          message: "Failed to retrieve voice training consent state before grant"
        })
      )
    );
    if (isRevocationPending(existing)) {
      return yield* Effect41.fail(
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Voice training consent cannot be granted again until prior revocation cleanup completes"
        })
      );
    }
    const timestamp = dependencies.now().toISOString();
    const resourceId = buildVoiceConsentResourceId(userId);
    yield* dependencies.database.voiceTrainingConsents.put({
      id: existing?.id ?? resourceId,
      userId,
      granted: true,
      grantedAt: timestamp,
      evidenceBoundary: "consent",
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    }).pipe(
      Effect41.mapError(
        () => new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to persist voice training consent grant"
        })
      )
    );
    if (dependencies.policyEvidence) {
      yield* dependencies.policyEvidence.recordConsentEvidence({
        actorId: userId,
        actorType: "application_user",
        resourceId,
        outcome: "granted",
        consentAction: "grant",
        occurredAt: timestamp
      }).pipe(Effect41.orElse(swallowWithDiagnostic({
        operation: "Failed to persist consent grant evidence",
        context: { userId, resourceId }
      })));
    }
  }).pipe(
    Effect41.catchAll(
      (error) => Effect41.fail(
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: error instanceof Error ? error.message : "Unexpected consent grant failure"
        })
      )
    )
  );
}

// src/safety/voice-consent-revocation.ts
import { Effect as Effect42 } from "effect";
function revokeVoiceTrainingConsent(userId, dependencies) {
  return Effect42.gen(function* () {
    const existing = yield* dependencies.database.voiceTrainingConsents.getByUser(userId).pipe(
      Effect42.mapError(
        () => new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "consent_unavailable",
          message: "Failed to retrieve voice training consent state for revocation"
        })
      )
    );
    const timestamp = dependencies.now().toISOString();
    const resourceId = existing?.id ?? buildVoiceConsentResourceId(userId);
    const baseConsentRecord = {
      id: resourceId,
      userId,
      grantedAt: existing?.grantedAt,
      evidenceBoundary: "consent",
      createdAt: existing?.createdAt ?? timestamp
    };
    yield* persistRevocationPendingConsent({
      ...baseConsentRecord,
      updatedAt: timestamp
    }, dependencies).pipe(
      Effect42.mapError(
        () => new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to persist pending voice training consent revocation"
        })
      )
    );
    const cleanupResult = yield* removeProtectedVoiceArtifacts(userId, dependencies.database).pipe(
      Effect42.catchAll(
        (error) => recordBlockedRevocation({
          userId,
          resourceId,
          occurredAt: timestamp,
          previousGrantedAt: existing?.grantedAt,
          reason: error.message,
          policyEvidence: dependencies.policyEvidence,
          database: dependencies.database
        }).pipe(Effect42.zipRight(Effect42.fail(error)))
      )
    );
    yield* dependencies.database.voiceTrainingConsents.put({
      ...baseConsentRecord,
      granted: false,
      revokedAt: timestamp,
      updatedAt: timestamp
    }).pipe(
      Effect42.mapError(
        () => new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to persist completed voice training consent revocation"
        })
      )
    );
    yield* persistBackendAuditEvent(dependencies.database, {
      logicalKey: `voice-consent:${userId}:revoked:${timestamp}`,
      actorId: userId,
      actorType: "application_user",
      resourceType: "voice_training_consent",
      resourceId,
      mutationType: "voice_training_consent.revoked",
      occurredAt: timestamp,
      metadata: {
        previousGrantedAt: existing?.grantedAt ?? null,
        revokedAt: timestamp,
        ...cleanupResult
      }
    }).pipe(Effect42.orDie);
    if (dependencies.policyEvidence) {
      yield* dependencies.policyEvidence.recordConsentEvidence({
        actorId: userId,
        actorType: "application_user",
        resourceId,
        outcome: "revoked",
        consentAction: "revoke",
        occurredAt: timestamp
      }).pipe(Effect42.orElse(swallowWithDiagnostic({
        operation: "Failed to persist consent revocation evidence",
        context: { userId, resourceId }
      })));
    }
  }).pipe(
    Effect42.catchAll(
      (error) => Effect42.fail(
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: error instanceof Error ? error.message : "Unexpected consent revocation failure"
        })
      )
    )
  );
}
function persistRevocationPendingConsent(args, dependencies) {
  return dependencies.database.voiceTrainingConsents.put({
    id: args.id,
    userId: args.userId,
    granted: false,
    grantedAt: args.grantedAt,
    revokedAt: void 0,
    evidenceBoundary: args.evidenceBoundary,
    createdAt: args.createdAt,
    updatedAt: args.updatedAt
  });
}
function removeProtectedVoiceArtifacts(userId, database) {
  return Effect42.gen(function* () {
    const removedExamples = yield* database.voiceExamples.removeByUser(userId).pipe(
      Effect42.mapError(
        () => new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to remove stored voice examples during consent revocation"
        })
      )
    );
    const profileRemoved = yield* database.voiceProfiles.removeByUser(userId).pipe(
      Effect42.mapError(
        () => new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to remove derived voice profile during consent revocation"
        })
      )
    );
    const diagnosticsRemoved = yield* database.voiceProfileDiagnostics.removeByUser(userId).pipe(
      Effect42.mapError(
        () => new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to remove voice profile diagnostics during consent revocation"
        })
      )
    );
    const removedSnapshots = yield* database.voiceProfileSnapshots.removeByUser(userId).pipe(
      Effect42.mapError(
        () => new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to remove voice profile snapshots during consent revocation"
        })
      )
    );
    return {
      removedExamples,
      profileRemoved,
      diagnosticsRemoved,
      removedSnapshots
    };
  });
}
function recordBlockedRevocation(args) {
  const audit = persistBackendAuditEvent(args.database, {
    logicalKey: `voice-consent:${args.userId}:revocation-blocked:${args.occurredAt}`,
    actorId: args.userId,
    actorType: "application_user",
    resourceType: "voice_training_consent",
    resourceId: args.resourceId,
    mutationType: "voice_training_consent.revocation_blocked",
    occurredAt: args.occurredAt,
    metadata: {
      previousGrantedAt: args.previousGrantedAt ?? null,
      revocationPendingAt: args.occurredAt,
      reason: args.reason
    }
  }).pipe(Effect42.orDie);
  const evidence = args.policyEvidence ? args.policyEvidence.recordConsentEvidence({
    actorId: args.userId,
    actorType: "application_user",
    resourceId: args.resourceId,
    outcome: "block",
    consentAction: "revoke",
    occurredAt: args.occurredAt
  }).pipe(Effect42.orElse(swallowWithDiagnostic({
    operation: "Failed to persist blocked consent revocation evidence",
    context: {
      userId: args.userId,
      resourceId: args.resourceId
    }
  }))) : Effect42.void;
  return Effect42.zipRight(audit, evidence);
}

// src/safety/voice-consent.ts
function createBackendVoiceConsentService(options) {
  const dependencies = options;
  return {
    assertConsent: (userId) => assertVoiceTrainingConsent(userId, dependencies),
    getConsentStatus: (userId) => getVoiceTrainingConsentStatus(userId, dependencies),
    grantConsent: (userId) => grantVoiceTrainingConsent(userId, dependencies),
    revokeConsent: (userId) => revokeVoiceTrainingConsent(userId, dependencies)
  };
}

// src/safety/policy-evidence-recorders.ts
import { Effect as Effect43 } from "effect";
function createPolicyEvidenceRecorders(options) {
  const baseRecord = (boundary, args) => ({
    id: buildEvidenceId(boundary, args.resourceId, args.occurredAt, args.action),
    logicalKey: buildEvidenceLogicalKey(boundary, args.resourceId, args.occurredAt, args.action),
    boundary,
    outcome: args.outcome,
    actorId: args.actorId,
    actorType: args.actorType,
    policyVersion: options.policyVersion,
    resourceType: `policy_evidence:${boundary}`,
    resourceId: args.resourceId,
    occurredAt: args.occurredAt,
    metadata: args.metadata ? options.redaction.redactObject(args.metadata).redacted : {}
  });
  const persistEvidence = (record) => persistBackendAuditEvent(options.database, {
    logicalKey: record.logicalKey,
    actorId: record.actorId,
    actorType: record.actorType,
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    mutationType: `policy_evidence.${record.boundary}.${record.outcome}`,
    occurredAt: record.occurredAt,
    metadata: {
      ...record.metadata,
      policyVersion: record.policyVersion
    }
  }, options.redaction).pipe(
    Effect43.orElse(swallowWithDiagnostic({
      operation: "Failed to persist policy evidence audit record",
      context: {
        boundary: record.boundary,
        outcome: record.outcome,
        resourceId: record.resourceId
      }
    }))
  );
  return {
    recordInputEvidence: (args) => persistEvidence(
      baseRecord("input", {
        actorId: args.actorId,
        actorType: args.actorType,
        resourceId: args.resourceId,
        outcome: args.outcome,
        occurredAt: args.occurredAt,
        metadata: {
          boundary: args.boundary,
          findingsCount: args.findings.length,
          findings: args.findings.map((f) => ({ category: f.category, field: f.field })),
          overrideAttempt: args.overrideAttempt ?? null,
          rationaleCategory: args.findings[0]?.category ?? (args.overrideAttempt ? `override_${args.overrideAttempt.verdict}` : args.outcome),
          summary: buildInputEvidenceSummary(args)
        }
      })
    ),
    recordOutputEvidence: (args) => persistEvidence(
      baseRecord("output", {
        actorId: args.actorId,
        actorType: args.actorType,
        resourceId: args.resourceId,
        outcome: args.outcome,
        occurredAt: args.occurredAt,
        metadata: {
          contentType: args.contentType,
          findingsCount: args.findings.length,
          findings: args.findings.map((f) => ({ category: f.category, field: f.field, sanitized: f.sanitized ?? false })),
          rationaleCategory: args.findings[0]?.category ?? args.outcome,
          summary: buildOutputEvidenceSummary(args)
        }
      })
    ),
    recordScopeEvidence: (args) => persistEvidence(
      baseRecord("scope", {
        actorId: args.actorId,
        actorType: args.actorType,
        resourceId: args.resourceId,
        outcome: args.outcome,
        occurredAt: args.occurredAt,
        metadata: {
          stepName: args.stepName,
          boundary: args.boundary,
          reason: args.reason,
          field: args.field,
          rationaleCategory: args.reason,
          summary: buildScopeEvidenceSummary(args)
        }
      })
    ),
    recordConsentEvidence: (args) => persistEvidence(
      baseRecord("consent", {
        actorId: args.actorId,
        actorType: args.actorType,
        resourceId: args.resourceId,
        outcome: args.outcome,
        occurredAt: args.occurredAt,
        action: args.consentAction,
        metadata: {
          consentAction: args.consentAction,
          rationaleCategory: `consent_${args.consentAction}`,
          summary: buildConsentEvidenceSummary(args)
        }
      })
    ),
    recordOverrideEvidence: (args) => persistEvidence(
      baseRecord("override", {
        actorId: args.actorId,
        actorType: args.actorType,
        resourceId: args.resourceId,
        outcome: args.outcome,
        occurredAt: args.occurredAt,
        metadata: {
          targetFamily: args.targetFamily,
          targetBoundary: args.targetBoundary,
          targetOutcome: args.targetOutcome,
          categories: args.categories,
          lifecycleMode: args.lifecycleMode,
          expiresAt: args.expiresAt,
          rationaleCategory: args.reason,
          summary: buildOverrideEvidenceSummary(args)
        }
      })
    )
  };
}
function buildInputEvidenceSummary(args) {
  const primaryCategory = args.findings[0]?.category;
  const overrideSummary = args.overrideAttempt ? `; override verdict ${args.overrideAttempt.verdict}${args.overrideAttempt.confidence ? ` (${args.overrideAttempt.confidence})` : ""}` : "";
  return `${args.boundary} input ${args.outcome} with ${args.findings.length} finding(s)${primaryCategory ? `; primary category ${primaryCategory}` : ""}${overrideSummary}`;
}
function buildOutputEvidenceSummary(args) {
  const primaryCategory = args.findings[0]?.category;
  return `output release ${args.outcome} for ${args.contentType} with ${args.findings.length} finding(s)${primaryCategory ? `; primary category ${primaryCategory}` : ""}`;
}
function buildScopeEvidenceSummary(args) {
  return `scope ${args.boundary} ${args.outcome} in step ${args.stepName} due to ${args.reason} on field ${args.field}`;
}
function buildConsentEvidenceSummary(args) {
  return `consent ${args.consentAction} recorded with outcome ${args.outcome}`;
}
function buildOverrideEvidenceSummary(args) {
  const categoriesSummary = args.categories.length > 0 ? `; categories ${args.categories.join(", ")}` : "";
  const expirySummary = args.expiresAt ? `; expires at ${args.expiresAt}` : "";
  return `override ${args.outcome} for ${args.targetFamily}/${args.targetBoundary} targeting ${args.targetOutcome}; lifecycle ${args.lifecycleMode}${categoriesSummary}${expirySummary}; reason ${args.reason}`;
}
function buildEvidenceId(boundary, resourceId, occurredAt, action) {
  return `policy-evidence:${boundary}:${resourceId}:${occurredAt}${action ? `:${action}` : ""}`;
}
function buildEvidenceLogicalKey(boundary, resourceId, occurredAt, action) {
  return `policy-evidence:${boundary}:${resourceId}:${occurredAt}${action ? `:${action}` : ""}`;
}

// src/safety/policy-evidence-read-model.ts
import { Effect as Effect44 } from "effect";
function listOperationalPolicyEvidence(args) {
  return Effect44.gen(function* () {
    const all = yield* args.database.audit.list();
    const evidence = all.filter(
      (record) => record.resourceType.startsWith("policy_evidence:")
    );
    const filtered = evidence.filter((record) => {
      if (args.filter.boundary && !record.resourceType.endsWith(`:${args.filter.boundary}`)) {
        return false;
      }
      if (args.filter.outcome) {
        const outcomeParts = record.mutationType.split(".");
        const recordOutcome = outcomeParts[outcomeParts.length - 1] ?? "";
        if (recordOutcome !== args.filter.outcome) {
          return false;
        }
      }
      if (args.filter.actorId && record.actorId !== args.filter.actorId) {
        return false;
      }
      if (args.filter.resourceId && record.resourceId !== args.filter.resourceId) {
        return false;
      }
      if (args.filter.resourceType && record.resourceType !== args.filter.resourceType) {
        return false;
      }
      if (args.filter.since && record.occurredAt < args.filter.since) {
        return false;
      }
      if (args.filter.until && record.occurredAt > args.filter.until) {
        return false;
      }
      return true;
    });
    return filtered.map((record) => toReadModelEntry(record, args.redaction));
  });
}
function toReadModelEntry(record, redaction) {
  const boundary = record.resourceType.replace("policy_evidence:", "");
  const outcomeParts = record.mutationType.split(".");
  const outcome = outcomeParts[outcomeParts.length - 1] ?? "unknown";
  const metadata = redaction.redactObject(record.metadata).redacted;
  return {
    id: record.id,
    boundary,
    outcome,
    actorId: record.actorId,
    actorType: record.actorType,
    policyVersion: typeof metadata.policyVersion === "string" ? metadata.policyVersion : "unknown",
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    occurredAt: record.occurredAt,
    rationaleCategory: typeof metadata.rationaleCategory === "string" ? metadata.rationaleCategory : null,
    summary: typeof metadata.summary === "string" ? metadata.summary : null
  };
}

// src/safety/policy-evidence.ts
function createBackendPolicyEvidenceService(options) {
  const recorders = createPolicyEvidenceRecorders(options);
  return {
    ...recorders,
    listOperationalEvidence: (filter) => listOperationalPolicyEvidence({
      database: options.database,
      redaction: options.redaction,
      filter
    })
  };
}

// src/safety/operational-override.ts
import { randomUUID } from "node:crypto";
import { Effect as Effect49 } from "effect";

// src/safety/operational-override-audit.ts
import { Effect as Effect45 } from "effect";

// src/safety/redaction-types.ts
function createClassifiedRedactionValue(classification, value) {
  return {
    _tag: "ClassifiedRedactionValue",
    classification,
    value
  };
}

// src/safety/operational-override-audit.ts
function recordOperationalOverrideAttempt(decision, request, deps) {
  const occurredAt = decision.requestedAt;
  const outcome = decision.status === "approved" ? "approve" : "block";
  const lifecycleMode = decision.status === "approved" ? decision.lifecycleMode : request.lifecycle?.mode ?? "one_shot";
  const evidence = deps.policyEvidence?.recordOverrideEvidence({
    actorId: request.operatorId,
    actorType: "operator",
    resourceId: decision.overrideId,
    outcome,
    occurredAt,
    targetFamily: request.scope.targetFamily,
    targetBoundary: request.scope.boundary,
    targetOutcome: request.scope.targetOutcome,
    categories: request.scope.categories,
    lifecycleMode,
    expiresAt: decision.status === "approved" ? decision.expiresAt : request.lifecycle?.mode === "time_limited" ? request.lifecycle.expiresAt : void 0,
    reason: decision.status === "approved" ? "approved" : decision.reason
  }).pipe(Effect45.orElse(swallowWithDiagnostic({
    operation: "Failed to persist override policy evidence",
    context: {
      operatorId: request.operatorId,
      overrideId: decision.overrideId,
      status: decision.status
    }
  }))) ?? Effect45.void;
  const audit = persistBackendAuditEvent(
    deps.database,
    {
      logicalKey: `safety-override:${decision.overrideId}:${decision.status}`,
      actorId: request.operatorId,
      actorType: "operator",
      resourceType: "safety_override",
      resourceId: decision.overrideId,
      mutationType: decision.status === "approved" ? "safety_override.approved" : "safety_override.rejected",
      occurredAt,
      metadata: {
        targetFamily: request.scope.targetFamily,
        targetBoundary: request.scope.boundary,
        targetOutcome: request.scope.targetOutcome,
        categories: [...request.scope.categories],
        fields: [...request.scope.fields],
        pipelineName: request.scope.pipelineName,
        stepName: request.scope.stepName,
        lifecycleMode,
        expiresAt: decision.status === "approved" ? decision.expiresAt : request.lifecycle?.mode === "time_limited" ? request.lifecycle.expiresAt : void 0,
        decisionReason: decision.status === "approved" ? "approved" : decision.reason,
        justification: createClassifiedRedactionValue("operational_data", request.justification)
      }
    },
    deps.redaction
  ).pipe(
    Effect45.asVoid,
    Effect45.orElse(swallowWithDiagnostic({
      operation: "Failed to persist override audit event",
      context: {
        overrideId: decision.overrideId,
        status: decision.status
      }
    }))
  );
  return Effect45.zipRight(evidence, audit);
}
function recordOperationalOverrideLifecycleEvent(eventType, grant, occurredAt, deps) {
  return persistBackendAuditEvent(
    deps.database,
    {
      logicalKey: `safety-override:${grant.overrideId}:${eventType}:${occurredAt}`,
      actorId: grant.operatorId,
      actorType: "operator",
      resourceType: "safety_override",
      resourceId: grant.overrideId,
      mutationType: `safety_override.${eventType}`,
      occurredAt,
      metadata: {
        targetFamily: grant.scope.targetFamily,
        targetBoundary: grant.scope.boundary,
        targetOutcome: grant.scope.targetOutcome,
        lifecycleMode: grant.lifecycleMode,
        expiresAt: grant.expiresAt,
        remainingUses: grant.remainingUses
      }
    },
    deps.redaction
  ).pipe(
    Effect45.asVoid,
    Effect45.orElse(swallowWithDiagnostic({
      operation: "Failed to persist override lifecycle audit event",
      context: {
        overrideId: grant.overrideId,
        eventType
      }
    }))
  );
}

// src/safety/operational-override-policy.ts
import { Effect as Effect46 } from "effect";
function evaluateOperationalOverrideRequest(request, requestedAt, overrideId, deps) {
  return Effect46.gen(function* () {
    const targetFamily = yield* deps.safetyPolicy.getPolicyFamily(request.scope.targetFamily).pipe(
      Effect46.orElseSucceed(() => void 0)
    );
    const overrideFamily = yield* deps.safetyPolicy.getPolicyFamily("operational_override").pipe(
      Effect46.orElseSucceed(() => void 0)
    );
    if (!targetFamily || !overrideFamily) {
      return rejectOverride(
        overrideId,
        request,
        requestedAt,
        "non_overridable_family",
        "Operational override policy is unavailable for the requested target family"
      );
    }
    const justification = request.justification.trim();
    if (justification.length < 12) {
      return rejectOverride(
        overrideId,
        request,
        requestedAt,
        "missing_justification",
        "Operational override requires an explicit justification with meaningful detail"
      );
    }
    if (!request.scope.resourceId.trim() || request.scope.categories.length === 0) {
      return rejectOverride(
        overrideId,
        request,
        requestedAt,
        "broad_scope_not_allowed",
        "Operational override must target a concrete resource and explicit safety categories"
      );
    }
    if (targetFamily.overrideability === "never" || request.scope.boundary === "scope") {
      return rejectOverride(
        overrideId,
        request,
        requestedAt,
        request.scope.boundary === "scope" ? "non_overridable_boundary" : "non_overridable_family",
        "The requested safety boundary is explicitly non-overridable"
      );
    }
    const blockedCategories = new Set(targetFamily.nonOverridableCategories ?? []);
    const prohibitedCategory = request.scope.categories.find((category) => blockedCategories.has(category));
    if (prohibitedCategory) {
      return rejectOverride(
        overrideId,
        request,
        requestedAt,
        "non_overridable_category",
        `Safety category "${prohibitedCategory}" is explicitly non-overridable`
      );
    }
    const lifecycle = request.lifecycle;
    const lifecycleMode = lifecycle?.mode ?? "one_shot";
    if (lifecycleMode === "time_limited") {
      if (overrideFamily.overrideability !== "time_limited") {
        return rejectOverride(
          overrideId,
          request,
          requestedAt,
          "time_limited_not_allowed",
          "Time-limited operational overrides are not enabled by policy"
        );
      }
      if (!lifecycle || lifecycle.mode !== "time_limited") {
        return rejectOverride(
          overrideId,
          request,
          requestedAt,
          "expires_at_required",
          "Time-limited operational override requires an explicit expiresAt value"
        );
      }
      const { expiresAt } = lifecycle;
      if (expiresAt <= requestedAt) {
        return rejectOverride(
          overrideId,
          request,
          requestedAt,
          "expires_at_in_past",
          "Time-limited operational override must expire in the future"
        );
      }
      const maxWindowMinutes = overrideFamily.maxOverrideWindowMinutes ?? 30;
      const durationMs = new Date(expiresAt).getTime() - new Date(requestedAt).getTime();
      if (durationMs > maxWindowMinutes * 6e4) {
        return rejectOverride(
          overrideId,
          request,
          requestedAt,
          "lifetime_too_long",
          `Time-limited operational override cannot exceed ${maxWindowMinutes} minutes`
        );
      }
      return approveOverride(overrideId, request, requestedAt, "time_limited", expiresAt);
    }
    return approveOverride(overrideId, request, requestedAt, "one_shot");
  });
}
function approveOverride(overrideId, request, requestedAt, lifecycleMode, expiresAt) {
  return {
    overrideId,
    status: "approved",
    reason: "approved",
    operatorId: request.operatorId,
    requestedAt,
    lifecycleMode,
    expiresAt,
    scope: request.scope,
    remainingUses: lifecycleMode === "one_shot" ? 1 : Number.MAX_SAFE_INTEGER
  };
}
function rejectOverride(overrideId, request, requestedAt, reason, message) {
  return {
    overrideId,
    status: "rejected",
    reason,
    operatorId: request.operatorId,
    requestedAt,
    scope: request.scope,
    message
  };
}

// src/safety/operational-override-store.ts
import { Effect as Effect48 } from "effect";

// src/safety/operational-override-repository.ts
import { Effect as Effect47 } from "effect";
var overrideMemoryNamespace = "safety_override_grants";
function createBackendOperationalOverrideGrantRepository(database) {
  return {
    put: (grant) => database.memories.put(toMemoryRecord(grant)).pipe(
      Effect47.map(() => clonePersistedGrant(grant))
    ),
    get: (overrideId) => database.memories.get(overrideMemoryNamespace, overrideId).pipe(
      Effect47.map((record) => record ? parsePersistedGrantRecord(record) : void 0)
    )
  };
}
function createPersistedOperationalOverrideGrant(grant) {
  return {
    ...grant,
    status: "active"
  };
}
function toMemoryRecord(grant) {
  return {
    id: `safety-override:${grant.overrideId}`,
    userId: overrideMemoryNamespace,
    key: grant.overrideId,
    value: grant,
    createdAt: grant.requestedAt,
    updatedAt: grant.consumedAt ?? grant.expiredAt ?? grant.requestedAt
  };
}
function parsePersistedGrantRecord(record) {
  return clonePersistedGrant(record.value);
}
function clonePersistedGrant(grant) {
  return {
    ...grant,
    scope: {
      ...grant.scope,
      categories: [...grant.scope.categories],
      fields: [...grant.scope.fields]
    }
  };
}

// src/safety/operational-override-store.ts
function consumeStoredOperationalOverride(args) {
  return Effect48.gen(function* () {
    const consumedAt = args.deps.now().toISOString();
    const transition = yield* args.deps.database.transaction(
      (database) => Effect48.gen(function* () {
        const grants = createBackendOperationalOverrideGrantRepository(database);
        const grant = yield* grants.get(args.overrideId);
        if (!grant) {
          return {
            status: "error",
            reason: "override_not_found"
          };
        }
        if (grant.status === "consumed") {
          return {
            status: "error",
            reason: "override_already_consumed"
          };
        }
        if (grant.status === "expired") {
          return {
            status: "error",
            reason: "override_expired"
          };
        }
        if (grant.expiresAt && grant.expiresAt <= consumedAt) {
          const expiredGrant = {
            ...grant,
            status: "expired",
            expiredAt: consumedAt
          };
          yield* grants.put(expiredGrant);
          return {
            status: "expired",
            grant: expiredGrant
          };
        }
        const nextRemainingUses = grant.lifecycleMode === "one_shot" ? grant.remainingUses - 1 : grant.remainingUses;
        const nextGrant = {
          ...grant,
          remainingUses: nextRemainingUses,
          status: grant.lifecycleMode === "one_shot" ? "consumed" : "active",
          consumedAt
        };
        yield* grants.put(nextGrant);
        return {
          status: "consumed",
          grant: nextGrant
        };
      })
    );
    if (transition.status === "error") {
      return yield* Effect48.fail(createOverrideStateError(args.overrideId, transition.reason));
    }
    if (transition.status === "expired") {
      yield* recordOperationalOverrideLifecycleEvent("expired", transition.grant, consumedAt, args.deps).pipe(
        Effect48.orElse(swallowWithDiagnostic({
          operation: "Failed to record expired operational override lifecycle event",
          context: { overrideId: args.overrideId }
        }))
      );
      return yield* Effect48.fail(createOverrideStateError(args.overrideId, "override_expired"));
    }
    yield* recordOperationalOverrideLifecycleEvent("consumed", transition.grant, consumedAt, args.deps).pipe(
      Effect48.orElse(swallowWithDiagnostic({
        operation: "Failed to record consumed operational override lifecycle event",
        context: { overrideId: args.overrideId }
      }))
    );
    return {
      overrideId: args.overrideId,
      status: transition.grant.lifecycleMode === "one_shot" ? "consumed" : "active",
      operatorId: transition.grant.operatorId,
      consumedAt,
      scope: transition.grant.scope,
      lifecycleMode: transition.grant.lifecycleMode,
      expiresAt: transition.grant.expiresAt,
      remainingUses: transition.grant.remainingUses
    };
  }).pipe(
    Effect48.catchTag(
      "DatabaseTransactionInvariantError",
      (error) => Effect48.fail(
        new BackendOperationalOverrideStateError({
          overrideId: args.overrideId,
          reason: "override_not_found",
          message: `Operational override "${args.overrideId}" could not be consumed because the database transaction failed: ${error.message}`
        })
      )
    )
  );
}
function createOverrideStateError(overrideId, reason) {
  if (reason === "override_expired") {
    return new BackendOperationalOverrideStateError({
      overrideId,
      reason,
      message: `Operational override "${overrideId}" has expired`
    });
  }
  if (reason === "override_already_consumed") {
    return new BackendOperationalOverrideStateError({
      overrideId,
      reason,
      message: `Operational override "${overrideId}" has already been consumed`
    });
  }
  return new BackendOperationalOverrideStateError({
    overrideId,
    reason: "override_not_found",
    message: `Operational override "${overrideId}" was not found`
  });
}

// src/safety/operational-override.ts
function createBackendOperationalOverrideService(deps) {
  const overrideGrants = createBackendOperationalOverrideGrantRepository(deps.database);
  return {
    requestOverride: (request) => Effect49.gen(function* () {
      const requestedAt = deps.now().toISOString();
      const overrideId = `override_${randomUUID()}`;
      const decision = yield* evaluateOperationalOverrideRequest(request, requestedAt, overrideId, deps);
      yield* recordOperationalOverrideAttempt(decision, request, deps).pipe(
        Effect49.orElse(swallowWithDiagnostic({
          operation: "Failed to record operational override attempt",
          context: {
            operatorId: request.operatorId,
            overrideId: decision.overrideId,
            status: decision.status
          }
        }))
      );
      if (decision.status === "approved") {
        yield* overrideGrants.put(createPersistedOperationalOverrideGrant({
          overrideId: decision.overrideId,
          operatorId: decision.operatorId,
          requestedAt: decision.requestedAt,
          justification: request.justification,
          scope: decision.scope,
          lifecycleMode: decision.lifecycleMode,
          expiresAt: decision.expiresAt,
          remainingUses: decision.remainingUses
        }));
      }
      return decision;
    }),
    consumeOverride: (overrideId) => consumeStoredOperationalOverride({
      overrideId,
      deps
    })
  };
}

// src/product/core/service-dependencies.ts
import { Effect as Effect107 } from "effect";

// ../../packages/ai-adapters/src/errors.ts
import { Data as Data8 } from "effect";
var AIAdapterProviderNotFoundError = class extends Data8.TaggedError("AIAdapterProviderNotFoundError") {
};
var AIAdapterInvalidRequestError = class extends Data8.TaggedError("AIAdapterInvalidRequestError") {
};
var AIAdapterInvalidResponseError = class extends Data8.TaggedError("AIAdapterInvalidResponseError") {
};
var AIAdapterTransportError = class extends Data8.TaggedError("AIAdapterTransportError") {
};

// ../../packages/ai-adapters/src/types.ts
import { Context as Context10 } from "effect";
var AIAdapterRegistryService = class extends Context10.Tag("AIAdapterRegistryService")() {
};
var AIAdapterRouterService = class extends Context10.Tag("AIAdapterRouterService")() {
};
var AIAdapterService = class extends Context10.Tag("AIAdapterService")() {
};

// ../../packages/ai-adapters/src/registry.ts
import { Effect as Effect50 } from "effect";
function createAIAdapterRegistry(initialAdapters = []) {
  const adapters = /* @__PURE__ */ new Map();
  for (const adapter of initialAdapters) {
    adapters.set(adapter.name, adapter);
  }
  return {
    register(adapter) {
      adapters.set(adapter.name, adapter);
    },
    resolve(provider) {
      return adapters.get(provider);
    },
    list() {
      return Array.from(adapters.keys());
    }
  };
}
function resolveAdapter(registry, provider) {
  const adapter = registry.resolve(provider);
  if (!adapter) {
    return Effect50.fail(new AIAdapterProviderNotFoundError({ provider: String(provider) }));
  }
  return Effect50.succeed(adapter);
}

// ../../packages/ai-adapters/src/service.ts
import { Effect as Effect52, Layer as Layer9 } from "effect";

// ../../packages/ai-adapters/src/request-validation.ts
import { Effect as Effect51 } from "effect";
function validateAIModelRequest(request) {
  if (!request || typeof request !== "object") {
    return Effect51.fail(
      new AIAdapterInvalidRequestError({
        message: "AI model request is required",
        request
      })
    );
  }
  if (typeof request.provider !== "string" || request.provider.trim().length === 0) {
    return Effect51.fail(
      new AIAdapterInvalidRequestError({
        message: "AI model request must have a provider",
        request
      })
    );
  }
  if (typeof request.model !== "string" || request.model.trim().length === 0) {
    return Effect51.fail(
      new AIAdapterInvalidRequestError({
        message: "AI model request must have a non-empty model",
        request
      })
    );
  }
  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    return Effect51.fail(
      new AIAdapterInvalidRequestError({
        message: "AI model request must include at least one message",
        request
      })
    );
  }
  return Effect51.void;
}

// ../../packages/ai-adapters/src/service.ts
function createAIAdapterRouter(registry = createAIAdapterRegistry()) {
  return {
    buildRequest(request) {
      return Effect52.gen(function* () {
        yield* validateAIModelRequest(request);
        const adapter = yield* resolveAdapter(registry, request.provider);
        return yield* adapter.buildRequest(request);
      });
    },
    normalizeResponse(provider, response, request) {
      return Effect52.gen(function* () {
        const adapter = yield* resolveAdapter(registry, provider);
        return yield* adapter.normalizeResponse(response, request);
      });
    }
  };
}
function createAIAdapterService(registry = createAIAdapterRegistry()) {
  const router = createAIAdapterRouter(registry);
  return {
    complete: (call) => Effect52.gen(function* () {
      const providerRequest = yield* router.buildRequest(call.request);
      const providerResponse = yield* call.transport(providerRequest);
      const response = yield* router.normalizeResponse(call.request.provider, providerResponse, call.request);
      return {
        request: call.request,
        providerRequest,
        response
      };
    })
  };
}

// ../../packages/ai-adapters/src/prompt-rendering.ts
function renderPrompt(messages) {
  return messages.map((message) => {
    const prefix = message.role === "tool" && message.name ? `${message.role}:${message.name}` : message.role;
    return `[${prefix}] ${message.content}`;
  }).join("\n");
}

// ../../packages/ai-adapters/src/response-normalization.ts
import { Effect as Effect53 } from "effect";
function normalizeCommonResponse(provider, request, response) {
  const text = extractText(response) ?? extractAnthropicText(response) ?? extractGeminiText(response) ?? extractOllamaText(response);
  if (!text) {
    return Effect53.fail(
      new AIAdapterInvalidResponseError({
        provider: String(provider),
        message: "Provider response did not include any extractable text",
        response
      })
    );
  }
  return Effect53.succeed({
    provider,
    model: request.model,
    text,
    usage: extractUsage(response),
    raw: response,
    finishReason: extractFinishReason(response),
    metadata: request.metadata
  });
}
function extractText(response) {
  if (!response || typeof response !== "object") {
    return void 0;
  }
  const record = response;
  if (typeof record.text === "string") {
    return record.text;
  }
  if (typeof record.output === "string") {
    return record.output;
  }
  if (typeof record.content === "string") {
    return record.content;
  }
  if (Array.isArray(record.choices)) {
    const first = record.choices[0];
    const message = first?.message;
    if (typeof message?.content === "string") {
      return message.content;
    }
    if (typeof first?.text === "string") {
      return first.text;
    }
  }
  return void 0;
}
function extractAnthropicText(response) {
  if (!response || typeof response !== "object") {
    return void 0;
  }
  const record = response;
  if (!Array.isArray(record.content)) {
    return void 0;
  }
  return record.content.map((block) => block && typeof block === "object" ? block.text : void 0).filter((value) => typeof value === "string").join("");
}
function extractGeminiText(response) {
  if (!response || typeof response !== "object") {
    return void 0;
  }
  const record = response;
  if (!Array.isArray(record.candidates)) {
    return void 0;
  }
  const text = record.candidates.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") {
      return [];
    }
    const content = candidate.content;
    if (!content || typeof content !== "object") {
      return [];
    }
    const parts = content.parts;
    return Array.isArray(parts) ? parts : [];
  }).map((part) => part && typeof part === "object" ? part.text : void 0).filter((value) => typeof value === "string").join("");
  return text.length > 0 ? text : void 0;
}
function extractOllamaText(response) {
  if (!response || typeof response !== "object") {
    return void 0;
  }
  const record = response;
  if (typeof record.response === "string") {
    return record.response;
  }
  return void 0;
}
function extractUsage(response) {
  if (!response || typeof response !== "object") {
    return void 0;
  }
  const record = response;
  const usage2 = record.usage ?? record.tokenUsage;
  if (!usage2) {
    return void 0;
  }
  return {
    inputTokens: toNumber(usage2.inputTokens ?? usage2.promptTokens ?? usage2.input_tokens),
    outputTokens: toNumber(usage2.outputTokens ?? usage2.completionTokens ?? usage2.output_tokens),
    totalTokens: toNumber(usage2.totalTokens ?? usage2.total_tokens)
  };
}
function extractFinishReason(response) {
  if (!response || typeof response !== "object") {
    return void 0;
  }
  const record = response;
  if (typeof record.finishReason === "string") {
    return record.finishReason;
  }
  if (typeof record.finish_reason === "string") {
    return record.finish_reason;
  }
  if (Array.isArray(record.choices)) {
    const first = record.choices[0];
    if (typeof first?.finish_reason === "string") {
      return first.finish_reason;
    }
  }
  if (Array.isArray(record.candidates)) {
    const first = record.candidates[0];
    if (typeof first?.finishReason === "string") {
      return first.finishReason;
    }
  }
  return void 0;
}
function toNumber(value) {
  return typeof value === "number" ? value : void 0;
}

// ../../packages/ai-adapters/src/providers/anthropic.ts
import { Effect as Effect54 } from "effect";
function createAnthropicAdapter() {
  return {
    name: "anthropic",
    supportsModel: (model) => model.length > 0,
    buildRequest: (request) => Effect54.gen(function* () {
      const anthropicMessages = yield* toAnthropicMessages(request);
      const system = extractAnthropicSystemPrompt(request.messages);
      return {
        provider: "anthropic",
        model: request.model,
        headers: {
          "content-type": "application/json"
        },
        metadata: request.metadata ?? {},
        body: {
          model: request.model,
          messages: anthropicMessages,
          ...system ? { system } : {},
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          top_p: request.topP,
          stop_sequences: request.stop,
          stream: request.stream ?? false
        }
      };
    }),
    normalizeResponse: (response, request) => normalizeCommonResponse("anthropic", request, response)
  };
}
function extractAnthropicSystemPrompt(messages) {
  const systemMessages = messages.filter((message) => message.role === "system").map((message) => message.content.trim()).filter((content) => content.length > 0);
  return systemMessages.length > 0 ? systemMessages.join("\n\n") : void 0;
}
function toAnthropicMessages(request) {
  const anthropicMessages = [];
  for (const message of request.messages) {
    if (message.role === "system") {
      continue;
    }
    if (message.role !== "user" && message.role !== "assistant") {
      return Effect54.fail(
        new AIAdapterInvalidRequestError({
          message: `Anthropic adapter does not support message role "${message.role}" in the messages array`,
          request
        })
      );
    }
    anthropicMessages.push({
      role: message.role,
      content: message.content
    });
  }
  if (anthropicMessages.length === 0) {
    return Effect54.fail(
      new AIAdapterInvalidRequestError({
        message: "Anthropic adapter requires at least one user or assistant message",
        request
      })
    );
  }
  return Effect54.succeed(anthropicMessages);
}

// ../../packages/ai-adapters/src/providers/deepseek.ts
import { Effect as Effect55 } from "effect";
function createDeepSeekAdapter() {
  return {
    name: "deepseek",
    supportsModel: (model) => model.length > 0,
    buildRequest: (request) => Effect55.succeed({
      provider: "deepseek",
      model: request.model,
      headers: {
        "content-type": "application/json"
      },
      metadata: request.metadata ?? {},
      body: {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        stop: request.stop,
        stream: request.stream ?? false
      }
    }),
    normalizeResponse: (response, request) => normalizeCommonResponse("deepseek", request, response)
  };
}

// ../../packages/ai-adapters/src/providers/gemini.ts
import { Effect as Effect56 } from "effect";
function createGeminiAdapter() {
  return {
    name: "gemini",
    supportsModel: (model) => model.length > 0,
    buildRequest: (request) => Effect56.gen(function* () {
      const contents = yield* toGeminiContents(request);
      return {
        provider: "gemini",
        model: request.model,
        headers: {
          "content-type": "application/json"
        },
        metadata: request.metadata ?? {},
        body: {
          contents,
          generationConfig: {
            temperature: request.temperature,
            topP: request.topP,
            maxOutputTokens: request.maxTokens,
            stopSequences: request.stop
          }
        }
      };
    }),
    normalizeResponse: (response, request) => normalizeCommonResponse("gemini", request, response)
  };
}
function toGeminiContents(request) {
  const contents = [];
  for (const message of request.messages) {
    if (message.role === "system") {
      contents.push({
        role: "user",
        parts: [{ text: `System instruction:
${message.content}` }]
      });
      continue;
    }
    if (message.role !== "user" && message.role !== "assistant") {
      return Effect56.fail(
        new AIAdapterInvalidRequestError({
          message: `Gemini adapter does not support message role "${message.role}"`,
          request
        })
      );
    }
    contents.push({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }]
    });
  }
  if (contents.length === 0) {
    return Effect56.fail(
      new AIAdapterInvalidRequestError({
        message: "Gemini adapter requires at least one message",
        request
      })
    );
  }
  return Effect56.succeed(contents);
}

// ../../packages/ai-adapters/src/providers/groq.ts
import { Effect as Effect57 } from "effect";
function createGroqAdapter() {
  return {
    name: "groq",
    supportsModel: (model) => model.length > 0,
    buildRequest: (request) => Effect57.succeed({
      provider: "groq",
      model: request.model,
      headers: {
        "content-type": "application/json"
      },
      metadata: request.metadata ?? {},
      body: {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        stop: request.stop,
        stream: request.stream ?? false
      }
    }),
    normalizeResponse: (response, request) => normalizeCommonResponse("groq", request, response)
  };
}

// ../../packages/ai-adapters/src/providers/ollama.ts
import { Effect as Effect58 } from "effect";
function createOllamaAdapter() {
  return {
    name: "ollama",
    supportsModel: (model) => model.length > 0,
    buildRequest: (request) => Effect58.succeed({
      provider: "ollama",
      model: request.model,
      headers: {
        "content-type": "application/json"
      },
      metadata: request.metadata ?? {},
      body: {
        model: request.model,
        prompt: renderPrompt(request.messages),
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens,
          top_p: request.topP,
          stop: request.stop
        },
        stream: request.stream ?? false
      }
    }),
    normalizeResponse: (response, request) => normalizeCommonResponse("ollama", request, response)
  };
}

// ../../packages/ai-adapters/src/providers/openai.ts
import { Effect as Effect59 } from "effect";
function createOpenAIAdapter() {
  return {
    name: "openai",
    supportsModel: (model) => model.length > 0,
    buildRequest: (request) => Effect59.succeed({
      provider: "openai",
      model: request.model,
      headers: {
        "content-type": "application/json"
      },
      metadata: request.metadata ?? {},
      body: {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        stop: request.stop,
        stream: request.stream ?? false
      }
    }),
    normalizeResponse: (response, request) => normalizeCommonResponse("openai", request, response)
  };
}

// ../../packages/ai-adapters/src/providers/index.ts
function registerDefaultAIProviders(registry) {
  registry.register(createOpenAIAdapter());
  registry.register(createAnthropicAdapter());
  registry.register(createGeminiAdapter());
  registry.register(createGroqAdapter());
  registry.register(createDeepSeekAdapter());
  registry.register(createOllamaAdapter());
  return registry;
}

// src/infra/database-bootstrap.ts
import { Effect as Effect88 } from "effect";

// ../../packages/database/src/errors.ts
import { Data as Data9 } from "effect";
var DatabaseJobAlreadyExistsError = class extends Data9.TaggedError("DatabaseJobAlreadyExistsError") {
};
var DatabaseJobNotFoundError = class extends Data9.TaggedError("DatabaseJobNotFoundError") {
};
var DatabaseTransactionInvariantError = class extends Data9.TaggedError("DatabaseTransactionInvariantError") {
};
var DatabaseVoiceExampleAlreadyExistsError = class extends Data9.TaggedError("DatabaseVoiceExampleAlreadyExistsError") {
};
var DatabaseVoiceExampleNotFoundError = class extends Data9.TaggedError("DatabaseVoiceExampleNotFoundError") {
};
var DatabaseVoiceProfileNotFoundError = class extends Data9.TaggedError("DatabaseVoiceProfileNotFoundError") {
};
var DatabaseVoiceProfileDiagnosticsNotFoundError = class extends Data9.TaggedError("DatabaseVoiceProfileDiagnosticsNotFoundError") {
};
var DatabaseVoiceProfileSnapshotNotFoundError = class extends Data9.TaggedError("DatabaseVoiceProfileSnapshotNotFoundError") {
};
var DatabaseVoiceBatchAlreadyExistsError = class extends Data9.TaggedError("DatabaseVoiceBatchAlreadyExistsError") {
};
var DatabaseVoiceBatchNotFoundError = class extends Data9.TaggedError("DatabaseVoiceBatchNotFoundError") {
};
var DatabaseVoiceTrainingConsentNotFoundError = class extends Data9.TaggedError("DatabaseVoiceTrainingConsentNotFoundError") {
};

// ../../packages/database/src/converters.ts
function toJobRecord(job, options = {}) {
  const progress = options.progress ?? createDefaultProgress(job, job.status === "done" ? 100 : 0);
  const progressHistory = options.progressHistory ?? [
    {
      at: job.createdAt,
      progress
    }
  ];
  return {
    ...job,
    version: 1,
    progress,
    progressHistory,
    result: options.result ?? null,
    error: options.error ?? null,
    updatedAt: options.updatedAt ?? job.createdAt,
    history: options.history ?? [
      {
        type: "created",
        at: job.createdAt,
        payload: { status: job.status, contentType: job.contentType }
      }
    ]
  };
}
function toMemoryEntryRecord(record, version = 1) {
  return {
    ...record,
    version
  };
}
function toContentTypeRecord(record, version = 1, updatedAt = (/* @__PURE__ */ new Date()).toISOString()) {
  return {
    ...record,
    version,
    updatedAt
  };
}
function toPipelineRecord(record, version = 1, updatedAt = (/* @__PURE__ */ new Date()).toISOString()) {
  return {
    ...record,
    version,
    updatedAt
  };
}
function toVoiceExampleRecord(record, version = 1) {
  return {
    ...record,
    version
  };
}
function toVoiceProfileRecord(record, version = 1) {
  const { version: profileVersion, ...profile } = record;
  return {
    ...profile,
    profileVersion,
    version
  };
}
function toVoiceProfileDomain(record) {
  const { version, profileVersion, ...profile } = record;
  return {
    ...profile,
    version: profileVersion
  };
}
function toVoiceProfileDiagnosticsRecord(record, version = 1) {
  return {
    ...record,
    version
  };
}
function toVoiceProfileSnapshotRecord(record, version = 1) {
  return {
    ...record,
    version
  };
}
function toVoiceExampleBatchRecord(record, version = 1) {
  return {
    ...record,
    version
  };
}
function toVoiceTrainingConsentRecord(record, version = 1) {
  return {
    ...record,
    version
  };
}
function createDefaultProgress(job, percent = 0) {
  return {
    currentStep: job.pipelineId ?? job.contentType ?? "queued",
    stepIndex: 0,
    totalSteps: 0,
    percent
  };
}

// ../../packages/database/src/client.ts
import { Effect as Effect72 } from "effect";

// ../../packages/database/src/repositories/index.ts
import { Effect as Effect71 } from "effect";

// ../../packages/database/src/repositories/shared.ts
function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}
function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record));
}
function indexBy(items, keyOf) {
  const index = {};
  for (const item of items) {
    index[keyOf(item)] = cloneRecord(item);
  }
  return index;
}
function memoryKey(userId, key) {
  return `${userId}:${key}`;
}

// ../../packages/database/src/repositories/audit-repository.ts
import { Effect as Effect60 } from "effect";
function createAuditRepository(stateRef) {
  return {
    putIfAbsent(record) {
      const existing = Object.values(stateRef.current.auditRecords).find((current) => current.logicalKey === record.logicalKey);
      if (existing) {
        return Effect60.succeed(cloneRecord(existing));
      }
      stateRef.current = {
        ...stateRef.current,
        auditRecords: {
          ...stateRef.current.auditRecords,
          [record.id]: cloneRecord(record)
        }
      };
      return Effect60.succeed(cloneRecord(record));
    },
    getByLogicalKey(logicalKey) {
      const record = Object.values(stateRef.current.auditRecords).find((current) => current.logicalKey === logicalKey);
      return Effect60.succeed(record ? cloneRecord(record) : void 0);
    },
    list() {
      return Effect60.succeed(
        Object.values(stateRef.current.auditRecords).sort((left, right) => left.occurredAt.localeCompare(right.occurredAt)).map(cloneRecord)
      );
    }
  };
}

// ../../packages/database/src/repositories/content-type-repository.ts
import { Effect as Effect61 } from "effect";
function createContentTypeRepository(stateRef) {
  return {
    put(record, version = 1, updatedAt = (/* @__PURE__ */ new Date()).toISOString()) {
      const next = toContentTypeRecord(record, version, updatedAt);
      stateRef.current = {
        ...stateRef.current,
        contentTypes: {
          ...stateRef.current.contentTypes,
          [next.id]: next
        }
      };
      return Effect61.succeed(cloneRecord(next));
    },
    get(id) {
      const record = stateRef.current.contentTypes[id];
      return Effect61.succeed(record ? cloneRecord(record) : void 0);
    },
    list() {
      return Effect61.succeed(Object.values(stateRef.current.contentTypes).map(cloneRecord));
    }
  };
}

// ../../packages/database/src/repositories/job-repository.ts
import { Effect as Effect62 } from "effect";
function createJobRepository(stateRef) {
  return {
    create(job, options = {}) {
      if (stateRef.current.jobs[job.id]) {
        return Effect62.fail(new DatabaseJobAlreadyExistsError({ jobId: job.id }));
      }
      const record = toJobRecord(job, options);
      stateRef.current = {
        ...stateRef.current,
        jobs: {
          ...stateRef.current.jobs,
          [record.id]: record
        }
      };
      return Effect62.succeed(cloneRecord(record));
    },
    save(record) {
      return Effect62.gen(function* () {
        const current = yield* requireJob(stateRef.current, record.id);
        const next = {
          ...record,
          version: current.version + 1,
          history: record.history.length > 0 ? record.history : current.history
        };
        stateRef.current = {
          ...stateRef.current,
          jobs: {
            ...stateRef.current.jobs,
            [next.id]: next
          }
        };
        return cloneRecord(next);
      });
    },
    findById(id) {
      const record = stateRef.current.jobs[id];
      return Effect62.succeed(record ? cloneRecord(record) : void 0);
    },
    list() {
      return Effect62.succeed(Object.values(stateRef.current.jobs).map(cloneRecord));
    },
    listByUser(_userId, limit, offset) {
      const records = Object.values(stateRef.current.jobs).map(cloneRecord).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      return Effect62.succeed(records.slice(offset, offset + limit));
    },
    countByUser(_userId) {
      return Effect62.succeed(Object.keys(stateRef.current.jobs).length);
    },
    remove(id) {
      if (!stateRef.current.jobs[id]) {
        return Effect62.succeed(false);
      }
      const { [id]: _removed, ...jobs } = stateRef.current.jobs;
      stateRef.current = {
        ...stateRef.current,
        jobs
      };
      return Effect62.succeed(true);
    },
    appendHistory(id, entry) {
      return Effect62.gen(function* () {
        const current = yield* requireJob(stateRef.current, id);
        return yield* updateJob(stateRef, id, {
          history: [...current.history, entry],
          updatedAt: entry.at
        });
      });
    },
    recordProgress(id, progress, at = (/* @__PURE__ */ new Date()).toISOString()) {
      return Effect62.gen(function* () {
        const current = yield* requireJob(stateRef.current, id);
        return yield* updateJob(stateRef, id, {
          status: "running",
          progress,
          updatedAt: at,
          progressHistory: [...current.progressHistory, { at, progress }],
          historyEntry: {
            type: "progress",
            at,
            payload: { progress }
          }
        });
      });
    },
    complete(id, result, at = (/* @__PURE__ */ new Date()).toISOString()) {
      return Effect62.gen(function* () {
        const current = yield* requireJob(stateRef.current, id);
        return yield* updateJob(stateRef, id, {
          status: "done",
          completedAt: at,
          result,
          error: null,
          progress: {
            ...current.progress,
            currentStep: current.progress.currentStep,
            percent: 100
          },
          progressHistory: [
            ...current.progressHistory,
            {
              at,
              progress: {
                ...current.progress,
                currentStep: current.progress.currentStep,
                percent: 100
              }
            }
          ],
          updatedAt: at,
          historyEntry: {
            type: "completed",
            at,
            payload: { result }
          }
        });
      });
    },
    fail(id, error, at = (/* @__PURE__ */ new Date()).toISOString()) {
      return Effect62.gen(function* () {
        const current = yield* requireJob(stateRef.current, id);
        return yield* updateJob(stateRef, id, {
          status: "failed",
          completedAt: at,
          result: null,
          error,
          progressHistory: [...current.progressHistory],
          updatedAt: at,
          historyEntry: {
            type: "failed",
            at,
            payload: { error }
          }
        });
      });
    }
  };
}
function updateJob(stateRef, id, patch) {
  return Effect62.gen(function* () {
    const current = yield* requireJob(stateRef.current, id);
    const { historyEntry, history: patchHistory, progressHistory: patchProgressHistory, ...jobPatch } = patch;
    const history = historyEntry ? [...current.history, historyEntry] : patchHistory ?? current.history;
    const progressHistory = patchProgressHistory ?? current.progressHistory;
    const next = {
      ...current,
      ...jobPatch,
      version: current.version + 1,
      history,
      progressHistory
    };
    stateRef.current = {
      ...stateRef.current,
      jobs: {
        ...stateRef.current.jobs,
        [id]: next
      }
    };
    return cloneRecord(next);
  });
}
function requireJob(state, id) {
  const record = state.jobs[id];
  if (!record) {
    return Effect62.fail(new DatabaseJobNotFoundError({ jobId: id }));
  }
  return Effect62.succeed(record);
}

// ../../packages/database/src/repositories/memory-repository.ts
import { Effect as Effect63 } from "effect";
function createMemoryRepository(stateRef) {
  return {
    put(record, version = 1) {
      const next = toMemoryEntryRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        memories: {
          ...stateRef.current.memories,
          [memoryKey(record.userId, record.key)]: next
        }
      };
      return Effect63.succeed(cloneRecord(next));
    },
    get(userId, key) {
      const record = stateRef.current.memories[memoryKey(userId, key)];
      return Effect63.succeed(record ? cloneRecord(record) : void 0);
    },
    listByUser(userId) {
      return Effect63.succeed(
        Object.values(stateRef.current.memories).filter((record) => record.userId === userId).map(cloneRecord)
      );
    },
    remove(userId, key) {
      const composite = memoryKey(userId, key);
      if (!stateRef.current.memories[composite]) {
        return Effect63.succeed(false);
      }
      const { [composite]: _removed, ...memories } = stateRef.current.memories;
      stateRef.current = {
        ...stateRef.current,
        memories
      };
      return Effect63.succeed(true);
    }
  };
}

// ../../packages/database/src/repositories/pipeline-repository.ts
import { Effect as Effect64 } from "effect";
function createPipelineRepository(stateRef) {
  return {
    put(record, version = 1, updatedAt = (/* @__PURE__ */ new Date()).toISOString()) {
      const next = toPipelineRecord(record, version, updatedAt);
      stateRef.current = {
        ...stateRef.current,
        pipelines: {
          ...stateRef.current.pipelines,
          [next.id]: next
        }
      };
      return Effect64.succeed(cloneRecord(next));
    },
    get(id) {
      const record = stateRef.current.pipelines[id];
      return Effect64.succeed(record ? cloneRecord(record) : void 0);
    },
    list() {
      return Effect64.succeed(Object.values(stateRef.current.pipelines).map(cloneRecord));
    }
  };
}

// ../../packages/database/src/repositories/voice-example-batch-repository.ts
import { Effect as Effect65 } from "effect";
function createVoiceExampleBatchRepository(stateRef) {
  return {
    create(record, version = 1) {
      if (stateRef.current.voiceExampleBatches[record.id]) {
        return Effect65.fail(new DatabaseVoiceBatchAlreadyExistsError({ batchId: record.id }));
      }
      const next = toVoiceExampleBatchRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        voiceExampleBatches: {
          ...stateRef.current.voiceExampleBatches,
          [next.id]: next
        }
      };
      return Effect65.succeed(cloneRecord(next));
    },
    save(record) {
      if (!stateRef.current.voiceExampleBatches[record.id]) {
        return Effect65.fail(new DatabaseVoiceBatchNotFoundError({ batchId: record.id }));
      }
      const next = {
        ...record,
        version: record.version + 1
      };
      stateRef.current = {
        ...stateRef.current,
        voiceExampleBatches: {
          ...stateRef.current.voiceExampleBatches,
          [next.id]: next
        }
      };
      return Effect65.succeed(cloneRecord(next));
    },
    get(id) {
      const record = stateRef.current.voiceExampleBatches[id];
      return Effect65.succeed(record ? cloneRecord(record) : void 0);
    },
    listByUser(userId) {
      return Effect65.succeed(
        Object.values(stateRef.current.voiceExampleBatches).filter((record) => record.userId === userId).map(cloneRecord)
      );
    },
    remove(id) {
      if (!stateRef.current.voiceExampleBatches[id]) {
        return Effect65.succeed(false);
      }
      const { [id]: _removed, ...voiceExampleBatches } = stateRef.current.voiceExampleBatches;
      stateRef.current = {
        ...stateRef.current,
        voiceExampleBatches
      };
      return Effect65.succeed(true);
    }
  };
}

// ../../packages/database/src/repositories/voice-example-repository.ts
import { Effect as Effect66 } from "effect";
function createVoiceExampleRepository(stateRef) {
  return {
    create(record, version = 1) {
      if (stateRef.current.voiceExamples[record.id]) {
        return Effect66.fail(new DatabaseVoiceExampleAlreadyExistsError({ exampleId: record.id }));
      }
      const next = toVoiceExampleRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        voiceExamples: {
          ...stateRef.current.voiceExamples,
          [next.id]: next
        }
      };
      return Effect66.succeed(cloneRecord(next));
    },
    save(record) {
      if (!stateRef.current.voiceExamples[record.id]) {
        return Effect66.fail(new DatabaseVoiceExampleNotFoundError({ exampleId: record.id }));
      }
      const next = {
        ...record,
        version: record.version + 1
      };
      stateRef.current = {
        ...stateRef.current,
        voiceExamples: {
          ...stateRef.current.voiceExamples,
          [next.id]: next
        }
      };
      return Effect66.succeed(cloneRecord(next));
    },
    get(id) {
      const record = stateRef.current.voiceExamples[id];
      return Effect66.succeed(record ? cloneRecord(record) : void 0);
    },
    listByUser(userId) {
      return Effect66.succeed(
        Object.values(stateRef.current.voiceExamples).filter((record) => record.userId === userId).map(cloneRecord)
      );
    },
    remove(id) {
      if (!stateRef.current.voiceExamples[id]) {
        return Effect66.succeed(false);
      }
      const { [id]: _removed, ...voiceExamples } = stateRef.current.voiceExamples;
      stateRef.current = {
        ...stateRef.current,
        voiceExamples
      };
      return Effect66.succeed(true);
    },
    removeByUser(userId) {
      const entries = Object.entries(stateRef.current.voiceExamples);
      const remaining = {};
      let removedCount = 0;
      for (const [id, record] of entries) {
        if (record.userId === userId) {
          removedCount++;
        } else {
          remaining[id] = record;
        }
      }
      stateRef.current = {
        ...stateRef.current,
        voiceExamples: remaining
      };
      return Effect66.succeed(removedCount);
    }
  };
}

// ../../packages/database/src/repositories/voice-profile-diagnostics-repository.ts
import { Effect as Effect67 } from "effect";
function createVoiceProfileDiagnosticsRepository(stateRef) {
  return {
    put(record, version = 1) {
      const next = toVoiceProfileDiagnosticsRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        voiceProfileDiagnostics: {
          ...stateRef.current.voiceProfileDiagnostics,
          [record.userId]: next
        }
      };
      return Effect67.succeed(cloneRecord(next));
    },
    getByUser(userId) {
      const record = stateRef.current.voiceProfileDiagnostics[userId];
      return Effect67.succeed(record ? cloneRecord(record) : void 0);
    },
    removeByUser(userId) {
      if (!stateRef.current.voiceProfileDiagnostics[userId]) {
        return Effect67.succeed(false);
      }
      const { [userId]: _removed, ...voiceProfileDiagnostics } = stateRef.current.voiceProfileDiagnostics;
      stateRef.current = {
        ...stateRef.current,
        voiceProfileDiagnostics
      };
      return Effect67.succeed(true);
    }
  };
}

// ../../packages/database/src/repositories/voice-profile-repository.ts
import { Effect as Effect68 } from "effect";
function createVoiceProfileRepository(stateRef) {
  return {
    put(record, version = 1) {
      const next = toVoiceProfileRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        voiceProfiles: {
          ...stateRef.current.voiceProfiles,
          [record.userId]: next
        }
      };
      return Effect68.succeed(cloneRecord(next));
    },
    getByUser(userId) {
      const record = stateRef.current.voiceProfiles[userId];
      return Effect68.succeed(record ? cloneRecord(record) : void 0);
    },
    removeByUser(userId) {
      if (!stateRef.current.voiceProfiles[userId]) {
        return Effect68.succeed(false);
      }
      const { [userId]: _removed, ...voiceProfiles } = stateRef.current.voiceProfiles;
      stateRef.current = {
        ...stateRef.current,
        voiceProfiles
      };
      return Effect68.succeed(true);
    }
  };
}

// ../../packages/database/src/repositories/voice-profile-snapshot-repository.ts
import { Effect as Effect69 } from "effect";
function createVoiceProfileSnapshotRepository(stateRef) {
  return {
    create(record, version = 1) {
      const next = toVoiceProfileSnapshotRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        voiceProfileSnapshots: {
          ...stateRef.current.voiceProfileSnapshots,
          [next.id]: next
        }
      };
      return Effect69.succeed(cloneRecord(next));
    },
    get(id) {
      const record = stateRef.current.voiceProfileSnapshots[id];
      return Effect69.succeed(record ? cloneRecord(record) : void 0);
    },
    listByUser(userId) {
      return Effect69.succeed(
        Object.values(stateRef.current.voiceProfileSnapshots).filter((record) => record.userId === userId).map(cloneRecord)
      );
    },
    removeByUser(userId) {
      const entries = Object.entries(stateRef.current.voiceProfileSnapshots);
      const remaining = {};
      let removedCount = 0;
      for (const [id, record] of entries) {
        if (record.userId === userId) {
          removedCount++;
        } else {
          remaining[id] = record;
        }
      }
      stateRef.current = {
        ...stateRef.current,
        voiceProfileSnapshots: remaining
      };
      return Effect69.succeed(removedCount);
    }
  };
}

// ../../packages/database/src/repositories/voice-training-consent-repository.ts
import { Effect as Effect70 } from "effect";
function createVoiceTrainingConsentRepository(stateRef) {
  return {
    put(record, version = 1) {
      const next = toVoiceTrainingConsentRecord(record, version);
      stateRef.current = {
        ...stateRef.current,
        voiceTrainingConsents: {
          ...stateRef.current.voiceTrainingConsents,
          [record.userId]: next
        }
      };
      return Effect70.succeed(cloneRecord(next));
    },
    getByUser(userId) {
      const record = stateRef.current.voiceTrainingConsents[userId];
      return Effect70.succeed(record ? cloneRecord(record) : void 0);
    }
  };
}

// ../../packages/database/src/repositories/index.ts
function createState(seed) {
  return {
    jobs: indexBy(seed.jobs ?? [], (record) => record.id),
    memories: indexBy(seed.memories ?? [], (record) => `${record.userId}:${record.key}`),
    contentTypes: indexBy(seed.contentTypes ?? [], (record) => record.id),
    pipelines: indexBy(seed.pipelines ?? [], (record) => record.id),
    voiceExamples: indexBy(seed.voiceExamples ?? [], (record) => record.id),
    voiceProfiles: indexBy(seed.voiceProfiles ?? [], (record) => record.userId),
    voiceProfileDiagnostics: indexBy(seed.voiceProfileDiagnostics ?? [], (record) => record.userId),
    voiceProfileSnapshots: indexBy(seed.voiceProfileSnapshots ?? [], (record) => record.id),
    voiceExampleBatches: indexBy(seed.voiceExampleBatches ?? [], (record) => record.id),
    voiceTrainingConsents: indexBy(seed.voiceTrainingConsents ?? [], (record) => record.userId),
    auditRecords: indexBy(seed.auditRecords ?? [], (record) => record.id)
  };
}
function createClient(state) {
  const stateRef = { current: state };
  const client = {
    jobs: createJobRepository(stateRef),
    memories: createMemoryRepository(stateRef),
    contentTypes: createContentTypeRepository(stateRef),
    pipelines: createPipelineRepository(stateRef),
    voiceExamples: createVoiceExampleRepository(stateRef),
    voiceProfiles: createVoiceProfileRepository(stateRef),
    voiceProfileDiagnostics: createVoiceProfileDiagnosticsRepository(stateRef),
    voiceProfileSnapshots: createVoiceProfileSnapshotRepository(stateRef),
    voiceExampleBatches: createVoiceExampleBatchRepository(stateRef),
    voiceTrainingConsents: createVoiceTrainingConsentRepository(stateRef),
    audit: createAuditRepository(stateRef),
    transaction: (operation) => Effect71.gen(function* () {
      const snapshot = cloneState(stateRef.current);
      const nested = createClient(snapshot);
      const result = yield* operation(nested);
      stateRef.current = nested.snapshot();
      return result;
    }),
    snapshot: () => cloneState(stateRef.current)
  };
  return client;
}

// ../../packages/database/src/client.ts
function createDatabase(seed = {}) {
  return createClient(createState(seed));
}

// ../../packages/database/src/services.ts
import { Context as Context11, Effect as Effect73, Layer as Layer10 } from "effect";
var DatabaseService = class extends Context11.Tag("DatabaseService")() {
};
var JobRepositoryService = class extends Context11.Tag("JobRepositoryService")() {
};
var MemoryRepositoryService = class extends Context11.Tag("MemoryRepositoryService")() {
};
var ContentTypeRepositoryService = class extends Context11.Tag("ContentTypeRepositoryService")() {
};
var PipelineRepositoryService = class extends Context11.Tag("PipelineRepositoryService")() {
};
var VoiceExampleRepositoryService = class extends Context11.Tag("VoiceExampleRepositoryService")() {
};
var VoiceProfileRepositoryService = class extends Context11.Tag("VoiceProfileRepositoryService")() {
};
var VoiceProfileDiagnosticsRepositoryService = class extends Context11.Tag("VoiceProfileDiagnosticsRepositoryService")() {
};
var VoiceProfileSnapshotRepositoryService = class extends Context11.Tag("VoiceProfileSnapshotRepositoryService")() {
};
var VoiceExampleBatchRepositoryService = class extends Context11.Tag("VoiceExampleBatchRepositoryService")() {
};
var VoiceTrainingConsentRepositoryService = class extends Context11.Tag("VoiceTrainingConsentRepositoryService")() {
};

// src/infra/postgres-bootstrap.ts
import { Effect as Effect74 } from "effect";
import { Kysely, PostgresDialect } from "kysely";
function createPostgresBootstrapError(message, cause) {
  return { _tag: "PostgresBootstrapError", message, cause };
}
function createPostgresPoolConfig(databaseUrl) {
  return {
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 3e4,
    connectionTimeoutMillis: 5e3
  };
}
function acquirePostgresPool(databaseUrl) {
  return Effect74.gen(function* () {
    if (!databaseUrl || databaseUrl.trim().length === 0) {
      return yield* Effect74.fail(
        createPostgresBootstrapError("DATABASE_URL is empty")
      );
    }
    const { Pool: PgPool } = yield* Effect74.tryPromise({
      try: () => import("pg"),
      catch: (e) => createPostgresBootstrapError("Failed to import pg module", e)
    });
    const poolConfig = createPostgresPoolConfig(databaseUrl);
    const pool = new PgPool(poolConfig);
    yield* Effect74.tryPromise({
      try: () => pool.query("SELECT 1"),
      catch: (e) => createPostgresBootstrapError(
        "Failed to connect to PostgreSQL",
        e
      )
    });
    return pool;
  });
}
function bootstrapPostgresDatabase(databaseUrl) {
  return Effect74.gen(function* () {
    const pool = yield* acquirePostgresPool(databaseUrl);
    const dialect = new PostgresDialect({ pool });
    return new Kysely({ dialect });
  });
}

// src/infra/postgres-client.ts
import { Cause as Cause2, Effect as Effect86, Exit, Option as Option2 } from "effect";
import { Kysely as Kysely2 } from "kysely";

// src/infra/postgres-repositories/postgres-job-repository.ts
import { Effect as Effect75 } from "effect";

// src/infra/postgres-repositories/json-column.ts
function parseStoredJsonRecord(data) {
  if (typeof data === "string") {
    return JSON.parse(data);
  }
  if (typeof data === "object" && data !== null) {
    return data;
  }
  throw new Error("Expected a JSON column value");
}

// src/infra/postgres-repositories/postgres-job-repository.ts
function serializeJob(record) {
  return {
    id: record.id,
    data: JSON.stringify(record),
    version: record.version,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}
function parseJob(row) {
  const parsed = parseStoredJsonRecord(row.data);
  return { ...parsed, version: row.version, createdAt: row.created_at, updatedAt: row.updated_at };
}
function createPostgresJobRepository(db) {
  return {
    create(job, options = {}) {
      return Effect75.gen(function* () {
        const existing = yield* Effect75.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", job.id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect75.catchAll(() => Effect75.succeed(void 0)));
        if (existing) {
          return yield* Effect75.fail(new DatabaseJobAlreadyExistsError({ jobId: job.id }));
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const record = {
          ...job,
          status: options.progress ? "running" : "queued",
          progress: options.progress ?? { currentStep: "", stepIndex: 0, totalSteps: 1, percent: 0 },
          progressHistory: options.progressHistory ?? [],
          result: options.result ?? null,
          error: options.error ?? null,
          version: 1,
          history: options.history ?? [{ type: "created", at: now, payload: { job } }],
          createdAt: now,
          updatedAt: now,
          completedAt: null
        };
        yield* Effect75.tryPromise({
          try: () => db.insertInto("jobs").values(serializeJob(record)).execute(),
          catch: (e) => new DatabaseJobAlreadyExistsError({ jobId: job.id })
        });
        return record;
      });
    },
    save(record) {
      return Effect75.gen(function* () {
        const current = yield* Effect75.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", record.id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect75.catchAll(() => Effect75.succeed(void 0)));
        if (!current) {
          return yield* Effect75.fail(new DatabaseJobNotFoundError({ jobId: record.id }));
        }
        const next = { ...record, version: current.version + 1 };
        yield* Effect75.tryPromise({
          try: () => db.updateTable("jobs").set(serializeJob(next)).where("id", "=", record.id).execute(),
          catch: (e) => new DatabaseJobNotFoundError({ jobId: record.id })
        });
        return next;
      });
    },
    findById(id) {
      return Effect75.gen(function* () {
        const row = yield* Effect75.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect75.catchAll(() => Effect75.succeed(void 0)));
        return row ? parseJob(row) : void 0;
      });
    },
    list() {
      return Effect75.gen(function* () {
        const rows = yield* Effect75.tryPromise({
          try: () => db.selectFrom("jobs").selectAll().execute(),
          catch: () => []
        }).pipe(Effect75.catchAll(() => Effect75.succeed([])));
        return rows.map(parseJob);
      });
    },
    listByUser(userId, limit, offset) {
      return Effect75.gen(function* () {
        const rows = yield* Effect75.tryPromise({
          try: () => db.selectFrom("jobs").selectAll().where("user_id", "=", userId).orderBy("created_at", "desc").limit(limit).offset(offset).execute(),
          catch: () => []
        }).pipe(
          Effect75.catchAll(
            () => Effect75.succeed([])
          )
        );
        return rows.map(parseJob);
      });
    },
    countByUser(userId) {
      return Effect75.gen(function* () {
        const row = yield* Effect75.tryPromise({
          try: () => db.selectFrom("jobs").select((eb) => eb.fn.countAll().as("count")).where("user_id", "=", userId).executeTakeFirst(),
          catch: () => ({ count: 0 })
        }).pipe(Effect75.catchAll(() => Effect75.succeed({ count: 0 })));
        return Number(row?.count ?? 0);
      });
    },
    remove(id) {
      return Effect75.gen(function* () {
        const result = yield* Effect75.tryPromise({
          try: () => db.deleteFrom("jobs").where("id", "=", id).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect75.catchAll(() => Effect75.succeed({ numDeletedRows: 0n })));
        return result.numDeletedRows > 0n;
      });
    },
    appendHistory(id, entry) {
      return Effect75.gen(function* () {
        const current = yield* Effect75.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect75.catchAll(() => Effect75.succeed(void 0)));
        if (!current) {
          return yield* Effect75.fail(new DatabaseJobNotFoundError({ jobId: id }));
        }
        const record = parseJob(current);
        const next = { ...record, history: [...record.history, entry], updatedAt: entry.at };
        yield* Effect75.tryPromise({
          try: () => db.updateTable("jobs").set(serializeJob(next)).where("id", "=", id).execute(),
          catch: (e) => new DatabaseJobNotFoundError({ jobId: id })
        });
        return next;
      });
    },
    recordProgress(id, progress, at = (/* @__PURE__ */ new Date()).toISOString()) {
      return Effect75.gen(function* () {
        const current = yield* Effect75.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect75.catchAll(() => Effect75.succeed(void 0)));
        if (!current) {
          return yield* Effect75.fail(new DatabaseJobNotFoundError({ jobId: id }));
        }
        const record = parseJob(current);
        const next = {
          ...record,
          status: "running",
          progress,
          progressHistory: [...record.progressHistory, { at, progress }],
          updatedAt: at
        };
        yield* Effect75.tryPromise({
          try: () => db.updateTable("jobs").set(serializeJob(next)).where("id", "=", id).execute(),
          catch: (e) => new DatabaseJobNotFoundError({ jobId: id })
        });
        return next;
      });
    },
    complete(id, result, at = (/* @__PURE__ */ new Date()).toISOString()) {
      return Effect75.gen(function* () {
        const current = yield* Effect75.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect75.catchAll(() => Effect75.succeed(void 0)));
        if (!current) {
          return yield* Effect75.fail(new DatabaseJobNotFoundError({ jobId: id }));
        }
        const record = parseJob(current);
        const next = {
          ...record,
          status: "done",
          result,
          error: null,
          progress: { ...record.progress, percent: 100 },
          progressHistory: [...record.progressHistory, { at, progress: { ...record.progress, percent: 100 } }],
          updatedAt: at,
          completedAt: at
        };
        yield* Effect75.tryPromise({
          try: () => db.updateTable("jobs").set(serializeJob(next)).where("id", "=", id).execute(),
          catch: (e) => new DatabaseJobNotFoundError({ jobId: id })
        });
        return next;
      });
    },
    fail(id, error, at = (/* @__PURE__ */ new Date()).toISOString()) {
      return Effect75.gen(function* () {
        const current = yield* Effect75.tryPromise({
          try: () => db.selectFrom("jobs").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect75.catchAll(() => Effect75.succeed(void 0)));
        if (!current) {
          return yield* Effect75.fail(new DatabaseJobNotFoundError({ jobId: id }));
        }
        const record = parseJob(current);
        const next = {
          ...record,
          status: "failed",
          result: null,
          error,
          updatedAt: at,
          completedAt: at
        };
        yield* Effect75.tryPromise({
          try: () => db.updateTable("jobs").set(serializeJob(next)).where("id", "=", id).execute(),
          catch: (e) => new DatabaseJobNotFoundError({ jobId: id })
        });
        return next;
      });
    }
  };
}

// src/infra/postgres-repositories/postgres-memory-repository.ts
import { Effect as Effect76 } from "effect";
function toRow(record) {
  return {
    id: record.id,
    user_id: record.userId,
    key: record.key,
    data: JSON.stringify(record),
    version: record.version,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}
function parseRow(row) {
  return {
    ...parseStoredJsonRecord(row.data),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function createPostgresMemoryRepository(db) {
  return {
    put(record, version = 1) {
      return Effect76.gen(function* () {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const next = {
          ...record,
          version,
          createdAt: record.createdAt ?? now,
          updatedAt: record.updatedAt ?? now
        };
        yield* Effect76.tryPromise({
          try: () => db.insertInto("memories").values(toRow(next)).onConflict((oc) => oc.column("id").doUpdateSet(toRow(next))).execute(),
          catch: () => void 0
        }).pipe(Effect76.catchAll(() => Effect76.succeed(void 0)));
        return next;
      });
    },
    get(userId, key) {
      return Effect76.gen(function* () {
        const row = yield* Effect76.tryPromise({
          try: () => db.selectFrom("memories").where("user_id", "=", userId).where("key", "=", key).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect76.catchAll(() => Effect76.succeed(void 0)));
        return row ? parseRow(row) : void 0;
      });
    },
    listByUser(userId) {
      return Effect76.gen(function* () {
        const rows = yield* Effect76.tryPromise({
          try: () => db.selectFrom("memories").where("user_id", "=", userId).selectAll().execute(),
          catch: () => []
        }).pipe(Effect76.catchAll(() => Effect76.succeed([])));
        return rows.map(parseRow);
      });
    },
    remove(userId, key) {
      return Effect76.gen(function* () {
        const result = yield* Effect76.tryPromise({
          try: () => db.deleteFrom("memories").where("user_id", "=", userId).where("key", "=", key).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect76.catchAll(() => Effect76.succeed({ numDeletedRows: 0n })));
        return result.numDeletedRows > 0n;
      });
    }
  };
}

// src/infra/postgres-repositories/postgres-content-type-repository.ts
import { Effect as Effect77 } from "effect";
function toRow2(record) {
  return {
    id: record.id,
    data: JSON.stringify(record),
    version: record.version,
    updated_at: record.updatedAt
  };
}
function parseRow2(row) {
  return {
    ...parseStoredJsonRecord(row.data),
    version: row.version,
    updatedAt: row.updated_at
  };
}
function createPostgresContentTypeRepository(db) {
  return {
    put(record, version = 1, updatedAt = (/* @__PURE__ */ new Date()).toISOString()) {
      return Effect77.gen(function* () {
        const next = { ...record, version, updatedAt };
        yield* Effect77.tryPromise({
          try: () => db.insertInto("content_types").values(toRow2(next)).onConflict((oc) => oc.column("id").doUpdateSet(toRow2(next))).execute(),
          catch: () => void 0
        }).pipe(Effect77.catchAll(() => Effect77.succeed(void 0)));
        return next;
      });
    },
    get(id) {
      return Effect77.gen(function* () {
        const row = yield* Effect77.tryPromise({
          try: () => db.selectFrom("content_types").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect77.catchAll(() => Effect77.succeed(void 0)));
        return row ? parseRow2(row) : void 0;
      });
    },
    list() {
      return Effect77.gen(function* () {
        const rows = yield* Effect77.tryPromise({
          try: () => db.selectFrom("content_types").selectAll().execute(),
          catch: () => []
        }).pipe(Effect77.catchAll(() => Effect77.succeed([])));
        return rows.map(parseRow2);
      });
    }
  };
}

// src/infra/postgres-repositories/postgres-pipeline-repository.ts
import { Effect as Effect78 } from "effect";
function toRow3(record) {
  return {
    id: record.id,
    data: JSON.stringify(record),
    version: record.version,
    updated_at: record.updatedAt
  };
}
function parseRow3(row) {
  return {
    ...parseStoredJsonRecord(row.data),
    version: row.version,
    updatedAt: row.updated_at
  };
}
function createPostgresPipelineRepository(db) {
  return {
    put(record, version = 1, updatedAt = (/* @__PURE__ */ new Date()).toISOString()) {
      return Effect78.gen(function* () {
        const next = { ...record, version, updatedAt };
        yield* Effect78.tryPromise({
          try: () => db.insertInto("pipelines").values(toRow3(next)).onConflict((oc) => oc.column("id").doUpdateSet(toRow3(next))).execute(),
          catch: () => void 0
        }).pipe(Effect78.catchAll(() => Effect78.succeed(void 0)));
        return next;
      });
    },
    get(id) {
      return Effect78.gen(function* () {
        const row = yield* Effect78.tryPromise({
          try: () => db.selectFrom("pipelines").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect78.catchAll(() => Effect78.succeed(void 0)));
        return row ? parseRow3(row) : void 0;
      });
    },
    list() {
      return Effect78.gen(function* () {
        const rows = yield* Effect78.tryPromise({
          try: () => db.selectFrom("pipelines").selectAll().execute(),
          catch: () => []
        }).pipe(Effect78.catchAll(() => Effect78.succeed([])));
        return rows.map(parseRow3);
      });
    }
  };
}

// src/infra/postgres-repositories/postgres-voice-example-repository.ts
import { Effect as Effect79 } from "effect";
function toRow4(record) {
  return {
    id: record.id,
    user_id: record.userId,
    data: JSON.stringify(record),
    version: record.version,
    created_at: record.createdAt
  };
}
function parseRow4(row) {
  return {
    ...parseStoredJsonRecord(row.data),
    version: row.version,
    createdAt: row.created_at
  };
}
function createPostgresVoiceExampleRepository(db) {
  return {
    create(record, version = 1) {
      return Effect79.gen(function* () {
        const existing = yield* Effect79.tryPromise({
          try: () => db.selectFrom("voice_examples").where("id", "=", record.id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect79.catchAll(() => Effect79.succeed(void 0)));
        if (existing) {
          return yield* Effect79.fail(new DatabaseVoiceExampleAlreadyExistsError({ exampleId: record.id }));
        }
        const next = { ...record, version };
        yield* Effect79.tryPromise({
          try: () => db.insertInto("voice_examples").values(toRow4(next)).execute(),
          catch: (e) => new DatabaseVoiceExampleAlreadyExistsError({ exampleId: record.id })
        });
        return next;
      });
    },
    save(record) {
      return Effect79.gen(function* () {
        const existing = yield* Effect79.tryPromise({
          try: () => db.selectFrom("voice_examples").where("id", "=", record.id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect79.catchAll(() => Effect79.succeed(void 0)));
        if (!existing) {
          return yield* Effect79.fail(new DatabaseVoiceExampleNotFoundError({ exampleId: record.id }));
        }
        const next = { ...record, version: record.version + 1 };
        yield* Effect79.tryPromise({
          try: () => db.updateTable("voice_examples").set(toRow4(next)).where("id", "=", record.id).execute(),
          catch: (e) => new DatabaseVoiceExampleNotFoundError({ exampleId: record.id })
        });
        return next;
      });
    },
    get(id) {
      return Effect79.gen(function* () {
        const row = yield* Effect79.tryPromise({
          try: () => db.selectFrom("voice_examples").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect79.catchAll(() => Effect79.succeed(void 0)));
        return row ? parseRow4(row) : void 0;
      });
    },
    listByUser(userId) {
      return Effect79.gen(function* () {
        const rows = yield* Effect79.tryPromise({
          try: () => db.selectFrom("voice_examples").where("user_id", "=", userId).selectAll().execute(),
          catch: () => []
        }).pipe(Effect79.catchAll(() => Effect79.succeed([])));
        return rows.map(parseRow4);
      });
    },
    remove(id) {
      return Effect79.gen(function* () {
        const result = yield* Effect79.tryPromise({
          try: () => db.deleteFrom("voice_examples").where("id", "=", id).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect79.catchAll(() => Effect79.succeed({ numDeletedRows: 0n })));
        return result.numDeletedRows > 0n;
      });
    },
    removeByUser(userId) {
      return Effect79.gen(function* () {
        const result = yield* Effect79.tryPromise({
          try: () => db.deleteFrom("voice_examples").where("user_id", "=", userId).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect79.catchAll(() => Effect79.succeed({ numDeletedRows: 0n })));
        return Number(result.numDeletedRows);
      });
    }
  };
}

// src/infra/postgres-repositories/postgres-voice-profile-repository.ts
import { Effect as Effect80 } from "effect";
function toRow5(record) {
  return {
    id: record.id,
    user_id: record.userId,
    data: JSON.stringify(record),
    version: record.version
  };
}
function parseRow5(row) {
  return {
    ...parseStoredJsonRecord(row.data),
    version: row.version
  };
}
function createPostgresVoiceProfileRepository(db) {
  return {
    put(record, version = 1) {
      return Effect80.gen(function* () {
        const next = {
          ...record,
          profileVersion: record.version,
          version
        };
        yield* Effect80.tryPromise({
          try: () => db.insertInto("voice_profiles").values(toRow5(next)).onConflict((oc) => oc.column("user_id").doUpdateSet(toRow5(next))).execute(),
          catch: () => void 0
        }).pipe(Effect80.catchAll(() => Effect80.succeed(void 0)));
        return next;
      });
    },
    getByUser(userId) {
      return Effect80.gen(function* () {
        const row = yield* Effect80.tryPromise({
          try: () => db.selectFrom("voice_profiles").where("user_id", "=", userId).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect80.catchAll(() => Effect80.succeed(void 0)));
        return row ? parseRow5(row) : void 0;
      });
    },
    removeByUser(userId) {
      return Effect80.gen(function* () {
        const result = yield* Effect80.tryPromise({
          try: () => db.deleteFrom("voice_profiles").where("user_id", "=", userId).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect80.catchAll(() => Effect80.succeed({ numDeletedRows: 0n })));
        return result.numDeletedRows > 0n;
      });
    }
  };
}

// src/infra/postgres-repositories/postgres-voice-profile-diagnostics-repository.ts
import { Effect as Effect81 } from "effect";
function toRow6(record) {
  return {
    id: record.id,
    user_id: record.userId,
    data: JSON.stringify(record),
    version: record.version
  };
}
function parseRow6(row) {
  return { ...parseStoredJsonRecord(row.data), version: row.version };
}
function createPostgresVoiceProfileDiagnosticsRepository(db) {
  return {
    put(record, version = 1) {
      return Effect81.gen(function* () {
        const next = { ...record, version };
        yield* Effect81.tryPromise({
          try: () => db.insertInto("voice_profile_diagnostics").values(toRow6(next)).onConflict((oc) => oc.column("user_id").doUpdateSet(toRow6(next))).execute(),
          catch: () => void 0
        }).pipe(Effect81.catchAll(() => Effect81.succeed(void 0)));
        return next;
      });
    },
    getByUser(userId) {
      return Effect81.gen(function* () {
        const row = yield* Effect81.tryPromise({
          try: () => db.selectFrom("voice_profile_diagnostics").where("user_id", "=", userId).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect81.catchAll(() => Effect81.succeed(void 0)));
        return row ? parseRow6(row) : void 0;
      });
    },
    removeByUser(userId) {
      return Effect81.gen(function* () {
        const result = yield* Effect81.tryPromise({
          try: () => db.deleteFrom("voice_profile_diagnostics").where("user_id", "=", userId).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect81.catchAll(() => Effect81.succeed({ numDeletedRows: 0n })));
        return result.numDeletedRows > 0n;
      });
    }
  };
}

// src/infra/postgres-repositories/postgres-voice-profile-snapshot-repository.ts
import { Effect as Effect82 } from "effect";
function toRow7(record) {
  return {
    id: record.id,
    user_id: record.userId,
    data: JSON.stringify(record),
    version: record.version,
    created_at: record.createdAt
  };
}
function parseRow7(row) {
  return {
    ...parseStoredJsonRecord(row.data),
    version: row.version,
    createdAt: row.created_at
  };
}
function createPostgresVoiceProfileSnapshotRepository(db) {
  return {
    create(record, version = 1) {
      return Effect82.gen(function* () {
        const next = { ...record, version };
        yield* Effect82.tryPromise({
          try: () => db.insertInto("voice_profile_snapshots").values(toRow7(next)).execute(),
          catch: () => void 0
        }).pipe(Effect82.catchAll(() => Effect82.succeed(void 0)));
        return next;
      });
    },
    get(id) {
      return Effect82.gen(function* () {
        const row = yield* Effect82.tryPromise({
          try: () => db.selectFrom("voice_profile_snapshots").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect82.catchAll(() => Effect82.succeed(void 0)));
        return row ? parseRow7(row) : void 0;
      });
    },
    listByUser(userId) {
      return Effect82.gen(function* () {
        const rows = yield* Effect82.tryPromise({
          try: () => db.selectFrom("voice_profile_snapshots").where("user_id", "=", userId).selectAll().execute(),
          catch: () => []
        }).pipe(Effect82.catchAll(() => Effect82.succeed([])));
        return rows.map(parseRow7);
      });
    },
    removeByUser(userId) {
      return Effect82.gen(function* () {
        const result = yield* Effect82.tryPromise({
          try: () => db.deleteFrom("voice_profile_snapshots").where("user_id", "=", userId).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect82.catchAll(() => Effect82.succeed({ numDeletedRows: 0n })));
        return Number(result.numDeletedRows);
      });
    }
  };
}

// src/infra/postgres-repositories/postgres-voice-example-batch-repository.ts
import { Effect as Effect83 } from "effect";
function toRow8(record) {
  return {
    id: record.id,
    user_id: record.userId,
    data: JSON.stringify(record),
    version: record.version,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}
function parseRow8(row) {
  return {
    ...parseStoredJsonRecord(row.data),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function createPostgresVoiceExampleBatchRepository(db) {
  return {
    create(record, version = 1) {
      return Effect83.gen(function* () {
        const existing = yield* Effect83.tryPromise({
          try: () => db.selectFrom("voice_example_batches").where("id", "=", record.id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect83.catchAll(() => Effect83.succeed(void 0)));
        if (existing) {
          return yield* Effect83.fail(new DatabaseVoiceBatchAlreadyExistsError({ batchId: record.id }));
        }
        const next = { ...record, version };
        yield* Effect83.tryPromise({
          try: () => db.insertInto("voice_example_batches").values(toRow8(next)).execute(),
          catch: (e) => new DatabaseVoiceBatchAlreadyExistsError({ batchId: record.id })
        });
        return next;
      });
    },
    save(record) {
      return Effect83.gen(function* () {
        const existing = yield* Effect83.tryPromise({
          try: () => db.selectFrom("voice_example_batches").where("id", "=", record.id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect83.catchAll(() => Effect83.succeed(void 0)));
        if (!existing) {
          return yield* Effect83.fail(new DatabaseVoiceBatchNotFoundError({ batchId: record.id }));
        }
        const next = { ...record, version: record.version + 1, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
        yield* Effect83.tryPromise({
          try: () => db.updateTable("voice_example_batches").set(toRow8(next)).where("id", "=", record.id).execute(),
          catch: (e) => new DatabaseVoiceBatchNotFoundError({ batchId: record.id })
        });
        return next;
      });
    },
    get(id) {
      return Effect83.gen(function* () {
        const row = yield* Effect83.tryPromise({
          try: () => db.selectFrom("voice_example_batches").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect83.catchAll(() => Effect83.succeed(void 0)));
        return row ? parseRow8(row) : void 0;
      });
    },
    listByUser(userId) {
      return Effect83.gen(function* () {
        const rows = yield* Effect83.tryPromise({
          try: () => db.selectFrom("voice_example_batches").where("user_id", "=", userId).selectAll().execute(),
          catch: () => []
        }).pipe(Effect83.catchAll(() => Effect83.succeed([])));
        return rows.map(parseRow8);
      });
    },
    remove(id) {
      return Effect83.gen(function* () {
        const result = yield* Effect83.tryPromise({
          try: () => db.deleteFrom("voice_example_batches").where("id", "=", id).executeTakeFirst(),
          catch: () => ({ numDeletedRows: 0n })
        }).pipe(Effect83.catchAll(() => Effect83.succeed({ numDeletedRows: 0n })));
        return result.numDeletedRows > 0n;
      });
    }
  };
}

// src/infra/postgres-repositories/postgres-voice-training-consent-repository.ts
import { Effect as Effect84 } from "effect";
function toRow9(record) {
  return {
    id: record.id,
    user_id: record.userId,
    data: JSON.stringify(record),
    version: record.version,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}
function parseRow9(row) {
  return {
    ...parseStoredJsonRecord(row.data),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function createPostgresVoiceTrainingConsentRepository(db) {
  return {
    put(record, version = 1) {
      return Effect84.gen(function* () {
        const next = toVoiceTrainingConsentRecord(record, version);
        yield* Effect84.tryPromise({
          try: () => db.insertInto("voice_training_consents").values(toRow9(next)).onConflict((oc) => oc.column("user_id").doUpdateSet(toRow9(next))).execute(),
          catch: () => void 0
        }).pipe(Effect84.catchAll(() => Effect84.succeed(void 0)));
        return next;
      });
    },
    getByUser(userId) {
      return Effect84.gen(function* () {
        const row = yield* Effect84.tryPromise({
          try: () => db.selectFrom("voice_training_consents").where("user_id", "=", userId).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect84.catchAll(() => Effect84.succeed(void 0)));
        return row ? parseRow9(row) : void 0;
      });
    }
  };
}

// src/infra/postgres-repositories/postgres-audit-repository.ts
import { Effect as Effect85 } from "effect";
function parseMetadata(value) {
  if (typeof value !== "string") {
    return { ...value };
  }
  const parsed = JSON.parse(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? { ...parsed } : {};
}
function parseRow10(row) {
  return {
    id: row.id,
    logicalKey: row.logical_key,
    actorId: row.actor_id,
    actorType: row.actor_type,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    mutationType: row.mutation_type,
    occurredAt: row.occurred_at,
    metadata: parseMetadata(row.metadata)
  };
}
function toRow10(record) {
  return {
    id: record.id,
    logical_key: record.logicalKey,
    actor_id: record.actorId,
    actor_type: record.actorType,
    resource_type: record.resourceType,
    resource_id: record.resourceId,
    mutation_type: record.mutationType,
    occurred_at: record.occurredAt,
    metadata: JSON.stringify(record.metadata)
  };
}
function createPostgresAuditRepository(db) {
  return {
    putIfAbsent(record) {
      return Effect85.gen(function* () {
        const existing = yield* Effect85.tryPromise({
          try: () => db.selectFrom("audit_records").where("logical_key", "=", record.logicalKey).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect85.catchAll(() => Effect85.succeed(void 0)));
        if (existing) {
          return parseRow10(existing);
        }
        const row = toRow10(record);
        yield* Effect85.tryPromise({
          try: () => db.insertInto("audit_records").values(row).onConflict((conflict) => conflict.column("logical_key").doNothing()).execute(),
          catch: () => void 0
        }).pipe(Effect85.catchAll(() => Effect85.succeed(void 0)));
        const stored = yield* Effect85.tryPromise({
          try: () => db.selectFrom("audit_records").where("logical_key", "=", record.logicalKey).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect85.catchAll(() => Effect85.succeed(void 0)));
        return stored ? parseRow10(stored) : record;
      }).pipe(Effect85.orDie);
    },
    getByLogicalKey(logicalKey) {
      return Effect85.gen(function* () {
        const row = yield* Effect85.tryPromise({
          try: () => db.selectFrom("audit_records").where("logical_key", "=", logicalKey).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect85.catchAll(() => Effect85.succeed(void 0)));
        return row ? parseRow10(row) : void 0;
      }).pipe(Effect85.orDie);
    },
    list() {
      return Effect85.gen(function* () {
        const rows = yield* Effect85.tryPromise({
          try: () => db.selectFrom("audit_records").selectAll().orderBy("occurred_at", "asc").execute(),
          catch: () => []
        }).pipe(Effect85.catchAll(() => Effect85.succeed([])));
        return rows.map(parseRow10);
      }).pipe(Effect85.orDie);
    }
  };
}

// src/infra/postgres-client.ts
function getPostgresDatabase(client) {
  if ("kysely" in client && client.kysely instanceof Kysely2) {
    return client.kysely;
  }
  return void 0;
}
function createPostgresDatabaseClient(db) {
  return {
    kysely: db,
    jobs: createPostgresJobRepository(db),
    memories: createPostgresMemoryRepository(db),
    contentTypes: createPostgresContentTypeRepository(db),
    pipelines: createPostgresPipelineRepository(db),
    voiceExamples: createPostgresVoiceExampleRepository(db),
    voiceProfiles: createPostgresVoiceProfileRepository(db),
    voiceProfileDiagnostics: createPostgresVoiceProfileDiagnosticsRepository(db),
    voiceProfileSnapshots: createPostgresVoiceProfileSnapshotRepository(db),
    voiceExampleBatches: createPostgresVoiceExampleBatchRepository(db),
    voiceTrainingConsents: createPostgresVoiceTrainingConsentRepository(db),
    audit: createPostgresAuditRepository(db),
    transaction(operation) {
      return Effect86.async((resume) => {
        void db.transaction().execute(async (trxDb) => {
          const trxClient = createPostgresDatabaseClient(trxDb);
          const exit = await Effect86.runPromiseExit(operation(trxClient));
          if (Exit.isSuccess(exit)) {
            return exit.value;
          }
          throw exit;
        }).then(
          (value) => resume(Effect86.succeed(value)),
          (error) => {
            if (Exit.isFailure(error)) {
              const failure = Cause2.failureOption(error.cause);
              if (Option2.isSome(failure)) {
                resume(Effect86.fail(failure.value));
                return;
              }
            }
            resume(
              Effect86.fail(
                new DatabaseTransactionInvariantError({
                  message: error instanceof Error ? error.message : String(error)
                })
              )
            );
          }
        );
      });
    },
    snapshot() {
      throw new Error("snapshot() is not supported in PostgreSQL mode");
    }
  };
}

// src/infra/migration-runner.ts
import { Effect as Effect87 } from "effect";
import { Kysely as Kysely3, PostgresDialect as PostgresDialect2, sql } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import { existsSync as existsSync3 } from "node:fs";
import { resolve as resolve3 } from "node:path";

// src/package-root.ts
import { existsSync as existsSync2 } from "node:fs";
import { dirname as dirname2, resolve as resolve2 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
var currentDir = dirname2(fileURLToPath2(import.meta.url));
var root = resolve2(currentDir, "..");
var depth = 0;
while (!existsSync2(resolve2(root, "package.json")) && depth < 5) {
  root = resolve2(root, "..");
  depth++;
}
var backendPackageRoot2 = root;

// src/infra/migration-runner.ts
var compiledMigrationDir = resolve3(backendPackageRoot2, "dist/infra/migrations");
var sourceMigrationDir = resolve3(backendPackageRoot2, "src/infra/migrations");
var migrationFolder = existsSync3(compiledMigrationDir) ? compiledMigrationDir : sourceMigrationDir;
function createSchemaValidationError(message, reason) {
  return { _tag: "SchemaValidationError", message, reason };
}
function validateSchema(db, expectedTables) {
  return Effect87.gen(function* () {
    const tables = yield* Effect87.tryPromise({
      try: async () => {
        const result = await db.introspection.getTables({
          withInternalKyselyTables: false
        });
        return result.map((t) => t.name);
      },
      catch: (e) => createSchemaValidationError(
        `Failed to introspect database: ${e instanceof Error ? e.message : String(e)}`,
        "connectivity"
      )
    });
    const missing = expectedTables.filter((t) => !tables.includes(t));
    if (missing.length > 0) {
      return yield* Effect87.fail(
        createSchemaValidationError(
          `Missing tables: ${missing.join(", ")}`,
          "schema_mismatch"
        )
      );
    }
    return void 0;
  });
}
var expectedDatabaseTables = [
  "jobs",
  "memories",
  "content_types",
  "pipelines",
  "voice_examples",
  "voice_profiles",
  "voice_profile_diagnostics",
  "voice_profile_snapshots",
  "voice_example_batches",
  "application_users",
  "operators",
  "audit_records",
  "voice_training_consents",
  "billing_snapshots",
  "billing_plans",
  "billing_subscriptions",
  "billing_usage_records",
  "billing_ledger_entries",
  "billing_reservations",
  "billing_cycle_states",
  "billing_top_up_packages",
  "billing_operation_idempotency",
  "outbox_events",
  "execution_idempotency"
];

// src/infra/database-bootstrap.ts
function createBackendDatabaseClient(config) {
  return Effect88.gen(function* () {
    if (config.databaseUrl) {
      const db = yield* bootstrapPostgresDatabase(config.databaseUrl);
      yield* validateSchema(db, expectedDatabaseTables);
      return createPostgresDatabaseClient(db);
    }
    return createDatabase();
  });
}

// src/infra/durable-store.ts
import { Effect as Effect90 } from "effect";
import { sql as sql2 } from "kysely";

// src/infra/postgres-billing-store.ts
import { Effect as Effect89 } from "effect";
var billingPersistQueue = Promise.resolve();
function runBillingRepositoryPersistSerialized(task) {
  const next = billingPersistQueue.catch(() => void 0).then(task);
  billingPersistQueue = next.then(
    () => void 0,
    () => void 0
  );
  return next;
}
function scheduleBillingRepositoryPersist(task) {
  billingPersistQueue = runBillingRepositoryPersistSerialized(task).then(
    () => void 0,
    () => void 0
  );
}
async function persistPostgresBillingRepositoryNow(executor, repository) {
  await clearBillingTables(executor);
  await insertBillingRepository(executor, repository);
}
function hasPostgresBillingTables(db) {
  return Effect89.tryPromise({
    try: async () => {
      const tables = await db.introspection.getTables({ withInternalKyselyTables: false });
      return tables.some((table) => table.name === "billing_plans");
    },
    catch: () => false
  }).pipe(Effect89.orElseSucceed(() => false));
}
function loadPostgresBillingRepository(db) {
  return Effect89.tryPromise({
    try: async () => {
      const [plans, subscriptions, usage2, ledger, reservations, cycleStates, topUpPackages, idempotency] = await Promise.all([
        db.selectFrom("billing_plans").selectAll().execute(),
        db.selectFrom("billing_subscriptions").selectAll().execute(),
        db.selectFrom("billing_usage_records").selectAll().execute(),
        db.selectFrom("billing_ledger_entries").selectAll().orderBy("id", "asc").execute(),
        db.selectFrom("billing_reservations").selectAll().execute(),
        db.selectFrom("billing_cycle_states").selectAll().execute(),
        db.selectFrom("billing_top_up_packages").selectAll().execute(),
        db.selectFrom("billing_operation_idempotency").selectAll().execute()
      ]);
      const repository = createBillingRepository({
        plans: plans.map((row) => row.data),
        subscriptions: subscriptions.map(
          (row) => ({
            id: row.id,
            userId: row.user_id,
            planId: row.plan_id,
            status: row.status,
            startedAt: row.started_at,
            ...row.renewed_at ? { renewedAt: row.renewed_at } : {},
            ...row.expires_at ? { expiresAt: row.expires_at } : {}
          })
        ),
        usage: usage2.map(
          (row) => ({
            id: row.id,
            userId: row.user_id,
            subscriptionId: row.subscription_id,
            planId: row.plan_id,
            kind: row.kind,
            amount: row.amount,
            credits: row.credits,
            createdAt: row.created_at,
            metadata: row.metadata ?? {}
          })
        ),
        ledger: ledger.map(
          (row) => ({
            subscriptionId: row.subscription_id,
            accountId: row.account_id,
            entryType: row.entry_type,
            creditsDelta: row.credits_delta,
            balanceAfter: row.balance_after,
            referenceType: row.reference_type,
            referenceId: row.reference_id,
            idempotencyKey: row.idempotency_key,
            metadata: row.metadata ?? {},
            createdAt: row.created_at
          })
        ),
        reservations: reservations.map(
          (row) => ({
            reservationId: row.reservation_id,
            generationCycleId: row.generation_cycle_id,
            subscriptionId: row.subscription_id,
            accountId: row.account_id,
            qualityMode: row.quality_mode,
            retryCount: row.retry_count,
            reservedCredits: row.reserved_credits,
            status: row.status,
            idempotencyKey: row.idempotency_key,
            metadata: row.metadata ?? {},
            createdAt: row.created_at,
            updatedAt: row.updated_at
          })
        ),
        cycleStates: cycleStates.map(
          (row) => ({
            cycleId: row.cycle_id,
            subscriptionId: row.subscription_id,
            accountId: row.account_id,
            openedAt: row.opened_at,
            closedAt: row.closed_at,
            rolloverCredits: row.rollover_credits,
            grantedCredits: row.granted_credits,
            expiredCredits: row.expired_credits
          })
        ),
        topUpPackages: topUpPackages.map(
          (row) => ({
            id: row.id,
            credits: row.credits,
            priceCents: row.price_cents,
            currency: row.currency,
            ...row.description ? { description: row.description } : {}
          })
        )
      });
      for (const row of idempotency) {
        repository.idempotency.set(row.operation_key, row.result);
      }
      return repository;
    },
    catch: (error) => error instanceof Error ? error : new Error(String(error))
  });
}
async function writePostgresBillingRepository(db, repository) {
  await db.transaction().execute((trx) => persistPostgresBillingRepositoryNow(trx, repository));
}
async function clearBillingTables(trx) {
  await trx.deleteFrom("billing_operation_idempotency").execute();
  await trx.deleteFrom("billing_reservations").execute();
  await trx.deleteFrom("billing_ledger_entries").execute();
  await trx.deleteFrom("billing_usage_records").execute();
  await trx.deleteFrom("billing_cycle_states").execute();
  await trx.deleteFrom("billing_top_up_packages").execute();
  await trx.deleteFrom("billing_subscriptions").execute();
  await trx.deleteFrom("billing_plans").execute();
}
async function insertBillingRepository(trx, repository) {
  if (repository.plans.size > 0) {
    await trx.insertInto("billing_plans").values(
      Array.from(repository.plans.entries()).map(([id, plan]) => ({
        id,
        data: plan
      }))
    ).execute();
  }
  if (repository.subscriptions.size > 0) {
    await trx.insertInto("billing_subscriptions").values(
      Array.from(repository.subscriptions.values()).map((subscription) => ({
        id: subscription.id,
        user_id: subscription.userId,
        plan_id: subscription.planId,
        status: subscription.status,
        started_at: subscription.startedAt,
        renewed_at: subscription.renewedAt ?? null,
        expires_at: subscription.expiresAt ?? null
      }))
    ).execute();
  }
  if (repository.usage.length > 0) {
    await trx.insertInto("billing_usage_records").values(
      repository.usage.map((entry) => ({
        id: entry.id,
        user_id: entry.userId,
        plan_id: entry.planId,
        subscription_id: entry.subscriptionId,
        kind: entry.kind,
        amount: entry.amount,
        credits: entry.credits,
        created_at: entry.createdAt,
        metadata: entry.metadata ?? {}
      }))
    ).execute();
  }
  if (repository.ledger.length > 0) {
    await trx.insertInto("billing_ledger_entries").values(
      repository.ledger.map((entry) => ({
        subscription_id: entry.subscriptionId,
        account_id: entry.accountId,
        entry_type: entry.entryType,
        credits_delta: entry.creditsDelta,
        balance_after: entry.balanceAfter,
        reference_type: entry.referenceType,
        reference_id: entry.referenceId,
        idempotency_key: entry.idempotencyKey,
        metadata: entry.metadata,
        created_at: entry.createdAt
      }))
    ).execute();
  }
  if (repository.reservations.size > 0) {
    await trx.insertInto("billing_reservations").values(
      Array.from(repository.reservations.values()).map((reservation) => ({
        reservation_id: reservation.reservationId,
        generation_cycle_id: reservation.generationCycleId,
        subscription_id: reservation.subscriptionId,
        account_id: reservation.accountId,
        quality_mode: reservation.qualityMode,
        retry_count: reservation.retryCount,
        reserved_credits: reservation.reservedCredits,
        status: reservation.status,
        idempotency_key: reservation.idempotencyKey,
        metadata: reservation.metadata,
        created_at: reservation.createdAt,
        updated_at: reservation.updatedAt
      }))
    ).execute();
  }
  if (repository.cycleStates.size > 0) {
    await trx.insertInto("billing_cycle_states").values(
      Array.from(repository.cycleStates.values()).map((state) => ({
        account_id: state.accountId,
        cycle_id: state.cycleId,
        subscription_id: state.subscriptionId,
        opened_at: state.openedAt,
        closed_at: state.closedAt,
        rollover_credits: state.rolloverCredits,
        granted_credits: state.grantedCredits,
        expired_credits: state.expiredCredits
      }))
    ).execute();
  }
  if (repository.topUpPackages.size > 0) {
    await trx.insertInto("billing_top_up_packages").values(
      Array.from(repository.topUpPackages.values()).map((pkg) => ({
        id: pkg.id,
        credits: pkg.credits,
        price_cents: pkg.priceCents,
        currency: pkg.currency,
        description: pkg.description ?? null
      }))
    ).execute();
  }
  if (repository.idempotency.size > 0) {
    await trx.insertInto("billing_operation_idempotency").values(
      Array.from(repository.idempotency.entries()).map(([operationKey, result]) => ({
        operation_key: operationKey,
        result
      }))
    ).execute();
  }
}

// src/infra/durable-store.ts
var BILLING_SNAPSHOT_ID = "default";
function loadBillingRepository(db) {
  return Effect90.gen(function* () {
    const relationalEnabled = yield* hasPostgresBillingTables(db);
    if (relationalEnabled) {
      const relational = yield* loadPostgresBillingRepository(db).pipe(
        Effect90.catchAll(() => Effect90.succeed(createBillingRepository()))
      );
      if (repositoryHasBillingData(relational)) {
        return relational;
      }
    }
    return yield* loadBillingSnapshotRepository(db);
  });
}
function repositoryHasBillingData(repository) {
  return repository.plans.size > 0 || repository.subscriptions.size > 0 || repository.ledger.length > 0 || repository.usage.length > 0;
}
function loadBillingSnapshotRepository(db) {
  return Effect90.gen(function* () {
    const row = yield* Effect90.tryPromise({
      try: () => db.selectFrom("billing_snapshots").where("id", "=", BILLING_SNAPSHOT_ID).selectAll().executeTakeFirst(),
      catch: () => void 0
    }).pipe(Effect90.catchAll(() => Effect90.succeed(void 0)));
    if (!row) {
      return createBillingRepository();
    }
    const payload = row.data;
    const repository = createBillingRepository({
      plans: payload.plans?.map(([, plan]) => plan),
      subscriptions: payload.subscriptions?.map(([, subscription]) => subscription) ?? [],
      usage: payload.usage ?? [],
      ledger: payload.ledger ?? [],
      topUpPackages: payload.topUpPackages?.map(([, pkg]) => pkg) ?? [],
      reservations: payload.reservations?.map(([, reservation]) => reservation) ?? [],
      cycleStates: payload.cycleStates?.map(([, state]) => state) ?? []
    });
    for (const [key, value] of payload.idempotency ?? []) {
      repository.idempotency.set(key, value);
    }
    return repository;
  });
}
function saveBillingRepositoryUnqueued(db, repository, updatedAt) {
  return Effect90.gen(function* () {
    const relationalEnabled = yield* hasPostgresBillingTables(db);
    if (relationalEnabled) {
      yield* Effect90.tryPromise({
        try: () => writePostgresBillingRepository(db, repository),
        catch: (error) => error instanceof Error ? error : new Error(String(error))
      });
      return;
    }
    const payload = {
      plans: Array.from(repository.plans.entries()),
      subscriptions: Array.from(repository.subscriptions.entries()),
      usage: [...repository.usage],
      ledger: [...repository.ledger],
      topUpPackages: Array.from(repository.topUpPackages.entries()),
      reservations: Array.from(repository.reservations.entries()),
      cycleStates: Array.from(repository.cycleStates.entries()),
      idempotency: Array.from(repository.idempotency.entries())
    };
    yield* Effect90.tryPromise({
      try: () => db.insertInto("billing_snapshots").values({
        id: BILLING_SNAPSHOT_ID,
        data: JSON.stringify(payload),
        updated_at: updatedAt
      }).onConflict(
        (oc) => oc.column("id").doUpdateSet({
          data: JSON.stringify(payload),
          updated_at: updatedAt
        })
      ).execute(),
      catch: (error) => error instanceof Error ? error : new Error(String(error))
    });
  });
}
function saveBillingRepository(db, repository, updatedAt) {
  return Effect90.tryPromise({
    try: () => runBillingRepositoryPersistSerialized(
      () => Effect90.runPromise(saveBillingRepositoryUnqueued(db, repository, updatedAt))
    ),
    catch: (error) => error instanceof Error ? error : new Error(String(error))
  });
}

// src/product/billing/durable-billing.ts
import { Effect as Effect91 } from "effect";
function logPersistFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[billing] failed to persist repository: ${message}`);
}
function createPersistingBillingService(postgres, repository, now) {
  const billing = createBillingService({ repository });
  const persistUnqueued = () => saveBillingRepositoryUnqueued(postgres, repository, now().toISOString());
  const persist = () => saveBillingRepository(postgres, repository, now().toISOString());
  const persistSilently = () => persist().pipe(
    Effect91.catchAll(
      (error) => Effect91.sync(() => {
        logPersistFailure(error);
      })
    )
  );
  const schedulePersist = () => {
    scheduleBillingRepositoryPersist(() => Effect91.runPromise(persistUnqueued()));
  };
  return {
    registerPlan(plan) {
      return billing.registerPlan(plan).pipe(Effect91.tap(() => persistSilently()));
    },
    upsertSubscription(subscription) {
      const result = billing.upsertSubscription(subscription);
      schedulePersist();
      return result;
    },
    recordUsage(usage2) {
      const result = billing.recordUsage(usage2);
      schedulePersist();
      return result;
    },
    getEntitlement: billing.getEntitlement.bind(billing),
    getWallet: billing.getWallet.bind(billing),
    consumeCredits(userId, planId, amount, kind) {
      return billing.consumeCredits(userId, planId, amount, kind).pipe(Effect91.tap(() => persistSilently()));
    },
    quoteDebitForMode: billing.quoteDebitForMode.bind(billing),
    startCycle(request) {
      return billing.startCycle(request).pipe(Effect91.tap(() => persistSilently()));
    },
    reserveGenerationCredits(request) {
      return billing.reserveGenerationCredits(request).pipe(Effect91.tap(() => persistSilently()));
    },
    captureReservedCredits(request) {
      return billing.captureReservedCredits(request).pipe(Effect91.tap(() => persistSilently()));
    },
    releaseReservedCredits(request) {
      return billing.releaseReservedCredits(request).pipe(Effect91.tap(() => persistSilently()));
    },
    registerTopUpPackage(pkg) {
      const result = billing.registerTopUpPackage(pkg);
      schedulePersist();
      return result;
    },
    listTopUpPackages: billing.listTopUpPackages.bind(billing),
    purchaseTopUp(request) {
      return billing.purchaseTopUp(request).pipe(Effect91.tap(() => persistSilently()));
    },
    charge: billing.charge.bind(billing),
    listPlans: billing.listPlans.bind(billing),
    getPrimarySubscriptionPlanId: billing.getPrimarySubscriptionPlanId.bind(billing),
    listUsage: billing.listUsage.bind(billing),
    listLedger: billing.listLedger.bind(billing),
    listReservations: billing.listReservations.bind(billing)
  };
}

// src/product/ai-policy/ai-policy.ts
import { existsSync as existsSync4 } from "node:fs";
import { Effect as Effect101 } from "effect";

// src/product/ai-policy/ai-policy-loader.ts
import { readFileSync } from "node:fs";
import { dirname as dirname3, join, resolve as resolve4 } from "node:path";
import { Effect as Effect93, Schema as Schema9 } from "effect";

// src/product/ai-policy/ai-policy-schema.ts
import { Schema as Schema8 } from "effect";

// ../../packages/contracts/src/errors.ts
import { Data as Data10 } from "effect";
var ContractDecodeError = class extends Data10.TaggedError("ContractDecodeError") {
};

// ../../packages/contracts/src/content-types.ts
import { Schema as Schema5 } from "effect";

// ../../packages/contracts/src/execution.ts
import { Schema as Schema4 } from "effect";

// ../../packages/contracts/src/shared.ts
import { Effect as Effect92, ParseResult, Schema } from "effect";
function createSchemaDecoder(schemaName, schema) {
  const decode = Schema.decodeUnknown(schema);
  return (input) => decode(input).pipe(
    Effect92.mapError(
      (error) => new ContractDecodeError({
        schema: schemaName,
        message: ParseResult.TreeFormatter.formatErrorSync(error),
        input
      })
    )
  );
}

// ../../packages/contracts/src/voice.ts
import { Schema as Schema3 } from "effect";

// ../../packages/contracts/src/reasoning.ts
import { Schema as Schema2 } from "effect";
var CertaintyLevelSchema = Schema2.Literal("low", "moderate", "high");
var JudgmentFrequencySchema = Schema2.Literal("low", "moderate", "high");
var ConclusionPaceSchema = Schema2.Literal("slow", "moderate", "fast");
var ReaderRelationshipSchema = Schema2.Literal(
  "peer",
  "mentor",
  "observer",
  "collaborator",
  "guide"
);
var AuthoritySourceSchema = Schema2.Literal(
  "personal_observation",
  "lived_experience",
  "data",
  "reference",
  "practice"
);
var FormatRegisterSchema = Schema2.Literal("formal", "informal", "technical", "conversational");
var OpeningStyleSchema = Schema2.Literal("direct", "contextual", "provocative");
var TechnicalDensitySchema = Schema2.Literal("low", "medium", "high");
var CoreReasoningSignatureSchema = Schema2.Struct({
  narrativeProse: Schema2.String,
  certaintyLevel: CertaintyLevelSchema,
  judgmentFrequency: JudgmentFrequencySchema,
  conclusionPace: ConclusionPaceSchema,
  readerRelationship: ReaderRelationshipSchema,
  authoritySource: AuthoritySourceSchema,
  derivedAntiPatterns: Schema2.Array(Schema2.String)
});
var FormatExpressionProfileSchema = Schema2.Struct({
  contentType: Schema2.String,
  narrativeProse: Schema2.String,
  register: FormatRegisterSchema,
  openingStyle: OpeningStyleSchema,
  technicalDensity: TechnicalDensitySchema
});
var ReasoningExtractionResultSchema = Schema2.Struct({
  core: CoreReasoningSignatureSchema,
  formatExpressions: Schema2.Record({ key: Schema2.String, value: FormatExpressionProfileSchema })
});
var TransitionFrequencySchema = Schema2.Literal("rare", "occasional", "common", "dominant");
var TransitionTendencySchema = Schema2.Struct({
  from: Schema2.String,
  to: Schema2.String,
  frequency: TransitionFrequencySchema
});
var EpistemicPostureSchema = Schema2.Literal(
  "exploratory",
  "investigative",
  "advocacy_mixed"
);
var TraitFrequencySchema = Schema2.Literal("rare", "occasional", "common", "dominant");
var OpeningModeSchema = Schema2.Literal("observation", "thesis", "mixed");
var PerspectiveShiftDensitySchema = Schema2.Literal("low", "moderate", "high");
var SelfQuestioningLevelSchema = Schema2.Literal("low", "moderate", "high");
var InsightTimingSchema = Schema2.Literal("early", "moderate", "late");
var ClosingModeSchema = Schema2.Literal("conclusion", "open_question", "mixed");
var TRAIT_KEYS = [
  "openingMode",
  "perspectiveShiftDensity",
  "usesCounterexamples",
  "selfQuestioning",
  "insightTiming",
  "usesAnalogies",
  "closingMode"
];
var TraitKeySchema = Schema2.Literal(
  "openingMode",
  "perspectiveShiftDensity",
  "usesCounterexamples",
  "selfQuestioning",
  "insightTiming",
  "usesAnalogies",
  "closingMode"
);
var TraitConfidenceSchema = Schema2.Literal("low", "medium", "high");
var TraitStatusSchema = Schema2.Literal("inferred", "confirmed", "disputed", "unknown");
var TraitValueSchema = Schema2.Union(
  OpeningModeSchema,
  PerspectiveShiftDensitySchema,
  TraitFrequencySchema,
  SelfQuestioningLevelSchema,
  InsightTimingSchema,
  ClosingModeSchema
);
var DevelopmentTraitsSchema = Schema2.Struct({
  openingMode: Schema2.optional(OpeningModeSchema),
  perspectiveShiftDensity: Schema2.optional(PerspectiveShiftDensitySchema),
  usesCounterexamples: Schema2.optional(TraitFrequencySchema),
  selfQuestioning: Schema2.optional(SelfQuestioningLevelSchema),
  insightTiming: Schema2.optional(InsightTimingSchema),
  usesAnalogies: Schema2.optional(TraitFrequencySchema),
  closingMode: Schema2.optional(ClosingModeSchema)
});
var TraitRecordSchema = Schema2.Struct({
  value: Schema2.optional(TraitValueSchema),
  confidence: TraitConfidenceSchema,
  status: TraitStatusSchema,
  evidenceExampleIds: Schema2.Array(Schema2.String)
});
var DevelopmentTraitProfileSchema = Schema2.Struct({
  traits: DevelopmentTraitsSchema,
  records: Schema2.Record({ key: TraitKeySchema, value: TraitRecordSchema })
});
var TraitEvidenceEntrySchema = Schema2.Struct({
  exampleIndex: Schema2.optional(Schema2.Number),
  exampleId: Schema2.optional(Schema2.String),
  value: Schema2.optional(TraitValueSchema)
});
var TraitEvidenceDraftSchema = Schema2.Record({
  key: TraitKeySchema,
  value: Schema2.Array(TraitEvidenceEntrySchema)
});
var TraitConfirmationResponseSchema = Schema2.Literal("confirmed", "rejected", "skipped");
var TraitConfirmationInputSchema = Schema2.Struct({
  traitKey: TraitKeySchema,
  response: TraitConfirmationResponseSchema
});
var TraitConfirmationRecordSchema = Schema2.Struct({
  response: TraitConfirmationResponseSchema,
  recordedAt: Schema2.String
});
var ArgumentDevelopmentSignatureSchema = Schema2.Struct({
  developmentProse: Schema2.String,
  moveLabels: Schema2.Array(Schema2.String),
  transitionTendencies: Schema2.Array(TransitionTendencySchema),
  epistemicPosture: EpistemicPostureSchema,
  structuralAntiPatterns: Schema2.Array(Schema2.String),
  traitProfile: Schema2.optional(DevelopmentTraitProfileSchema)
});
var ArgumentDevelopmentExtractionResultSchema = Schema2.Struct({
  development: ArgumentDevelopmentSignatureSchema,
  traits: Schema2.optional(DevelopmentTraitsSchema),
  traitEvidence: Schema2.optional(TraitEvidenceDraftSchema)
});
var UnifiedVoiceSignatureSchema = Schema2.Struct({
  core: CoreReasoningSignatureSchema,
  development: ArgumentDevelopmentSignatureSchema,
  formatExpressions: Schema2.Record({ key: Schema2.String, value: FormatExpressionProfileSchema })
});
var VoiceReasoningPresentationViewSchema = Schema2.Struct({
  core: CoreReasoningSignatureSchema,
  formatExpressions: Schema2.Array(FormatExpressionProfileSchema),
  reasoningVersion: Schema2.optional(Schema2.Number),
  development: Schema2.optional(ArgumentDevelopmentSignatureSchema),
  developmentImmature: Schema2.optional(Schema2.Boolean),
  traitProfile: Schema2.optional(DevelopmentTraitProfileSchema)
});
var decodeArgumentDevelopmentSignature = createSchemaDecoder(
  "ArgumentDevelopmentSignature",
  ArgumentDevelopmentSignatureSchema
);
var decodeArgumentDevelopmentExtractionResult = createSchemaDecoder(
  "ArgumentDevelopmentExtractionResult",
  ArgumentDevelopmentExtractionResultSchema
);
var decodeUnifiedVoiceSignature = createSchemaDecoder(
  "UnifiedVoiceSignature",
  UnifiedVoiceSignatureSchema
);
var decodeCoreReasoningSignature = createSchemaDecoder(
  "CoreReasoningSignature",
  CoreReasoningSignatureSchema
);
var decodeFormatExpressionProfile = createSchemaDecoder(
  "FormatExpressionProfile",
  FormatExpressionProfileSchema
);
var decodeReasoningExtractionResult = createSchemaDecoder(
  "ReasoningExtractionResult",
  ReasoningExtractionResultSchema
);
var decodeVoiceReasoningPresentationView = createSchemaDecoder(
  "VoiceReasoningPresentationView",
  VoiceReasoningPresentationViewSchema
);
var decodeDevelopmentTraitProfile = createSchemaDecoder(
  "DevelopmentTraitProfile",
  DevelopmentTraitProfileSchema
);
var decodeTraitConfirmationInput = createSchemaDecoder(
  "TraitConfirmationInput",
  TraitConfirmationInputSchema
);

// ../../packages/contracts/src/voice.ts
var VoiceProfileConfidenceSchema = Schema3.Literal("low", "medium", "high");
var VoiceAdaptationModeSchema = Schema3.Literal("conservative", "standard");
var VoiceExampleStateSchema = Schema3.Literal("active", "excluded");
var AttentionLevelSchema = Schema3.Literal("low", "medium", "high");
var ReasonCodeSchema = Schema3.Literal(
  "insufficient_examples",
  "insufficient_diversity",
  "conflicting_signals",
  "processing_failed",
  "plan_restriction",
  "subscription_inactive",
  "feature_flag_disabled",
  "rebuild_failed",
  "rebuild_in_progress",
  "reasoning_extraction_failed",
  "development_extraction_failed",
  "voice_signature_reconciliation_failed",
  "language_conflict",
  "too_many_pinned_examples",
  "invalid_example_payload",
  "batch_expired"
);
var NextActionCodeSchema = Schema3.Literal(
  "add_more_examples",
  "add_examples_from_other_content_types",
  "review_conflicting_examples",
  "remove_pinned_example",
  "retry_batch_commit",
  "wait_for_profile_update",
  "upgrade_plan"
);
var ContributionCodeSchema = Schema3.Literal(
  "reinforces_informal_tone",
  "reinforces_formal_tone",
  "useful_for_linkedin",
  "useful_for_newsletter",
  "useful_for_blog",
  "supports_first_person_voice",
  "redundant_with_recent_examples",
  "signals_negative_pattern"
);
var AttentionReasonCodeSchema = Schema3.Literal(
  "redundant_example",
  "too_short",
  "low_specificity",
  "format_specific_only",
  "conflicts_with_profile",
  "language_conflict",
  "excluded_from_profile"
);
var FallbackReasonCodeSchema = Schema3.Literal("rebuild_failed", "rebuild_in_progress");
var VoiceCoverageSchema = Schema3.Literal("low", "medium", "high");
var VoiceSignalSummarySchema = Schema3.Struct({
  styleMarkers: Schema3.Array(Schema3.String),
  rules: Schema3.Array(Schema3.String),
  antiPatterns: Schema3.Array(Schema3.String),
  reasoningApplied: Schema3.optional(Schema3.Boolean),
  certaintyLevel: Schema3.optional(Schema3.Literal("low", "moderate", "high")),
  conclusionPace: Schema3.optional(Schema3.Literal("slow", "moderate", "fast")),
  developmentApplied: Schema3.optional(Schema3.Boolean),
  epistemicPosture: Schema3.optional(EpistemicPostureSchema),
  developmentTraitsApplied: Schema3.optional(Schema3.Boolean),
  openingMode: Schema3.optional(OpeningModeSchema),
  closingMode: Schema3.optional(ClosingModeSchema),
  insightTiming: Schema3.optional(InsightTimingSchema)
});
var VoiceProfileViewSchema = Schema3.Struct({
  userId: Schema3.String,
  snapshotId: Schema3.String,
  version: Schema3.Number,
  confidence: VoiceProfileConfidenceSchema,
  adaptationMode: VoiceAdaptationModeSchema,
  primaryLanguage: Schema3.String,
  tone: Schema3.String,
  cadence: Schema3.String,
  description: Schema3.optional(Schema3.String),
  lexicon: Schema3.Array(Schema3.String),
  constraints: Schema3.Array(Schema3.String),
  styleMarkers: Schema3.Array(Schema3.String),
  rules: Schema3.Array(Schema3.String),
  antiPatterns: Schema3.Array(Schema3.String)
});
var VoiceMaterialBaseBreakdownSchema = Schema3.Struct({
  totalExamples: Schema3.Number,
  activeExamples: Schema3.Number,
  excludedExamples: Schema3.Number,
  pinnedExamples: Schema3.Number,
  byClassification: Schema3.Record({ key: Schema3.String, value: Schema3.Number }),
  byContentType: Schema3.Record({ key: Schema3.String, value: Schema3.Number }),
  byLanguage: Schema3.Record({ key: Schema3.String, value: Schema3.Number })
});
var VoiceCoverageItemViewSchema = Schema3.Struct({
  contentType: Schema3.String,
  coverage: VoiceCoverageSchema,
  reasonCodes: Schema3.Array(ReasonCodeSchema)
});
var VoiceProfileDiagnosticsViewSchema = Schema3.Struct({
  updating: Schema3.Boolean,
  activeVersion: Schema3.Number,
  pendingVersion: Schema3.optional(Schema3.Number),
  summary: Schema3.optional(Schema3.String),
  reasonCodes: Schema3.Array(ReasonCodeSchema),
  nextActionCodes: Schema3.Array(NextActionCodeSchema),
  bestCoveredContentTypes: Schema3.Array(VoiceCoverageItemViewSchema),
  underrepresentedContentTypes: Schema3.Array(VoiceCoverageItemViewSchema),
  pendingRebuild: Schema3.Struct({
    status: Schema3.Literal("idle", "in_progress", "failed"),
    reasonCode: Schema3.optional(ReasonCodeSchema),
    nextActionCodes: Schema3.Array(NextActionCodeSchema)
  }),
  traitConfirmations: Schema3.optional(
    Schema3.Record({ key: Schema3.String, value: TraitConfirmationRecordSchema })
  )
});
var VoiceProfileScreenViewSchema = Schema3.Struct({
  profile: VoiceProfileViewSchema,
  diagnostics: VoiceProfileDiagnosticsViewSchema,
  materialBase: VoiceMaterialBaseBreakdownSchema,
  reasoning: Schema3.optional(VoiceReasoningPresentationViewSchema)
});
var VoiceExampleEvaluationViewSchema = Schema3.Struct({
  systemWeight: Schema3.Number,
  attentionLevel: AttentionLevelSchema,
  attentionReasonCodes: Schema3.Array(AttentionReasonCodeSchema),
  contributionCode: ContributionCodeSchema,
  contributionPreview: Schema3.String,
  userPinned: Schema3.Boolean
});
var VoiceExampleListItemViewSchema = Schema3.Struct({
  exampleId: Schema3.String,
  version: Schema3.Number,
  state: VoiceExampleStateSchema,
  text: Schema3.String,
  previewText: Schema3.String,
  language: Schema3.String,
  channel: Schema3.optional(Schema3.String),
  format: Schema3.optional(Schema3.String),
  explicitContentType: Schema3.optional(Schema3.String),
  effectiveContentTypeHints: Schema3.Array(Schema3.String),
  classificationLabels: Schema3.Array(Schema3.String),
  pinned: Schema3.Boolean,
  pendingProfileImpact: Schema3.Boolean,
  targetProfileVersion: Schema3.optional(Schema3.Number),
  evaluation: VoiceExampleEvaluationViewSchema,
  createdAt: Schema3.String,
  updatedAt: Schema3.String
});
var VoiceExamplesPageViewSchema = Schema3.Struct({
  items: Schema3.Array(VoiceExampleListItemViewSchema),
  total: Schema3.Number,
  limit: Schema3.Number,
  offset: Schema3.Number
});
var VoiceExampleCreateInputSchema = Schema3.Struct({
  text: Schema3.String,
  language: Schema3.optional(Schema3.String),
  channel: Schema3.optional(Schema3.String),
  format: Schema3.optional(Schema3.String),
  explicitContentType: Schema3.optional(Schema3.String),
  context: Schema3.optional(Schema3.String),
  antiPatternsExplicit: Schema3.optional(Schema3.Array(Schema3.String)),
  userLabels: Schema3.optional(Schema3.Array(Schema3.String)),
  pinned: Schema3.optional(Schema3.Boolean),
  performance: Schema3.optional(
    Schema3.Struct({
      channel: Schema3.optional(Schema3.String),
      publishedAt: Schema3.optional(Schema3.String),
      selfRating: Schema3.optional(Schema3.Number),
      likes: Schema3.optional(Schema3.Number),
      comments: Schema3.optional(Schema3.Number)
    })
  )
});
var VoiceExampleUpdateInputSchema = Schema3.Struct({
  text: Schema3.optional(Schema3.String),
  language: Schema3.optional(Schema3.String),
  channel: Schema3.optional(Schema3.String),
  format: Schema3.optional(Schema3.String),
  explicitContentType: Schema3.optional(Schema3.String),
  context: Schema3.optional(Schema3.String),
  antiPatternsExplicit: Schema3.optional(Schema3.Array(Schema3.String)),
  userLabels: Schema3.optional(Schema3.Array(Schema3.String)),
  pinned: Schema3.optional(Schema3.Boolean),
  state: Schema3.optional(VoiceExampleStateSchema)
});
var VoiceExampleBatchCreateInputSchema = Schema3.Struct({
  expiresAt: Schema3.optional(Schema3.String)
});
var VoiceExampleBatchItemInputSchema = Schema3.Struct({
  clientItemId: Schema3.String,
  input: VoiceExampleCreateInputSchema
});
var VoiceExampleBatchItemsInputSchema = Schema3.Struct({
  items: Schema3.Array(VoiceExampleBatchItemInputSchema)
});
var VoiceExampleBatchItemResultViewSchema = Schema3.Struct({
  clientItemId: Schema3.String,
  accepted: Schema3.Boolean,
  exampleId: Schema3.optional(Schema3.String),
  reasonCode: Schema3.optional(ReasonCodeSchema),
  message: Schema3.optional(Schema3.String)
});
var VoiceExampleBatchViewSchema = Schema3.Struct({
  batchId: Schema3.String,
  status: Schema3.Literal("open", "committed", "expired"),
  expiresAt: Schema3.String,
  acceptedItems: Schema3.Number,
  rejectedItems: Schema3.Number,
  itemResults: Schema3.Array(VoiceExampleBatchItemResultViewSchema)
});
var VoiceExampleBatchCommitResultViewSchema = Schema3.Struct({
  batchId: Schema3.String,
  committedAt: Schema3.String,
  acceptedItems: Schema3.Number,
  rejectedItems: Schema3.Number,
  targetProfileVersion: Schema3.optional(Schema3.Number)
});
var decodeVoiceExampleListItemView = createSchemaDecoder(
  "VoiceExampleListItemView",
  VoiceExampleListItemViewSchema
);
var VoiceTrainingConsentStatusViewSchema = Schema3.Struct({
  granted: Schema3.Boolean,
  grantedAt: Schema3.optional(Schema3.String),
  revokedAt: Schema3.optional(Schema3.String)
});
var decodeVoiceProfileScreenView = createSchemaDecoder("VoiceProfileScreenView", VoiceProfileScreenViewSchema);
var decodeVoiceProfileDiagnosticsView = createSchemaDecoder(
  "VoiceProfileDiagnosticsView",
  VoiceProfileDiagnosticsViewSchema
);
var decodeVoiceTrainingConsentStatusView = createSchemaDecoder(
  "VoiceTrainingConsentStatusView",
  VoiceTrainingConsentStatusViewSchema
);
var decodeVoiceExamplesPageView = createSchemaDecoder("VoiceExamplesPageView", VoiceExamplesPageViewSchema);
var decodeVoiceExampleCreateInput = createSchemaDecoder("VoiceExampleCreateInput", VoiceExampleCreateInputSchema);
var decodeVoiceExampleUpdateInput = createSchemaDecoder("VoiceExampleUpdateInput", VoiceExampleUpdateInputSchema);
var decodeVoiceExampleBatchCreateInput = createSchemaDecoder(
  "VoiceExampleBatchCreateInput",
  VoiceExampleBatchCreateInputSchema
);
var decodeVoiceExampleBatchItemsInput = createSchemaDecoder(
  "VoiceExampleBatchItemsInput",
  VoiceExampleBatchItemsInputSchema
);
var decodeVoiceExampleBatchView = createSchemaDecoder("VoiceExampleBatchView", VoiceExampleBatchViewSchema);
var decodeVoiceExampleBatchCommitResultView = createSchemaDecoder(
  "VoiceExampleBatchCommitResultView",
  VoiceExampleBatchCommitResultViewSchema
);

// ../../packages/contracts/src/execution.ts
var ExecutionModeSchema = Schema4.Literal("sync", "async");
var JobStatusSchema = Schema4.Literal("queued", "running", "done", "failed");
var PipelineTypeSchema = Schema4.Literal(
  "long-form-blog",
  "validation-post",
  "architecture-post",
  "linkedin-post",
  "twitter-thread",
  "newsletter"
);
var QualityModeSchema = Schema4.Literal("fast", "balanced", "strict");
var PreviewRecommendationSchema = Schema4.Struct({
  qualityMode: QualityModeSchema,
  reasonCodes: Schema4.Array(Schema4.String),
  explanation: Schema4.String
});
var PipelineStepDefinitionSchema = Schema4.Struct({
  name: Schema4.String,
  skill: Schema4.String,
  config: Schema4.optional(Schema4.Record({ key: Schema4.String, value: Schema4.Unknown }))
});
var PipelineDefinitionSchema = Schema4.Struct({
  name: Schema4.String,
  steps: Schema4.Array(PipelineStepDefinitionSchema)
});
var JobProgressSchema = Schema4.Struct({
  currentStep: Schema4.String,
  stepIndex: Schema4.Number,
  totalSteps: Schema4.Number,
  percent: Schema4.Number
});
var JobResultSchema = Schema4.Struct({
  content: Schema4.String,
  metadata: Schema4.Record({ key: Schema4.String, value: Schema4.Unknown })
});
var JobErrorSchema = Schema4.Struct({
  message: Schema4.String,
  step: Schema4.NullOr(Schema4.String)
});
var JobCreatedResponseSchema = Schema4.Struct({
  jobId: Schema4.String,
  status: Schema4.Literal("queued", "done"),
  contentType: Schema4.String,
  estimatedSteps: Schema4.Number,
  createdAt: Schema4.String
});
var HealthCheckResponseSchema = Schema4.Struct({
  status: Schema4.Literal("ok", "error"),
  time: Schema4.String,
  engine: Schema4.Struct({
    status: Schema4.Literal("ready", "degraded"),
    version: Schema4.String,
    uptimeSec: Schema4.Number
  })
});
var ReadinessCheckStatusSchema = Schema4.Literal("ready", "blocked");
var ReadinessCheckSchema = Schema4.Struct({
  status: ReadinessCheckStatusSchema,
  detail: Schema4.optional(Schema4.String)
});
var ReadinessResponseSchema = Schema4.Struct({
  status: ReadinessCheckStatusSchema,
  time: Schema4.String,
  service: Schema4.Struct({
    environment: Schema4.String,
    version: Schema4.String
  }),
  checks: Schema4.Struct({
    config: ReadinessCheckSchema,
    auth: ReadinessCheckSchema,
    database: ReadinessCheckSchema
  })
});
var ExecutionControlsSchema = Schema4.Struct({
  qualityMode: Schema4.optional(QualityModeSchema),
  targetScore: Schema4.optional(Schema4.Number),
  maxIterations: Schema4.optional(Schema4.Number),
  minImprovementDelta: Schema4.optional(Schema4.Number),
  maxLLMCalls: Schema4.optional(Schema4.Number)
});
var ExecutionTelemetrySchema = Schema4.Struct({
  llm: Schema4.optional(
    Schema4.Struct({
      executedCount: Schema4.Number,
      bypassedCount: Schema4.Number,
      llmCallsSaved: Schema4.Number,
      bypassRate: Schema4.Number
    })
  ),
  cost: Schema4.optional(
    Schema4.Struct({
      inputTokensTotal: Schema4.Number,
      outputTokensTotal: Schema4.Number,
      estimatedUsdCost: Schema4.Number,
      debitedCredits: Schema4.Number
    })
  ),
  selection: Schema4.optional(
    Schema4.Struct({
      reason: Schema4.String,
      adapter: Schema4.String,
      model: Schema4.String
    })
  ),
  preview: Schema4.optional(
    Schema4.Struct({
      quoteId: Schema4.optional(Schema4.String),
      recommendedQualityMode: Schema4.optional(QualityModeSchema),
      finalQualityMode: QualityModeSchema,
      divergedFromRecommendation: Schema4.Boolean,
      recommendationReasonCodes: Schema4.Array(Schema4.String)
    })
  ),
  pricing: Schema4.optional(
    Schema4.Struct({
      quoteId: Schema4.optional(Schema4.String),
      policyVersion: Schema4.optional(Schema4.String),
      contentType: Schema4.optional(Schema4.String),
      plannedCreditPrice: Schema4.optional(Schema4.Number),
      observedDebitedCredits: Schema4.Number,
      observedUsdCost: Schema4.Number
    })
  ),
  providers: Schema4.optional(
    Schema4.Struct({
      finalProvider: Schema4.String,
      finalModel: Schema4.String,
      attempts: Schema4.Array(
        Schema4.Struct({
          stepName: Schema4.String,
          stepIndex: Schema4.Number,
          provider: Schema4.String,
          model: Schema4.String,
          path: Schema4.Literal("preferred", "fallback"),
          status: Schema4.Literal("succeeded", "failed"),
          inputTokens: Schema4.optional(Schema4.Number),
          outputTokens: Schema4.optional(Schema4.Number),
          estimatedUsdCost: Schema4.optional(Schema4.Number),
          debitedCredits: Schema4.optional(Schema4.Number)
        })
      )
    })
  ),
  billing: Schema4.optional(
    Schema4.Struct({
      userId: Schema4.String,
      planId: Schema4.String,
      generationCycleId: Schema4.String
    })
  )
});
var AsyncRunResponseSchema = JobCreatedResponseSchema;
var ApiErrorCategorySchema = Schema4.Literal(
  "invalid_request",
  "authentication",
  "authorization",
  "not_found",
  "conflict",
  "rate_limit",
  "internal"
);
var ApiErrorCodeSchema = Schema4.Literal(
  "invalid_request",
  "authentication_missing_token",
  "authentication_invalid_token",
  "authentication_expired_token",
  "authorization_insufficient_permission",
  "authorization_missing_role",
  "authorization_not_owner",
  "safety_input_blocked",
  "safety_input_quarantined",
  "user_suspended",
  "resource_not_found",
  "voice_training_consent_required",
  "quote_stale",
  "execution_conflict",
  "usage_restricted",
  "rate_limited",
  "service_unavailable",
  "internal_error"
);
var ApiErrorResponseSchema = Schema4.Struct({
  status: Schema4.Number,
  code: ApiErrorCodeSchema,
  category: ApiErrorCategorySchema,
  message: Schema4.String,
  retryable: Schema4.Boolean,
  details: Schema4.optional(Schema4.Record({ key: Schema4.String, value: Schema4.Unknown }))
});
var PendingVoiceProfileRebuildViewSchema = Schema4.Struct({
  status: Schema4.Literal("idle", "in_progress", "failed"),
  reasonCode: Schema4.optional(ReasonCodeSchema),
  nextActionCodes: Schema4.Array(NextActionCodeSchema)
});
var ExecutionVoiceMetadataViewSchema = Schema4.Struct({
  voiceProfileConfidence: VoiceProfileConfidenceSchema,
  voiceAdaptationMode: VoiceAdaptationModeSchema,
  voiceProfileVersionUsed: Schema4.Number,
  pendingVoiceProfileVersion: Schema4.optional(Schema4.Number),
  voiceProfileSnapshotId: Schema4.String,
  usedFallbackVoiceProfile: Schema4.Boolean,
  fallbackReasonCode: Schema4.optional(FallbackReasonCodeSchema),
  appliedSignals: VoiceSignalSummarySchema,
  pendingProfileRebuild: PendingVoiceProfileRebuildViewSchema
});
var JobStatusResponseSchema = Schema4.Struct({
  jobId: Schema4.String,
  status: JobStatusSchema,
  contentType: Schema4.String,
  progress: Schema4.NullOr(JobProgressSchema),
  result: Schema4.NullOr(JobResultSchema),
  error: Schema4.NullOr(JobErrorSchema),
  createdAt: Schema4.String,
  completedAt: Schema4.NullOr(Schema4.String),
  voice: Schema4.optional(ExecutionVoiceMetadataViewSchema),
  userId: Schema4.optional(Schema4.String)
});
var SSEEventSchema = Schema4.Struct({
  type: Schema4.Literal("progress", "done", "error"),
  jobId: Schema4.String,
  payload: Schema4.Union(JobProgressSchema, JobResultSchema, JobErrorSchema)
});
var ExecutionSseEventSchema = Schema4.Struct({
  type: Schema4.Literal("progress", "done", "error"),
  payload: Schema4.Union(JobProgressSchema, JobResultSchema, JobErrorSchema),
  occurredAt: Schema4.String
});
var SimplifiedPipelineRequestSchema = Schema4.Struct({
  userId: Schema4.String,
  pipelineType: PipelineTypeSchema,
  briefing: Schema4.Union(Schema4.String, Schema4.Record({ key: Schema4.String, value: Schema4.Unknown })),
  importedContext: Schema4.optional(Schema4.String),
  context: Schema4.optional(Schema4.Record({ key: Schema4.String, value: Schema4.Unknown })),
  language: Schema4.optional(Schema4.String),
  qualityMode: Schema4.optional(QualityModeSchema),
  contentType: Schema4.optional(Schema4.String),
  model: Schema4.optional(Schema4.String),
  adapter: Schema4.optional(Schema4.String),
  quoteId: Schema4.optional(Schema4.String),
  previewRecommendation: Schema4.optional(PreviewRecommendationSchema),
  includeTrace: Schema4.optional(Schema4.Boolean),
  idempotencyKey: Schema4.optional(Schema4.String)
});
var ExplicitPipelineRequestSchema = Schema4.Struct({
  pipeline: PipelineDefinitionSchema,
  importedContext: Schema4.optional(Schema4.String),
  context: Schema4.optional(Schema4.Record({ key: Schema4.String, value: Schema4.Unknown })),
  inputs: Schema4.optional(Schema4.Record({ key: Schema4.String, value: Schema4.Unknown })),
  language: Schema4.optional(Schema4.String),
  qualityMode: Schema4.optional(QualityModeSchema),
  model: Schema4.optional(Schema4.String),
  adapter: Schema4.optional(Schema4.String),
  previewRecommendation: Schema4.optional(PreviewRecommendationSchema),
  includeTrace: Schema4.optional(Schema4.Boolean),
  idempotencyKey: Schema4.optional(Schema4.String)
});
var PipelineRequestSchema = Schema4.Union(
  SimplifiedPipelineRequestSchema,
  ExplicitPipelineRequestSchema
);
var MeExecutionRequestSchema = Schema4.Struct({
  contentType: Schema4.String,
  briefing: Schema4.Union(Schema4.String, Schema4.Record({ key: Schema4.String, value: Schema4.Unknown })),
  importedContext: Schema4.optional(Schema4.String),
  context: Schema4.optional(Schema4.Record({ key: Schema4.String, value: Schema4.Unknown })),
  language: Schema4.optional(Schema4.String),
  qualityMode: Schema4.optional(QualityModeSchema),
  model: Schema4.optional(Schema4.String),
  quoteId: Schema4.optional(Schema4.String),
  previewRecommendation: Schema4.optional(PreviewRecommendationSchema),
  includeTrace: Schema4.optional(Schema4.Boolean),
  idempotencyKey: Schema4.optional(Schema4.String)
});
var SyncRunResponseSchema = Schema4.Struct({
  mode: ExecutionModeSchema,
  adapter: Schema4.String,
  model: Schema4.String,
  content: Schema4.String,
  contentType: Schema4.String,
  pipelineName: Schema4.String,
  qualityMode: QualityModeSchema,
  controls: Schema4.optional(ExecutionControlsSchema),
  telemetry: Schema4.optional(ExecutionTelemetrySchema),
  voice: Schema4.optional(ExecutionVoiceMetadataViewSchema),
  trace: Schema4.optional(Schema4.Unknown),
  idempotencyKey: Schema4.optional(Schema4.String)
});
var RunResponseSchema = Schema4.Union(SyncRunResponseSchema, AsyncRunResponseSchema);
var SyncExecutionViewSchema = Schema4.Struct({
  mode: Schema4.Literal("sync"),
  contentType: Schema4.String,
  pipelineName: Schema4.String,
  content: Schema4.String,
  adapter: Schema4.String,
  model: Schema4.String,
  qualityMode: QualityModeSchema,
  controls: Schema4.optional(ExecutionControlsSchema),
  telemetry: Schema4.optional(ExecutionTelemetrySchema),
  trace: Schema4.optional(Schema4.Unknown),
  voice: ExecutionVoiceMetadataViewSchema,
  idempotencyKey: Schema4.optional(Schema4.String)
});
var QueuedExecutionViewSchema = Schema4.Struct({
  jobId: Schema4.String,
  status: Schema4.Literal("queued"),
  contentType: Schema4.String,
  estimatedSteps: Schema4.Number,
  createdAt: Schema4.String,
  voice: ExecutionVoiceMetadataViewSchema
});
var ExecutionStatusViewSchema = Schema4.Struct({
  jobId: Schema4.String,
  status: JobStatusSchema,
  contentType: Schema4.String,
  progress: Schema4.NullOr(JobProgressSchema),
  result: Schema4.NullOr(JobResultSchema),
  error: Schema4.NullOr(JobErrorSchema),
  createdAt: Schema4.String,
  completedAt: Schema4.NullOr(Schema4.String),
  voice: Schema4.optional(ExecutionVoiceMetadataViewSchema)
});
var ExecutionsPageViewSchema = Schema4.Struct({
  items: Schema4.Array(ExecutionStatusViewSchema),
  total: Schema4.Number,
  limit: Schema4.Number,
  offset: Schema4.Number
});
var ExecutionTransitionStartedSchema = Schema4.Struct({
  type: Schema4.Literal("started"),
  executionId: Schema4.String,
  snapshot: Schema4.optional(ExecutionStatusViewSchema),
  progress: JobProgressSchema,
  occurredAt: Schema4.String
});
var ExecutionTransitionProgressedSchema = Schema4.Struct({
  type: Schema4.Literal("progressed"),
  executionId: Schema4.String,
  snapshot: Schema4.optional(ExecutionStatusViewSchema),
  progress: JobProgressSchema,
  occurredAt: Schema4.String
});
var ExecutionTransitionCompletedSchema = Schema4.Struct({
  type: Schema4.Literal("completed"),
  executionId: Schema4.String,
  snapshot: Schema4.optional(ExecutionStatusViewSchema),
  result: JobResultSchema,
  occurredAt: Schema4.String
});
var ExecutionTransitionFailedSchema = Schema4.Struct({
  type: Schema4.Literal("failed"),
  executionId: Schema4.String,
  snapshot: Schema4.optional(ExecutionStatusViewSchema),
  error: JobErrorSchema,
  occurredAt: Schema4.String
});
var ExecutionTransitionSchema = Schema4.Union(
  ExecutionTransitionStartedSchema,
  ExecutionTransitionProgressedSchema,
  ExecutionTransitionCompletedSchema,
  ExecutionTransitionFailedSchema
);
var ObservationFailureReasonSchema = Schema4.Literal(
  "reconnect_exhausted",
  "poll_fallback_exhausted",
  "timeout"
);
var ObservationFailureSchema = Schema4.Struct({
  reason: ObservationFailureReasonSchema,
  message: Schema4.String
});
var decodeJobCreatedResponse = createSchemaDecoder("JobCreatedResponse", JobCreatedResponseSchema);
var decodeRunResponse = createSchemaDecoder("RunResponse", RunResponseSchema);
var decodeHealthCheckResponse = createSchemaDecoder("HealthCheckResponse", HealthCheckResponseSchema);
var decodeReadinessResponse = createSchemaDecoder("ReadinessResponse", ReadinessResponseSchema);
var decodeApiErrorResponse = createSchemaDecoder("ApiErrorResponse", ApiErrorResponseSchema);
var decodeJobStatusResponse = createSchemaDecoder("JobStatusResponse", JobStatusResponseSchema);
var decodePipelineRequest = createSchemaDecoder("PipelineRequest", PipelineRequestSchema);
var decodeMeExecutionRequest = createSchemaDecoder("MeExecutionRequest", MeExecutionRequestSchema);
var decodeSyncExecutionView = createSchemaDecoder("SyncExecutionView", SyncExecutionViewSchema);
var decodeQueuedExecutionView = createSchemaDecoder("QueuedExecutionView", QueuedExecutionViewSchema);
var decodeExecutionStatusView = createSchemaDecoder("ExecutionStatusView", ExecutionStatusViewSchema);
var decodeExecutionsPageView = createSchemaDecoder("ExecutionsPageView", ExecutionsPageViewSchema);
var decodeExecutionSseEvent = createSchemaDecoder("ExecutionSseEvent", ExecutionSseEventSchema);
var decodeExecutionTransition = createSchemaDecoder("ExecutionTransition", ExecutionTransitionSchema);

// ../../packages/contracts/src/content-types.ts
var ContentTypeDefinitionSchema = Schema5.Struct({
  id: Schema5.String,
  label: Schema5.String,
  steps: Schema5.Array(Schema5.String),
  defaultLanguage: Schema5.String,
  inputSchema: Schema5.Record({ key: Schema5.String, value: Schema5.Unknown })
});
var LanguageProfileSummarySchema = Schema5.Struct({
  code: Schema5.String,
  name: Schema5.String,
  defaults: Schema5.NullOr(
    Schema5.Struct({
      tone: Schema5.optional(Schema5.String),
      constraints: Schema5.optional(Schema5.Array(Schema5.String))
    })
  )
});
var ContentTypeFieldTypeSchema = Schema5.Literal("string", "text", "number", "boolean", "enum", "object", "array");
var ContentTypeFieldViewSchema = Schema5.Struct({
  key: Schema5.String,
  label: Schema5.String,
  type: ContentTypeFieldTypeSchema,
  required: Schema5.Boolean,
  highImpact: Schema5.Boolean,
  helpText: Schema5.optional(Schema5.String),
  options: Schema5.optional(Schema5.Array(Schema5.String))
});
var BriefingGuidanceViewSchema = Schema5.Struct({
  objective: Schema5.String,
  tips: Schema5.Array(Schema5.String),
  exampleBriefing: Schema5.String,
  commonMistakes: Schema5.Array(Schema5.String)
});
var ContentTypeCatalogItemViewSchema = Schema5.Struct({
  id: Schema5.String,
  label: Schema5.String,
  available: Schema5.Boolean,
  reasonCode: Schema5.optional(ReasonCodeSchema),
  defaultLanguage: Schema5.String,
  supportedLanguages: Schema5.Array(Schema5.String),
  steps: Schema5.Array(Schema5.String),
  inputSchema: Schema5.Array(ContentTypeFieldViewSchema),
  briefingGuidance: BriefingGuidanceViewSchema,
  briefingGuidanceByLanguage: Schema5.optional(
    Schema5.Record({ key: Schema5.String, value: BriefingGuidanceViewSchema })
  )
});
var ContentTypeCatalogCommercialSchema = Schema5.Struct({
  planTier: Schema5.String,
  allowedQualityModes: Schema5.Array(QualityModeSchema)
});
var ContentTypeCatalogViewSchema = Schema5.Struct({
  items: Schema5.Array(ContentTypeCatalogItemViewSchema),
  commercial: Schema5.optional(ContentTypeCatalogCommercialSchema)
});
var decodeContentTypeCatalogView = createSchemaDecoder("ContentTypeCatalogView", ContentTypeCatalogViewSchema);

// ../../packages/contracts/src/generation-preview.ts
import { Schema as Schema6 } from "effect";
var PreviewBriefingSchema = Schema6.Union(
  Schema6.String,
  Schema6.Record({ key: Schema6.String, value: Schema6.Unknown })
);
var GenerationPreviewRequestSchema = Schema6.Struct({
  contentType: Schema6.optional(Schema6.String),
  briefing: Schema6.optional(PreviewBriefingSchema),
  importedContext: Schema6.optional(Schema6.String),
  language: Schema6.optional(Schema6.String),
  qualityMode: Schema6.optional(QualityModeSchema),
  includeRecommendation: Schema6.optional(Schema6.Boolean)
});
var GenerationPreviewContentTypeOptionSchema = Schema6.Struct({
  id: Schema6.String,
  label: Schema6.String,
  allowed: Schema6.Boolean,
  blockedReason: Schema6.optional(Schema6.String)
});
var GenerationPreviewQualityModeOptionSchema = Schema6.Struct({
  id: QualityModeSchema,
  allowed: Schema6.Boolean,
  blockedReason: Schema6.optional(Schema6.String),
  creditPrice: Schema6.Number,
  recommended: Schema6.optional(Schema6.Boolean),
  recommendation: Schema6.optional(
    Schema6.Struct({
      reasonCodes: Schema6.Array(Schema6.String),
      explanation: Schema6.String
    })
  )
});
var GenerationPreviewRecommendationSchema = Schema6.Struct({
  qualityMode: QualityModeSchema,
  reasonCodes: Schema6.Array(Schema6.String),
  explanation: Schema6.String
});
var GenerationPricingSnapshotSchema = Schema6.Struct({
  quoteId: Schema6.String,
  policyVersion: Schema6.String,
  contentType: Schema6.String,
  qualityMode: QualityModeSchema,
  creditPrice: Schema6.Number
});
var GenerationPreviewResponseSchema = Schema6.Struct({
  pricingSnapshot: GenerationPricingSnapshotSchema,
  currentBalance: Schema6.Number,
  projectedBalanceAfterGeneration: Schema6.Number,
  recommendation: Schema6.optional(GenerationPreviewRecommendationSchema),
  options: Schema6.Struct({
    contentTypes: Schema6.Array(GenerationPreviewContentTypeOptionSchema),
    qualityModes: Schema6.Array(GenerationPreviewQualityModeOptionSchema)
  })
});
var decodeGenerationPreviewRequest = createSchemaDecoder(
  "GenerationPreviewRequest",
  GenerationPreviewRequestSchema
);
var decodeGenerationPreviewResponse = createSchemaDecoder(
  "GenerationPreviewResponse",
  GenerationPreviewResponseSchema
);

// ../../packages/contracts/src/billing.ts
import { Schema as Schema7 } from "effect";
var BillingLedgerEntryTypeSchema = Schema7.Literal(
  "grant_cycle",
  "grant_rollover",
  "grant_topup",
  "reserve",
  "capture",
  "release",
  "refund",
  "expire"
);
var BillingReferenceTypeSchema = Schema7.Literal(
  "subscription_cycle",
  "generation_cycle",
  "topup",
  "manual_adjustment",
  "usage_record"
);
var BillingRoundingSchema = Schema7.Literal("ceil_1_decimal");
var BillingModeCreditPolicySchema = Schema7.Struct({
  fast: Schema7.Number,
  balanced: Schema7.Number,
  strict: Schema7.Number
});
var BillingCreditPolicySchema = Schema7.Struct({
  baseCredits: BillingModeCreditPolicySchema,
  retrySurcharge: BillingModeCreditPolicySchema,
  rounding: BillingRoundingSchema,
  rolloverPercent: Schema7.Number,
  rolloverCap: Schema7.Number
});
var BillingLedgerEntrySchema = Schema7.Struct({
  subscriptionId: Schema7.String,
  accountId: Schema7.String,
  entryType: BillingLedgerEntryTypeSchema,
  creditsDelta: Schema7.Number,
  balanceAfter: Schema7.Number,
  referenceType: BillingReferenceTypeSchema,
  referenceId: Schema7.String,
  idempotencyKey: Schema7.String,
  metadata: Schema7.Record({ key: Schema7.String, value: Schema7.Unknown }),
  createdAt: Schema7.String
});
var BillingGenerationReservationStatusSchema = Schema7.Literal("reserved", "captured", "released");
var BillingGenerationReservationSchema = Schema7.Struct({
  reservationId: Schema7.String,
  generationCycleId: Schema7.String,
  subscriptionId: Schema7.String,
  accountId: Schema7.String,
  qualityMode: QualityModeSchema,
  retryCount: Schema7.Number,
  reservedCredits: Schema7.Number,
  status: BillingGenerationReservationStatusSchema,
  idempotencyKey: Schema7.String,
  metadata: Schema7.Record({ key: Schema7.String, value: Schema7.Unknown }),
  createdAt: Schema7.String,
  updatedAt: Schema7.String
});
var BillingWalletSchema = Schema7.Struct({
  accountId: Schema7.String,
  subscriptionId: Schema7.String,
  activeCycleId: Schema7.NullOr(Schema7.String),
  availableCredits: Schema7.Number,
  reservedCredits: Schema7.Number,
  pendingCredits: Schema7.Number,
  lifetimeGrantedCredits: Schema7.Number,
  lifetimeDebitedCredits: Schema7.Number
});
var BillingTopUpPackageSchema = Schema7.Struct({
  id: Schema7.String,
  credits: Schema7.Number,
  priceCents: Schema7.Number,
  currency: Schema7.String,
  description: Schema7.optional(Schema7.String)
});
var BillingCycleStateSchema = Schema7.Struct({
  cycleId: Schema7.String,
  subscriptionId: Schema7.String,
  accountId: Schema7.String,
  openedAt: Schema7.String,
  closedAt: Schema7.NullOr(Schema7.String),
  rolloverCredits: Schema7.Number,
  grantedCredits: Schema7.Number,
  expiredCredits: Schema7.Number
});
var decodeBillingLedgerEntry = createSchemaDecoder("BillingLedgerEntry", BillingLedgerEntrySchema);
var decodeBillingWallet = createSchemaDecoder("BillingWallet", BillingWalletSchema);
var decodeBillingGenerationReservation = createSchemaDecoder(
  "BillingGenerationReservation",
  BillingGenerationReservationSchema
);

// src/product/ai-policy/ai-policy-schema.ts
var StepExecutionTypeSchema = Schema8.Literal("local", "llm");
var AIPolicyLifecycleSchema = Schema8.Literal("active", "legacy-supported");
var BillingPlanTierSchema = Schema8.Literal("free", "starter", "pro", "enterprise");
var RoutingFallbackConditionSchema = Schema8.Literal(
  "transport_error",
  "timeout",
  "invalid_request",
  "invalid_response",
  "provider_unavailable"
);
var AIPolicyStepDocumentSchema = Schema8.Struct({
  name: Schema8.String,
  skill: Schema8.String,
  execution: StepExecutionTypeSchema,
  routingProfile: Schema8.optional(Schema8.String),
  override: Schema8.optional(
    Schema8.Struct({
      from: Schema8.Literal("local"),
      to: Schema8.Literal("llm"),
      reason: Schema8.String
    })
  )
});
var AIPolicyCatalogDocumentSchema = Schema8.Struct({
  policyVersion: Schema8.String,
  routingProfiles: Schema8.Array(
    Schema8.Struct({
      id: Schema8.String,
      preferredAttempts: Schema8.NonEmptyArray(
        Schema8.Struct({
          provider: Schema8.String,
          model: Schema8.String,
          timeoutMs: Schema8.optional(Schema8.Number)
        })
      ),
      fallbackAttempts: Schema8.Array(
        Schema8.Struct({
          provider: Schema8.String,
          model: Schema8.String,
          timeoutMs: Schema8.optional(Schema8.Number)
        })
      ),
      operationalConstraints: Schema8.Struct({
        fallbackOn: Schema8.NonEmptyArray(RoutingFallbackConditionSchema)
      })
    })
  ),
  contentTypes: Schema8.Array(
    Schema8.Struct({
      id: Schema8.String,
      label: Schema8.String,
      defaultLanguage: Schema8.String,
      pipelineType: PipelineTypeSchema
    })
  ),
  pipelines: Schema8.Array(
    Schema8.Struct({
      pipelineType: PipelineTypeSchema,
      contentType: Schema8.String,
      defaultLanguage: Schema8.String,
      defaultQualityMode: QualityModeSchema,
      steps: Schema8.Array(AIPolicyStepDocumentSchema)
    })
  )
});
var AIPolicyPricingDocumentSchema = Schema8.Struct({
  policyVersion: Schema8.String,
  lifecycle: AIPolicyLifecycleSchema,
  pricing: Schema8.Array(
    Schema8.Struct({
      planTier: BillingPlanTierSchema,
      contentType: Schema8.String,
      qualityMode: QualityModeSchema,
      creditPrice: Schema8.Number
    })
  )
});
var AIPolicyManifestSchema = Schema8.Struct({
  activeVersion: Schema8.String,
  versions: Schema8.Array(
    Schema8.Struct({
      version: Schema8.String,
      lifecycle: AIPolicyLifecycleSchema,
      catalogPath: Schema8.String,
      pricingPath: Schema8.String
    })
  )
});

// src/product/ai-policy/ai-policy-loader.ts
var DEFAULT_POLICY_MANIFEST_PATH = join(backendPackageRoot2, "policies/official/manifest.json");
var DEFAULT_EXPERIMENTAL_POLICY_MANIFEST_PATH = join(
  backendPackageRoot2,
  "policies/experimental/manifest.json"
);
function loadResolvedPolicyDocuments(manifestPath) {
  return Effect93.gen(function* () {
    const manifest = yield* loadJsonFile(manifestPath, AIPolicyManifestSchema);
    const manifestDirectory = dirname3(manifestPath);
    const versions = yield* Effect93.all(
      manifest.versions.map((version) => loadResolvedVersion(manifestDirectory, version))
    );
    return {
      manifest,
      versionIndex: new Map(versions.map((version) => [version.version, version]))
    };
  });
}
function loadResolvedVersion(manifestDirectory, version) {
  return Effect93.gen(function* () {
    const catalogPath = resolve4(manifestDirectory, version.catalogPath);
    const pricingPath = resolve4(manifestDirectory, version.pricingPath);
    const catalog = yield* loadJsonFile(catalogPath, AIPolicyCatalogDocumentSchema);
    const pricing = yield* loadJsonFile(pricingPath, AIPolicyPricingDocumentSchema);
    if (catalog.policyVersion !== version.version || pricing.policyVersion !== version.version) {
      return yield* Effect93.fail(
        new BackendAIPolicyValidationError({
          path: catalogPath,
          message: `Referenced policy documents must match manifest version "${version.version}"`,
          details: {
            catalogPolicyVersion: catalog.policyVersion,
            pricingPolicyVersion: pricing.policyVersion
          }
        })
      );
    }
    if (pricing.lifecycle !== version.lifecycle) {
      return yield* Effect93.fail(
        new BackendAIPolicyValidationError({
          path: pricingPath,
          message: `Pricing lifecycle "${pricing.lifecycle}" does not match manifest lifecycle "${version.lifecycle}"`,
          details: { version: version.version }
        })
      );
    }
    yield* validateCatalogDocument(version.version, catalog);
    return {
      version: version.version,
      lifecycle: version.lifecycle,
      catalog,
      pricing
    };
  });
}
function validateCatalogDocument(policyVersion, catalog) {
  return Effect93.gen(function* () {
    const contentTypeIds = new Set(catalog.contentTypes.map((contentType) => contentType.id));
    for (const pipeline of catalog.pipelines) {
      if (!contentTypeIds.has(pipeline.contentType)) {
        return yield* Effect93.fail(
          new BackendAIPolicyCatalogError({
            policyVersion,
            pipelineName: pipeline.pipelineType,
            message: `Pipeline "${pipeline.pipelineType}" references unknown content type "${pipeline.contentType}"`
          })
        );
      }
      for (const step of pipeline.steps) {
        if (step.execution === "local" && step.routingProfile) {
          return yield* Effect93.fail(
            new BackendAIPolicyCatalogError({
              policyVersion,
              pipelineName: pipeline.pipelineType,
              stepName: step.name,
              message: `Step "${step.name}" is local and must not declare a routing profile`
            })
          );
        }
        if (step.override && step.execution !== "llm") {
          return yield* Effect93.fail(
            new BackendAIPolicyCatalogError({
              policyVersion,
              pipelineName: pipeline.pipelineType,
              stepName: step.name,
              message: `Step "${step.name}" declares override metadata but is not resolved as llm`
            })
          );
        }
        if (step.execution === "llm") {
          if (!step.routingProfile) {
            return yield* Effect93.fail(
              new BackendAIPolicyCatalogError({
                policyVersion,
                pipelineName: pipeline.pipelineType,
                stepName: step.name,
                message: `Step "${step.name}" is llm and must declare a routing profile`
              })
            );
          }
          const routingProfile = catalog.routingProfiles.find((profile) => profile.id === step.routingProfile);
          if (!routingProfile) {
            return yield* Effect93.fail(
              new BackendAIPolicyCatalogError({
                policyVersion,
                pipelineName: pipeline.pipelineType,
                stepName: step.name,
                message: `Step "${step.name}" references unknown routing profile "${step.routingProfile}"`
              })
            );
          }
          if (routingProfile.preferredAttempts.length === 0) {
            return yield* Effect93.fail(
              new BackendAIPolicyCatalogError({
                policyVersion,
                pipelineName: pipeline.pipelineType,
                stepName: step.name,
                message: `Routing profile "${routingProfile.id}" must declare at least one preferred attempt`
              })
            );
          }
        }
      }
    }
  });
}
function loadJsonFile(path, schema) {
  return Effect93.gen(function* () {
    const raw = yield* Effect93.try({
      try: () => readFileSync(path, "utf8"),
      catch: (cause) => new BackendAIPolicyLoadError({
        path,
        message: cause instanceof Error ? cause.message : `Failed to read ${path}`
      })
    });
    const decodedJson = yield* Effect93.try({
      try: () => JSON.parse(raw),
      catch: (cause) => new BackendAIPolicyValidationError({
        path,
        message: cause instanceof Error ? cause.message : `Failed to parse JSON from ${path}`
      })
    });
    return yield* Schema9.decodeUnknown(schema)(decodedJson).pipe(
      Effect93.mapError(
        (cause) => new BackendAIPolicyValidationError({
          path,
          message: `Policy document at "${path}" failed schema validation`,
          details: { cause: String(cause) }
        })
      )
    );
  });
}

// src/product/ai-policy/ai-policy-runtime.ts
import { Effect as Effect100 } from "effect";

// src/product/ai-policy/ai-policy-active-pointer.ts
import { Effect as Effect95 } from "effect";

// src/product/ai-policy/ai-policy-pointer-store.ts
import { Effect as Effect94 } from "effect";
var POLICY_POINTER_USER_ID = "backend";
function loadActivePolicyPointer(args) {
  return Effect94.gen(function* () {
    const existing = yield* args.database.memories.get(POLICY_POINTER_USER_ID, pointerKey(args.namespace));
    const parsed = toActivePolicyPointerRecord(existing?.value);
    if (parsed) {
      return parsed;
    }
    const created = createInitialPolicyPointer(args.defaultPolicyVersion, args.now().toISOString());
    yield* persistMemoryValue(args.database, pointerKey(args.namespace), created, created.updatedAt);
    return created;
  });
}
function saveActivePolicyPointer(args) {
  return persistMemoryValue(
    args.database,
    pointerKey(args.namespace),
    args.pointer,
    args.pointer.updatedAt
  ).pipe(Effect94.as(args.pointer));
}
function recordPolicyDegradationSignal(args) {
  return Effect94.gen(function* () {
    const existing = yield* args.database.memories.get(POLICY_POINTER_USER_ID, degradationKey(args.namespace));
    const current = toDegradationSignals(existing?.value);
    const nextSignals = [
      ...current.filter((signal) => signal.provider !== args.signal.provider),
      args.signal
    ];
    yield* persistMemoryValue(args.database, degradationKey(args.namespace), nextSignals, args.signal.occurredAt);
  });
}
function loadPolicyDegradationRecommendation(args) {
  return Effect94.gen(function* () {
    const existing = yield* args.database.memories.get(POLICY_POINTER_USER_ID, degradationKey(args.namespace));
    const signals = toDegradationSignals(existing?.value);
    const latestSignal = [...signals].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0];
    if (!latestSignal || latestSignal.failureCount <= 0) {
      return void 0;
    }
    const activePolicy = args.policyVersions.find((version) => version.version === args.activePolicyVersion);
    const alternative = args.policyVersions.find((version) => {
      if (version.version === args.activePolicyVersion) {
        return false;
      }
      return Object.values(version.routingProfiles).some(
        (profile) => profile.preferredAttempts[0]?.provider !== latestSignal.provider
      );
    });
    if (!activePolicy || !alternative) {
      return void 0;
    }
    return {
      recommendedPolicyVersion: alternative.version,
      reason: `Observed degradation on provider "${latestSignal.provider}" under active policy "${activePolicy.version}"`,
      evidence: {
        degradedProvider: latestSignal.provider,
        failureCount: latestSignal.failureCount,
        observedAt: latestSignal.occurredAt
      }
    };
  });
}
function buildActivatedPolicyPointer(args) {
  const historyEntry = {
    policyVersion: args.policyVersion,
    updatedAt: args.updatedAt,
    updatedBy: args.updatedBy
  };
  return {
    activePolicyVersion: args.policyVersion,
    updatedAt: args.updatedAt,
    updatedBy: args.updatedBy,
    history: [...args.current.history, historyEntry]
  };
}
function createInitialPolicyPointer(policyVersion, updatedAt) {
  return {
    activePolicyVersion: policyVersion,
    updatedAt,
    updatedBy: "system-bootstrap",
    history: [
      {
        policyVersion,
        updatedAt,
        updatedBy: "system-bootstrap"
      }
    ]
  };
}
function persistMemoryValue(database, key, value, at) {
  return database.memories.put(
    {
      id: `${POLICY_POINTER_USER_ID}:${key}`,
      userId: POLICY_POINTER_USER_ID,
      key,
      value,
      createdAt: at,
      updatedAt: at
    },
    1
  ).pipe(
    Effect94.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist AI policy pointer memory value",
      context: { key }
    })),
    Effect94.asVoid
  );
}
function pointerKey(namespace) {
  return `ai-policy-pointer:${namespace}`;
}
function degradationKey(namespace) {
  return `ai-policy-degradation:${namespace}`;
}
function toActivePolicyPointerRecord(value) {
  if (!value || typeof value !== "object") {
    return void 0;
  }
  const record = value;
  const activePolicyVersion = typeof record.activePolicyVersion === "string" ? record.activePolicyVersion : void 0;
  const updatedAt = typeof record.updatedAt === "string" ? record.updatedAt : void 0;
  const updatedBy = typeof record.updatedBy === "string" ? record.updatedBy : void 0;
  const history = Array.isArray(record.history) ? record.history.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }
    const typedEntry = entry;
    return typeof typedEntry.policyVersion === "string" && typeof typedEntry.updatedAt === "string" && typeof typedEntry.updatedBy === "string" ? [
      {
        policyVersion: typedEntry.policyVersion,
        updatedAt: typedEntry.updatedAt,
        updatedBy: typedEntry.updatedBy
      }
    ] : [];
  }) : [];
  if (!activePolicyVersion || !updatedAt || !updatedBy) {
    return void 0;
  }
  return {
    activePolicyVersion,
    updatedAt,
    updatedBy,
    history
  };
}
function toDegradationSignals(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }
    const typedEntry = entry;
    return typeof typedEntry.provider === "string" && typeof typedEntry.policyVersion === "string" && typeof typedEntry.failureCount === "number" && typeof typedEntry.occurredAt === "string" ? [
      {
        provider: typedEntry.provider,
        policyVersion: typedEntry.policyVersion,
        failureCount: typedEntry.failureCount,
        occurredAt: typedEntry.occurredAt
      }
    ] : [];
  });
}

// src/product/ai-policy/ai-policy-active-pointer.ts
function createActivePolicyPointerController(args) {
  return Effect95.gen(function* () {
    let pointer = yield* loadActivePolicyPointer({
      database: args.database,
      namespace: args.namespace,
      defaultPolicyVersion: args.defaultPolicyVersion,
      now: args.now
    });
    let lastReloadAtMs = args.now().getTime();
    const reloadPointer = () => Effect95.gen(function* () {
      pointer = yield* loadActivePolicyPointer({
        database: args.database,
        namespace: args.namespace,
        defaultPolicyVersion: args.defaultPolicyVersion,
        now: args.now
      });
      lastReloadAtMs = args.now().getTime();
      return pointer;
    });
    const ensureFreshPointer = () => Effect95.gen(function* () {
      const nowMs = args.now().getTime();
      if (nowMs - lastReloadAtMs < args.reloadIntervalMs) {
        return pointer;
      }
      return yield* reloadPointer();
    });
    return {
      getCurrentPointer: () => pointer,
      ensureFreshPointer,
      reloadPointer,
      activatePolicyVersion: (activation) => args.database.transaction(
        (trxDatabase) => Effect95.gen(function* () {
          const currentPointer = yield* ensureFreshPointer();
          const updatedAt = activation.approvedAt ?? args.now().toISOString();
          const nextPointer = buildActivatedPolicyPointer({
            current: currentPointer,
            policyVersion: activation.policyVersion,
            updatedAt,
            updatedBy: activation.actor
          });
          yield* saveActivePolicyPointer({
            database: trxDatabase,
            namespace: args.namespace,
            pointer: nextPointer
          });
          yield* persistBackendAuditEvent(trxDatabase, {
            logicalKey: `ai-policy:${args.namespace}:activate:${activation.policyVersion}:${updatedAt}`,
            actorId: activation.actor,
            actorType: "operator",
            resourceType: "ai_policy_pointer",
            resourceId: args.namespace,
            mutationType: "ai_policy.activated",
            occurredAt: updatedAt,
            metadata: {
              namespace: args.namespace,
              previousPolicyVersion: currentPointer.activePolicyVersion,
              activePolicyVersion: nextPointer.activePolicyVersion
            }
          });
          pointer = nextPointer;
          lastReloadAtMs = args.now().getTime();
          return nextPointer;
        })
      ).pipe(Effect95.orDie),
      recordDegradationSignal: (signal) => recordPolicyDegradationSignal({
        database: args.database,
        namespace: args.namespace,
        signal: {
          provider: signal.provider,
          policyVersion: signal.policyVersion,
          occurredAt: signal.occurredAt,
          failureCount: signal.failureCount
        }
      }),
      recommendFuturePolicyVersion: (policyVersions, activePolicyVersion) => loadPolicyDegradationRecommendation({
        database: args.database,
        namespace: args.namespace,
        activePolicyVersion,
        policyVersions
      })
    };
  });
}

// src/product/ai-policy/ai-policy-pipeline-validation.ts
import { Effect as Effect97 } from "effect";

// src/product/ai-policy/ai-policy-version-index.ts
import { Effect as Effect96 } from "effect";

// src/product/ai-policy/ai-policy-mappers.ts
function toResolvedAIPolicyVersion(document) {
  const contentTypes = Object.fromEntries(
    document.catalog.contentTypes.map((contentType) => [contentType.id, contentType])
  );
  const pipelines = Object.fromEntries(
    document.catalog.pipelines.map((pipeline) => [pipeline.pipelineType, pipeline])
  );
  const routingProfiles = Object.fromEntries(
    document.catalog.routingProfiles.map((profile) => [profile.id, profile])
  );
  return {
    version: document.version,
    lifecycle: document.lifecycle,
    contentTypes,
    catalog: pipelines,
    routingProfiles,
    orchestrationCatalog: {
      pipelines: Object.fromEntries(
        document.catalog.pipelines.map((pipeline) => [
          pipeline.pipelineType,
          {
            name: pipeline.pipelineType,
            steps: pipeline.steps.map((step) => toPipelineStepDefinition(step, routingProfiles))
          }
        ])
      ),
      contentTypes: Object.fromEntries(
        document.catalog.contentTypes.map((contentType) => [
          contentType.id,
          {
            id: contentType.id,
            label: contentType.label,
            steps: pipelines[contentType.pipelineType].steps.map((step) => step.name),
            defaultLanguage: contentType.defaultLanguage,
            inputSchema: {}
          }
        ])
      ),
      defaultLanguageByPipeline: Object.fromEntries(
        document.catalog.pipelines.map((pipeline) => [pipeline.pipelineType, pipeline.defaultLanguage])
      ),
      defaultQualityModeByPipeline: Object.fromEntries(
        document.catalog.pipelines.map((pipeline) => [pipeline.pipelineType, pipeline.defaultQualityMode])
      )
    }
  };
}
function toPipelineStepDefinition(step, routingProfiles) {
  const routingProfile = step.routingProfile ? routingProfiles[step.routingProfile] : void 0;
  const attempts = routingProfile ? [...routingProfile.preferredAttempts, ...routingProfile.fallbackAttempts] : [];
  const config = {
    executionType: step.execution,
    ...step.routingProfile ? { routingProfile: step.routingProfile } : {},
    ...step.routingProfile ? {
      resolvedProviderModelPlan: attempts.map((attempt) => ({
        provider: attempt.provider,
        model: attempt.model,
        ...typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {}
      })),
      routingConstraints: {
        fallbackOn: routingProfile?.operationalConstraints.fallbackOn ?? []
      }
    } : {},
    ...step.override ? { executionOverride: step.override } : {}
  };
  return {
    name: step.name,
    skill: step.skill,
    config
  };
}

// src/product/ai-policy/ai-policy-version-index.ts
function createResolvedPolicyVersionIndex(args) {
  const versions = new Map(
    Array.from(args.versionIndex.entries()).map(([version, document]) => [version, toResolvedAIPolicyVersion(document)])
  );
  const fallbackPolicy = versions.get(args.activePolicy.version) ?? toResolvedAIPolicyVersion(args.activePolicy);
  const policyVersions = Array.from(versions.values());
  const versionSummaries = policyVersions.map((policyVersion) => ({
    version: policyVersion.version,
    lifecycle: policyVersion.lifecycle
  }));
  return {
    versions,
    pricingDocuments: args.versionIndex,
    versionSummaries,
    policyVersions,
    fallbackPolicy
  };
}
function resolvePolicyVersion(index, policyVersion, context) {
  const policy = index.versions.get(policyVersion);
  if (policy) {
    return Effect96.succeed(policy);
  }
  return Effect96.fail(
    new BackendAIPolicyPricingError({
      policyVersion,
      planTier: context.planTier,
      contentType: context.contentType,
      qualityMode: context.qualityMode,
      message: `Policy version "${policyVersion}" is not available for pricing resolution`
    })
  );
}
function resolvePolicyPipeline(policy, contentType) {
  const contentTypeDefinition = policy.contentTypes[contentType];
  if (!contentTypeDefinition) {
    return Effect96.fail(
      new BackendAIPolicyCatalogError({
        policyVersion: policy.version,
        pipelineName: contentType,
        message: `Content type "${contentType}" is not present in active AI policy`
      })
    );
  }
  return Effect96.succeed(policy.catalog[contentTypeDefinition.pipelineType]);
}
function resolvePolicyPricingEnvelope(index, policy, args) {
  const matchingPrice = index.pricingDocuments.get(policy.version)?.pricing.pricing.find(
    (price) => price.planTier === args.planTier && price.contentType === args.contentType && price.qualityMode === args.qualityMode
  );
  if (!matchingPrice) {
    return Effect96.fail(
      new BackendAIPolicyPricingError({
        policyVersion: policy.version,
        planTier: args.planTier,
        contentType: args.contentType,
        qualityMode: args.qualityMode,
        message: `No pricing envelope found for ${args.planTier}/${args.contentType}/${args.qualityMode}`
      })
    );
  }
  return Effect96.succeed({
    policyVersion: policy.version,
    lifecycle: policy.lifecycle,
    planTier: args.planTier,
    contentType: args.contentType,
    qualityMode: args.qualityMode,
    creditPrice: matchingPrice.creditPrice
  });
}

// src/product/ai-policy/ai-policy-pipeline-validation.ts
function validateExplicitPipelineDefinition(policyPipeline, pipeline, policyVersion) {
  return Effect97.gen(function* () {
    if (pipeline.steps.length !== policyPipeline.steps.length) {
      return yield* Effect97.fail(
        new BackendAIPolicyCatalogError({
          policyVersion,
          pipelineName: pipeline.name,
          message: `Pipeline "${pipeline.name}" does not match the policy step count`
        })
      );
    }
    for (const [index, step] of pipeline.steps.entries()) {
      const expected = policyPipeline.steps[index];
      if (!expected || step.name !== expected.name || step.skill !== expected.skill) {
        return yield* Effect97.fail(
          new BackendAIPolicyCatalogError({
            policyVersion,
            pipelineName: pipeline.name,
            stepName: step.name,
            message: `Step "${step.name}" is not compatible with the active AI policy`
          })
        );
      }
    }
  });
}
function validatePipelineRequestAgainstPolicy(args) {
  const explicitRequest = "pipeline" in args.request ? args.request : void 0;
  if (!explicitRequest) {
    return Effect97.void;
  }
  const requestContentType = "contentType" in explicitRequest && typeof explicitRequest.contentType === "string" ? explicitRequest.contentType : void 0;
  const contentType = requestContentType && requestContentType.length > 0 ? requestContentType : explicitRequest.pipeline.name;
  return Effect97.gen(function* () {
    const pipeline = yield* resolvePolicyPipeline(args.policy, contentType);
    yield* validateExplicitPipelineDefinition(pipeline, explicitRequest.pipeline, args.policy.version);
  });
}

// src/product/ai-policy/ai-policy-resolution.ts
import { Effect as Effect99 } from "effect";

// src/product/ai-policy/ai-policy-snapshot.ts
import { Effect as Effect98 } from "effect";
function resolveExecutionSnapshot(args) {
  return Effect98.gen(function* () {
    const plan = buildOrchestrationPlan(args.request, {
      catalog: args.policy.orchestrationCatalog,
      executionMode: args.executionMode,
      qualityMode: args.qualityMode,
      defaultLanguage: args.defaultLanguage
    });
    const pipelinePolicy = args.policy.catalog[plan.pipelineType ?? inferPipelineType(plan.pipeline.name)];
    if (!pipelinePolicy) {
      return yield* Effect98.fail(
        new BackendAIPolicyCatalogError({
          policyVersion: args.policy.version,
          pipelineName: plan.pipeline.name,
          message: `Pipeline "${plan.pipeline.name}" is not available in policy version "${args.policy.version}"`
        })
      );
    }
    const steps = pipelinePolicy.steps.map((step) => ({
      name: step.name,
      skill: step.skill,
      execution: step.execution,
      routingProfile: step.routingProfile,
      attempts: resolveStepAttempts(args.policy, step.routingProfile),
      fallbackOn: resolveStepFallbackConditions(args.policy, step.routingProfile)
    }));
    const resolvedPlan = {
      ...plan,
      pipeline: {
        ...plan.pipeline,
        steps: plan.pipeline.steps.map((step, index) => {
          const resolvedStep = steps[index];
          return {
            ...step,
            config: {
              ...step.config ?? {},
              executionType: resolvedStep?.execution,
              ...resolvedStep?.routingProfile ? { routingProfile: resolvedStep.routingProfile } : {},
              ...resolvedStep && resolvedStep.execution === "llm" ? {
                resolvedProviderModelPlan: resolvedStep.attempts.map(cloneAttempt),
                routingConstraints: {
                  fallbackOn: [...resolvedStep.fallbackOn]
                }
              } : {}
            }
          };
        })
      }
    };
    return freezeResolvedExecutionSnapshot({
      policyVersion: args.policy.version,
      lifecycle: args.policy.lifecycle,
      planTier: args.planTier,
      request: args.request,
      plan: resolvedPlan,
      pricingEnvelope: args.pricingEnvelope,
      steps
    });
  });
}
function resolveStepAttempts(policy, routingProfile) {
  if (!routingProfile) {
    return [];
  }
  const profile = policy.routingProfiles[routingProfile];
  return profile ? [...profile.preferredAttempts, ...profile.fallbackAttempts].map(cloneAttempt) : [];
}
function resolveStepFallbackConditions(policy, routingProfile) {
  if (!routingProfile) {
    return [];
  }
  return [...policy.routingProfiles[routingProfile]?.operationalConstraints.fallbackOn ?? []];
}
function cloneAttempt(attempt) {
  return {
    provider: attempt.provider,
    model: attempt.model,
    ...typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {}
  };
}
function inferPipelineType(pipelineName) {
  return pipelineName;
}
function freezeResolvedExecutionSnapshot(snapshot) {
  deepFreeze(snapshot);
  return snapshot;
}
function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return;
  }
  Object.freeze(value);
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
}

// src/product/ai-policy/ai-policy-resolution.ts
function resolvePolicyPricing(args) {
  return Effect99.gen(function* () {
    const policy = yield* resolvePolicyVersion(args.index, args.policyVersion, {
      planTier: args.planTier,
      contentType: args.contentType,
      qualityMode: args.qualityMode
    });
    return yield* resolvePolicyPricingEnvelope(args.index, policy, {
      planTier: args.planTier,
      contentType: args.contentType,
      qualityMode: args.qualityMode
    });
  });
}
function resolvePolicyExecutionSnapshot(args) {
  return Effect99.gen(function* () {
    const contentType = resolveRequestContentType(args.request);
    const resolvedQualityMode = args.request.qualityMode ?? args.qualityMode;
    const policy = yield* resolvePolicyVersion(args.index, args.policyVersion, {
      planTier: args.planTier,
      contentType,
      qualityMode: resolvedQualityMode
    });
    const pricingEnvelope = yield* resolvePolicyPricingEnvelope(args.index, policy, {
      planTier: args.planTier,
      contentType,
      qualityMode: resolvedQualityMode
    });
    return yield* resolveExecutionSnapshot({
      policy,
      pricingEnvelope,
      request: args.request,
      planTier: args.planTier,
      executionMode: args.executionMode,
      qualityMode: args.qualityMode,
      defaultLanguage: args.defaultLanguage
    });
  });
}
function resolveRequestContentType(request) {
  if ("contentType" in request && request.contentType) {
    return request.contentType;
  }
  if ("pipeline" in request) {
    return request.pipeline.name;
  }
  return request.pipelineType;
}

// src/product/ai-policy/ai-policy-runtime.ts
function createBackendAIPolicyService(options) {
  const index = createResolvedPolicyVersionIndex({
    activePolicy: options.activePolicy,
    versionIndex: options.versionIndex
  });
  return Effect100.gen(function* () {
    const pointer = yield* createActivePolicyPointerController({
      database: options.database,
      namespace: options.namespace,
      defaultPolicyVersion: options.activePolicy.version,
      now: options.now,
      reloadIntervalMs: Math.max(0, options.reloadIntervalMs ?? 1e3)
    });
    const resolveSelectedPolicyVersion = () => Effect100.gen(function* () {
      const currentPointer = yield* pointer.ensureFreshPointer();
      return options.attachedPolicyVersion ?? currentPointer.activePolicyVersion;
    });
    const resolveActivePolicy = () => Effect100.gen(function* () {
      const selectedPolicyVersion = yield* resolveSelectedPolicyVersion();
      return yield* resolvePolicyVersion(index, selectedPolicyVersion, {
        planTier: "system",
        contentType: "system",
        qualityMode: "system"
      });
    }).pipe(Effect100.orDie);
    return {
      getActivePolicy: () => resolveActivePolicy(),
      getActivePolicyPointer: () => pointer.ensureFreshPointer(),
      getActiveOrchestrationCatalog: () => {
        const selectedPolicyVersion = options.attachedPolicyVersion ?? pointer.getCurrentPointer().activePolicyVersion;
        return (index.versions.get(selectedPolicyVersion) ?? index.fallbackPolicy).orchestrationCatalog;
      },
      listPolicyVersions: () => [...index.versionSummaries],
      activatePolicyVersion: (args) => Effect100.gen(function* () {
        yield* resolvePolicyVersion(index, args.policyVersion, {
          planTier: "system",
          contentType: "system",
          qualityMode: "system"
        }).pipe(
          Effect100.mapError(
            (error) => new BackendAIPolicyPricingError({
              ...error,
              message: `Cannot activate unknown policy version "${args.policyVersion}"`
            })
          )
        );
        return yield* pointer.activatePolicyVersion(args);
      }),
      reloadActivePolicyPointer: () => pointer.reloadPointer(),
      recordDegradationSignal: (args) => pointer.recordDegradationSignal(args),
      recommendFuturePolicyVersion: () => Effect100.gen(function* () {
        const selectedPolicyVersion = yield* resolveSelectedPolicyVersion();
        return yield* pointer.recommendFuturePolicyVersion(index.policyVersions, selectedPolicyVersion);
      }),
      listContentTypes: () => {
        const selectedPolicyVersion = options.attachedPolicyVersion ?? pointer.getCurrentPointer().activePolicyVersion;
        return Object.values((index.versions.get(selectedPolicyVersion) ?? index.fallbackPolicy).contentTypes);
      },
      validatePipelineRequest: (request) => Effect100.gen(function* () {
        const activePolicy = yield* resolveActivePolicy();
        yield* validatePipelineRequestAgainstPolicy({
          request,
          policy: activePolicy
        });
      }),
      resolvePricingEnvelope: (args) => Effect100.gen(function* () {
        const selectedPolicyVersion = args.attachedPolicyVersion ?? options.attachedPolicyVersion ?? (yield* resolveSelectedPolicyVersion());
        return yield* resolvePolicyPricing({
          index,
          policyVersion: selectedPolicyVersion,
          planTier: args.planTier,
          contentType: args.contentType,
          qualityMode: args.qualityMode
        });
      }),
      resolveExecutionSnapshot: (args) => Effect100.gen(function* () {
        const selectedPolicyVersion = args.attachedPolicyVersion ?? options.attachedPolicyVersion ?? (yield* resolveSelectedPolicyVersion());
        return yield* resolvePolicyExecutionSnapshot({
          index,
          policyVersion: selectedPolicyVersion,
          request: args.request,
          planTier: args.planTier,
          executionMode: args.executionMode,
          qualityMode: args.qualityMode,
          defaultLanguage: args.defaultLanguage
        });
      })
    };
  });
}

// src/product/ai-policy/ai-policy.ts
function loadBackendAIPolicyService(config, options = {}, dependencies = {}) {
  return Effect101.gen(function* () {
    const manifestPath = options.manifestPath ?? resolveManifestPath(config, options.optional === true);
    if (options.optional && !manifestPath) {
      return void 0;
    }
    if (!manifestPath) {
      return void 0;
    }
    const { manifest, versionIndex } = yield* loadResolvedPolicyDocuments(manifestPath);
    const activePolicy = versionIndex.get(manifest.activeVersion);
    if (!activePolicy) {
      return yield* Effect101.fail(
        new BackendAIPolicyValidationError({
          path: manifestPath,
          message: `Active policy version "${manifest.activeVersion}" is missing from manifest versions`,
          details: { activeVersion: manifest.activeVersion }
        })
      );
    }
    if (!dependencies.database) {
      return yield* Effect101.die("Backend AI policy service requires a database client");
    }
    return yield* createBackendAIPolicyService({
      activePolicy,
      versionIndex,
      attachedPolicyVersion: config.aiPolicyAttachedVersion,
      database: dependencies.database,
      namespace: options.optional ? "experimental" : "official",
      now: dependencies.now ?? (() => /* @__PURE__ */ new Date()),
      reloadIntervalMs: config.aiPolicyReloadIntervalMs
    });
  });
}
function resolveManifestPath(config, optional) {
  const configuredPath = optional ? config.experimentalAIPolicyManifestPath : config.aiPolicyManifestPath;
  const fallbackPath = optional ? DEFAULT_EXPERIMENTAL_POLICY_MANIFEST_PATH : DEFAULT_POLICY_MANIFEST_PATH;
  const manifestPath = configuredPath ?? fallbackPath;
  if (optional && !existsSync4(manifestPath)) {
    return void 0;
  }
  return manifestPath;
}

// src/product/safety-policy/safety-policy.ts
import { Effect as Effect104 } from "effect";

// src/product/safety-policy/safety-policy-loader.ts
import { readFileSync as readFileSync2 } from "node:fs";
import { dirname as dirname4, join as join2, resolve as resolve5 } from "node:path";
import { Effect as Effect102, Schema as Schema12 } from "effect";

// src/product/safety-policy/safety-policy-schema.ts
import { Schema as Schema11 } from "effect";

// src/safety/safety-taxonomy-schemas.ts
import { Schema as Schema10 } from "effect";
var SafetyPolicyLifecycleSchema = Schema10.Literal("active", "legacy-supported");
var SafetyPolicyFamilySchema = Schema10.Literal(
  "input",
  "imported_context",
  "step_scope",
  "consent",
  "output_release",
  "policy_evidence",
  "operational_override"
);
var OperationalOverrideTargetFamilySchema = Schema10.Literal(
  "input",
  "imported_context",
  "step_scope",
  "consent",
  "output_release"
);
var SafetyDecisionOutcomeSchema = Schema10.Literal(
  "approve",
  "sanitize",
  "quarantine",
  "block",
  "require_override",
  "revoke"
);
var SafetyOverrideabilitySchema = Schema10.Literal("never", "one_shot", "time_limited");
var SafetyEvidenceBoundarySchema = Schema10.Literal("input", "scope", "output", "consent", "override");
var OperationalOverrideTargetBoundarySchema = Schema10.Literal("input", "scope", "output", "consent");
var SafetyClassificationCategorySchema = Schema10.Literal(
  "ordinary_generation_input",
  "imported_context_out_of_scope",
  "voice_training_input",
  "personal_data",
  "customer_confidential_data",
  "operational_data",
  "security_sensitive_data",
  "llm_prohibited_data"
);
var OperationalOverrideLifecycleModeSchema = Schema10.Literal("one_shot", "time_limited");

// src/product/safety-policy/safety-policy-schema.ts
var SafetyPolicyFamilyDocumentSchema = Schema11.Struct({
  family: SafetyPolicyFamilySchema,
  defaultOutcome: SafetyDecisionOutcomeSchema,
  allowedOutcomes: Schema11.NonEmptyArray(SafetyDecisionOutcomeSchema),
  overrideability: SafetyOverrideabilitySchema,
  evidenceBoundary: SafetyEvidenceBoundarySchema,
  detectorAdapters: Schema11.Array(Schema11.String),
  nonOverridableCategories: Schema11.optional(Schema11.Array(SafetyClassificationCategorySchema)),
  maxOverrideWindowMinutes: Schema11.optional(Schema11.Number.pipe(Schema11.positive()))
});
var SafetyClassificationDocumentSchema = Schema11.Struct({
  category: SafetyClassificationCategorySchema,
  defaultOutcome: SafetyDecisionOutcomeSchema,
  minimizationRequired: Schema11.Boolean,
  description: Schema11.String
});
var SafetyDetectorAdapterDocumentSchema = Schema11.Struct({
  id: Schema11.String,
  kind: Schema11.Literal("classifier", "scanner", "heuristic"),
  optional: Schema11.Boolean,
  boundaries: Schema11.NonEmptyArray(SafetyEvidenceBoundarySchema)
});
var SafetyPolicyDocumentSchema = Schema11.Struct({
  policyVersion: Schema11.String,
  lifecycle: SafetyPolicyLifecycleSchema,
  unknownInputOutcome: Schema11.Literal("block"),
  evidenceBoundaries: Schema11.NonEmptyArray(SafetyEvidenceBoundarySchema),
  families: Schema11.Array(SafetyPolicyFamilyDocumentSchema),
  classifications: Schema11.Array(SafetyClassificationDocumentSchema),
  detectorAdapters: Schema11.Array(SafetyDetectorAdapterDocumentSchema)
});
var SafetyPolicyManifestSchema = Schema11.Struct({
  activeVersion: Schema11.String,
  versions: Schema11.Array(
    Schema11.Struct({
      version: Schema11.String,
      lifecycle: SafetyPolicyLifecycleSchema,
      policyPath: Schema11.String
    })
  )
});

// src/product/safety-policy/safety-policy-loader.ts
var DEFAULT_SAFETY_POLICY_MANIFEST_PATH = join2(
  backendPackageRoot2,
  "policies/safety/official/manifest.json"
);
var requiredPolicyFamilies = [
  "input",
  "imported_context",
  "step_scope",
  "consent",
  "output_release",
  "policy_evidence",
  "operational_override"
];
var requiredClassificationCategories = [
  "ordinary_generation_input",
  "imported_context_out_of_scope",
  "voice_training_input",
  "personal_data",
  "customer_confidential_data",
  "operational_data",
  "security_sensitive_data",
  "llm_prohibited_data"
];
var requiredEvidenceBoundaries = [
  "input",
  "scope",
  "output",
  "consent",
  "override"
];
function loadResolvedSafetyPolicyDocuments(manifestPath) {
  return Effect102.gen(function* () {
    const manifest = yield* loadJsonFile2(manifestPath, SafetyPolicyManifestSchema);
    const manifestDirectory = dirname4(manifestPath);
    const versions = yield* Effect102.all(
      manifest.versions.map((version) => loadResolvedVersion2(manifestDirectory, version))
    );
    return {
      manifest,
      versionIndex: new Map(versions.map((version) => [version.version, version]))
    };
  });
}
function loadResolvedVersion2(manifestDirectory, version) {
  return Effect102.gen(function* () {
    const policyPath = resolve5(manifestDirectory, version.policyPath);
    const policy = yield* loadJsonFile2(policyPath, SafetyPolicyDocumentSchema);
    if (policy.policyVersion !== version.version) {
      return yield* Effect102.fail(
        new BackendSafetyPolicyValidationError({
          path: policyPath,
          message: `Safety policy document version "${policy.policyVersion}" does not match manifest version "${version.version}"`,
          details: {
            policyVersion: policy.policyVersion,
            manifestVersion: version.version
          }
        })
      );
    }
    if (policy.lifecycle !== version.lifecycle) {
      return yield* Effect102.fail(
        new BackendSafetyPolicyValidationError({
          path: policyPath,
          message: `Safety policy lifecycle "${policy.lifecycle}" does not match manifest lifecycle "${version.lifecycle}"`,
          details: { version: version.version }
        })
      );
    }
    yield* validateSafetyPolicyDocument(policy);
    return {
      version: version.version,
      lifecycle: version.lifecycle,
      policy
    };
  });
}
function validateSafetyPolicyDocument(policy) {
  return Effect102.gen(function* () {
    const policyFamilies = new Map(policy.families.map((family) => [family.family, family]));
    const classifications = new Map(
      policy.classifications.map((classification) => [classification.category, classification])
    );
    const detectorAdapters = new Set(policy.detectorAdapters.map((adapter) => adapter.id));
    const evidenceBoundaries = new Set(policy.evidenceBoundaries);
    for (const family of requiredPolicyFamilies) {
      if (!policyFamilies.has(family)) {
        return yield* Effect102.fail(
          new BackendSafetyPolicyDefinitionError({
            policyVersion: policy.policyVersion,
            family,
            message: `Safety policy must declare family "${family}"`
          })
        );
      }
    }
    for (const classification of requiredClassificationCategories) {
      if (!classifications.has(classification)) {
        return yield* Effect102.fail(
          new BackendSafetyPolicyDefinitionError({
            policyVersion: policy.policyVersion,
            classification,
            message: `Safety policy must declare classification "${classification}"`
          })
        );
      }
    }
    for (const boundary of requiredEvidenceBoundaries) {
      if (!evidenceBoundaries.has(boundary)) {
        return yield* Effect102.fail(
          new BackendSafetyPolicyDefinitionError({
            policyVersion: policy.policyVersion,
            boundary,
            message: `Safety policy must declare evidence boundary "${boundary}"`
          })
        );
      }
    }
    for (const family of policy.families) {
      if (!family.allowedOutcomes.includes(family.defaultOutcome)) {
        return yield* Effect102.fail(
          new BackendSafetyPolicyDefinitionError({
            policyVersion: policy.policyVersion,
            family: family.family,
            message: `Family "${family.family}" must include default outcome "${family.defaultOutcome}" in allowed outcomes`
          })
        );
      }
      if (!evidenceBoundaries.has(family.evidenceBoundary)) {
        return yield* Effect102.fail(
          new BackendSafetyPolicyDefinitionError({
            policyVersion: policy.policyVersion,
            family: family.family,
            boundary: family.evidenceBoundary,
            message: `Family "${family.family}" references unknown evidence boundary "${family.evidenceBoundary}"`
          })
        );
      }
      for (const detectorAdapter of family.detectorAdapters) {
        if (!detectorAdapters.has(detectorAdapter)) {
          return yield* Effect102.fail(
            new BackendSafetyPolicyDefinitionError({
              policyVersion: policy.policyVersion,
              family: family.family,
              message: `Family "${family.family}" references unknown detector adapter "${detectorAdapter}"`
            })
          );
        }
      }
    }
  });
}
function loadJsonFile2(path, schema) {
  return Effect102.gen(function* () {
    const raw = yield* Effect102.try({
      try: () => readFileSync2(path, "utf8"),
      catch: (cause) => new BackendSafetyPolicyLoadError({
        path,
        message: cause instanceof Error ? cause.message : `Failed to read ${path}`
      })
    });
    const decodedJson = yield* Effect102.try({
      try: () => JSON.parse(raw),
      catch: (cause) => new BackendSafetyPolicyValidationError({
        path,
        message: cause instanceof Error ? cause.message : `Failed to parse JSON from ${path}`
      })
    });
    return yield* Schema12.decodeUnknown(schema)(decodedJson).pipe(
      Effect102.mapError(
        (cause) => new BackendSafetyPolicyValidationError({
          path,
          message: `Safety policy document at "${path}" failed schema validation`,
          details: { cause: String(cause) }
        })
      )
    );
  });
}

// src/product/safety-policy/safety-policy-version-index.ts
import { Effect as Effect103 } from "effect";
function createResolvedSafetyPolicyVersionIndex(args) {
  const versions = new Map(
    Array.from(args.versionIndex.entries()).map(([version, document]) => [version, toResolvedSafetyPolicyVersion(document)])
  );
  const activePolicy = versions.get(args.activePolicy.version) ?? toResolvedSafetyPolicyVersion(args.activePolicy);
  const versionSummaries = Array.from(versions.values()).map((policyVersion) => ({
    version: policyVersion.version,
    lifecycle: policyVersion.lifecycle
  }));
  return {
    versions,
    versionSummaries,
    activePolicy
  };
}
function resolveSafetyPolicyFamily(policy, family) {
  const definition = policy.families[family];
  if (definition) {
    return Effect103.succeed(definition);
  }
  return Effect103.fail(
    new BackendSafetyPolicyDefinitionError({
      policyVersion: policy.version,
      family,
      message: `Safety policy family "${family}" is not available in active policy`
    })
  );
}
function resolveSafetyClassification(policy, category) {
  const definition = policy.classifications[category];
  if (definition) {
    return Effect103.succeed(definition);
  }
  return Effect103.fail(
    new BackendSafetyPolicyDefinitionError({
      policyVersion: policy.version,
      classification: category,
      message: `Safety classification "${category}" is not available in active policy`
    })
  );
}
function toResolvedSafetyPolicyVersion(document) {
  const families = Object.fromEntries(
    document.policy.families.map((family) => [family.family, family])
  );
  const classifications = Object.fromEntries(
    document.policy.classifications.map((classification) => [classification.category, classification])
  );
  const detectorAdapters = Object.fromEntries(
    document.policy.detectorAdapters.map((adapter) => [adapter.id, adapter])
  );
  return {
    version: document.version,
    lifecycle: document.lifecycle,
    families,
    classifications,
    evidenceBoundaries: document.policy.evidenceBoundaries,
    unknownInputOutcome: document.policy.unknownInputOutcome,
    detectorAdapters
  };
}

// src/product/safety-policy/safety-policy.ts
function loadBackendSafetyPolicyService(config, options = {}) {
  return Effect104.gen(function* () {
    const manifestPath = options.manifestPath ?? config.safetyPolicyManifestPath ?? DEFAULT_SAFETY_POLICY_MANIFEST_PATH;
    const { manifest, versionIndex } = yield* loadResolvedSafetyPolicyDocuments(manifestPath);
    const activePolicy = versionIndex.get(manifest.activeVersion);
    if (!activePolicy) {
      return yield* Effect104.fail(
        new BackendSafetyPolicyValidationError({
          path: manifestPath,
          message: `Active safety policy version "${manifest.activeVersion}" is missing from manifest versions`,
          details: { activeVersion: manifest.activeVersion }
        })
      );
    }
    const index = createResolvedSafetyPolicyVersionIndex({
      activePolicy,
      versionIndex
    });
    return {
      getActivePolicy: () => Effect104.succeed(index.activePolicy),
      listPolicyVersions: () => index.versionSummaries,
      getPolicyFamily: (family) => resolveSafetyPolicyFamily(index.activePolicy, family),
      getClassification: (category) => resolveSafetyClassification(index.activePolicy, category)
    };
  });
}

// src/product/core/feature-flags.ts
function resolveBackendFeatureFlags(config) {
  const resolvedFlags = DEFAULT_FEATURE_FLAGS.map((flag) => {
    if (flag.key === "execution.sync_mode") {
      return {
        ...flag,
        enabled: config.executionMode === "sync",
        defaultVariant: config.executionMode === "sync" ? "sync" : "async"
      };
    }
    if (flag.key === "content.language.refinement") {
      return {
        ...flag,
        enabled: true
      };
    }
    if (flag.key === "voice.reasoningSignatureV1") {
      return {
        ...flag,
        enabled: config.reasoningSignatureV1Enabled === true,
        defaultVariant: config.reasoningSignatureV1Enabled === true ? "on" : "off"
      };
    }
    return flag;
  });
  return [
    ...resolvedFlags,
    {
      key: "execution.experimental_debug",
      scope: "execution",
      enabled: config.experimentalDebugEnabled === true,
      description: "Allows the guarded internal experimental pipeline flow",
      defaultVariant: config.experimentalDebugEnabled === true ? "enabled" : "disabled",
      variants: ["disabled", "enabled"]
    }
  ];
}

// src/safety/redaction.ts
var REDACTED_MARKER = "[REDACTED]";
function isClassifiedRedactionValue(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value;
  return candidate._tag === "ClassifiedRedactionValue" && typeof candidate.classification === "string";
}
function resolveClassificationReason(classification) {
  switch (classification) {
    case "personal_data":
      return "classification_personal_data";
    case "customer_confidential_data":
      return "classification_customer_confidential";
    case "security_sensitive_data":
      return "classification_security_sensitive";
    case "llm_prohibited_data":
      return "classification_prohibited";
    case "voice_training_input":
      return "classification_voice_training";
    case "operational_data":
      return "classification_operational";
    default:
      return "classification_secret";
  }
}
function isSecretLikeFieldName(fieldName, patterns) {
  const lower = fieldName.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}
function determineReason(fieldName, config) {
  if (isSecretLikeFieldName(fieldName, config.secretLikeFieldPatterns)) {
    return { reason: "pattern_secret_like" };
  }
  return { reason: "field_name_protected" };
}
function redactValue(value, reason, preserveTypeHints) {
  if (value === null || value === void 0) {
    return value;
  }
  if (typeof value === "string" && value.startsWith("[REDACTED")) {
    return value;
  }
  if (typeof value === "string") {
    return preserveTypeHints ? `[REDACTED: string(${value.length})]` : REDACTED_MARKER;
  }
  if (typeof value === "number") {
    return preserveTypeHints ? `[REDACTED: number]` : REDACTED_MARKER;
  }
  if (typeof value === "boolean") {
    return preserveTypeHints ? `[REDACTED: boolean]` : REDACTED_MARKER;
  }
  if (value instanceof Date) {
    return preserveTypeHints ? `[REDACTED: Date]` : REDACTED_MARKER;
  }
  if (Array.isArray(value)) {
    return preserveTypeHints ? `[REDACTED: array(${value.length})]` : REDACTED_MARKER;
  }
  if (typeof value === "object") {
    return preserveTypeHints ? "[REDACTED: object]" : REDACTED_MARKER;
  }
  return REDACTED_MARKER;
}
function redactClassifiedValue(value, preserveTypeHints) {
  const reason = resolveClassificationReason(value.classification);
  return {
    reason,
    redacted: {
      _tag: "ClassifiedRedactionValue",
      classification: value.classification,
      value: redactValue(value.value, reason, preserveTypeHints)
    }
  };
}
function traverseAndRedact(obj, config, path, depth2, redactedPaths, reasons) {
  if (depth2 > config.maxDepth) {
    return { redacted: { [REDACTED_MARKER]: "max depth exceeded" }, fieldsInspected: 1 };
  }
  const result = {};
  let fieldsInspected = 0;
  for (const [key, value] of Object.entries(obj)) {
    fieldsInspected++;
    const currentPath = path ? `${path}.${key}` : key;
    if (isClassifiedRedactionValue(value)) {
      if (config.redactedClassifications.includes(value.classification)) {
        const { redacted, reason } = redactClassifiedValue(value, config.preserveTypeHints);
        result[key] = redacted;
        redactedPaths.push(currentPath);
        reasons[currentPath] = reason;
        continue;
      }
      result[key] = value;
      continue;
    }
    if (isSecretLikeFieldName(key, config.secretLikeFieldPatterns)) {
      const { reason } = determineReason(key, config);
      result[key] = redactValue(value, reason, config.preserveTypeHints);
      redactedPaths.push(currentPath);
      reasons[currentPath] = reason;
      continue;
    }
    if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      const nested = traverseAndRedact(
        value,
        config,
        currentPath,
        depth2 + 1,
        redactedPaths,
        reasons
      );
      result[key] = nested.redacted;
      fieldsInspected += nested.fieldsInspected;
    } else {
      result[key] = value;
    }
  }
  return { redacted: result, fieldsInspected };
}
function createDefaultConfig() {
  return {
    secretLikeFieldPatterns: [
      "api_key",
      "apikey",
      "secret",
      "token",
      "password",
      "private_key",
      "privatekey",
      "credential",
      "auth",
      "authorization",
      "access_key",
      "accesskey",
      "key_id",
      "keyid",
      "bearer"
    ],
    redactedClassifications: [
      "personal_data",
      "customer_confidential_data",
      "security_sensitive_data",
      "llm_prohibited_data",
      "voice_training_input"
    ],
    maxDepth: 10,
    preserveTypeHints: true
  };
}
function createBackendRedactionService(config) {
  const defaultConfig = createDefaultConfig();
  const resolvedConfig = {
    ...defaultConfig,
    ...config,
    secretLikeFieldPatterns: [
      ...defaultConfig.secretLikeFieldPatterns,
      ...config?.secretLikeFieldPatterns ?? []
    ],
    redactedClassifications: [
      ...defaultConfig.redactedClassifications,
      ...config?.redactedClassifications ?? []
    ]
  };
  const redactObject = (obj) => {
    if (isClassifiedRedactionValue(obj)) {
      if (resolvedConfig.redactedClassifications.includes(obj.classification)) {
        const { redacted: redacted2, reason } = redactClassifiedValue(obj, resolvedConfig.preserveTypeHints);
        return {
          redacted: redacted2,
          report: {
            redactedPaths: ["value"],
            reasons: { value: reason },
            totalFieldsInspected: 1
          }
        };
      }
      return {
        redacted: obj,
        report: {
          redactedPaths: [],
          reasons: {},
          totalFieldsInspected: 1
        }
      };
    }
    const redactedPaths = [];
    const reasons = {};
    const { redacted, fieldsInspected } = traverseAndRedact(obj, resolvedConfig, "", 0, redactedPaths, reasons);
    return {
      redacted,
      report: {
        redactedPaths,
        reasons,
        totalFieldsInspected: fieldsInspected
      }
    };
  };
  const isSecretLikeField = (fieldName) => isSecretLikeFieldName(fieldName, resolvedConfig.secretLikeFieldPatterns);
  const isRedactedClassification = (category) => resolvedConfig.redactedClassifications.includes(category);
  const createRedactedLogger = (logger) => {
    const wrap = (level) => (message, meta) => {
      if (meta && Object.keys(meta).length > 0) {
        const { redacted } = redactObject(meta);
        logger[level](message, redacted);
      } else {
        logger[level](message, meta);
      }
    };
    return {
      info: wrap("info"),
      warn: wrap("warn"),
      error: wrap("error"),
      debug: wrap("debug")
    };
  };
  const redactObservabilitySnapshot = (snapshot) => {
    const redactedEvents = snapshot.events.map((event) => {
      const { redacted } = redactObject(event.details);
      return {
        ...event,
        details: redacted
      };
    });
    return {
      counters: { ...snapshot.counters },
      events: redactedEvents
    };
  };
  return {
    redactObject,
    isSecretLikeField,
    isRedactedClassification,
    createRedactedLogger,
    redactObservabilitySnapshot
  };
}

// src/safety/voice-field-protection.ts
import { createCipheriv, createDecipheriv, createHash as createHash3, randomBytes } from "node:crypto";
import { Effect as Effect105 } from "effect";
var protectedVoiceFieldPrefix = "voiceprot:v1:";
var cipherAlgorithm = "aes-256-gcm";
var ivLength = 12;
var authTagLength = 16;
function isProtectedVoiceField(value) {
  return typeof value === "string" && value.startsWith(protectedVoiceFieldPrefix);
}
function createBackendVoiceFieldProtectionService(options) {
  const key = deriveProtectionKey(options.keyMaterial);
  const previousKey = options.previousKeyMaterial ? deriveProtectionKey(options.previousKeyMaterial) : void 0;
  return {
    protectVoiceExample: (record) => Effect105.gen(function* () {
      const text = yield* protectStringField(record.userId, "voice_example.text", record.text, key);
      const context = yield* protectOptionalStringField(record.userId, "voice_example.context", record.context, key);
      return {
        ...record,
        text,
        context
      };
    }),
    unprotectVoiceExample: (record) => Effect105.gen(function* () {
      const text = yield* unprotectStringFieldWithFallback(
        record.userId,
        "voice_example.text",
        record.text,
        key,
        previousKey
      );
      const context = yield* unprotectOptionalStringFieldWithFallback(
        record.userId,
        "voice_example.context",
        record.context,
        key,
        previousKey
      );
      return {
        ...record,
        text,
        context
      };
    }),
    protectVoiceExampleBatch: (record) => Effect105.gen(function* () {
      const items = yield* Effect105.forEach(record.items, (item) => {
        if (!item.stagedInput) {
          return Effect105.succeed(item);
        }
        return Effect105.gen(function* () {
          const stagedInput = item.stagedInput;
          const protectedText = yield* protectStringField(
            record.userId,
            "voice_example_batch.staged_input.text",
            stagedInput.text,
            key
          );
          const protectedContext = yield* protectOptionalStringField(
            record.userId,
            "voice_example_batch.staged_input.context",
            stagedInput.context,
            key
          );
          return {
            ...item,
            stagedInput: {
              ...stagedInput,
              text: protectedText,
              context: protectedContext
            }
          };
        });
      }, { concurrency: 1 });
      return {
        ...record,
        items
      };
    }),
    unprotectVoiceExampleBatch: (record) => Effect105.gen(function* () {
      const items = yield* Effect105.forEach(record.items, (item) => {
        if (!item.stagedInput) {
          return Effect105.succeed(item);
        }
        return Effect105.gen(function* () {
          const stagedInput = item.stagedInput;
          const text = yield* unprotectStringFieldWithFallback(
            record.userId,
            "voice_example_batch.staged_input.text",
            stagedInput.text,
            key,
            previousKey
          );
          const context = yield* unprotectOptionalStringFieldWithFallback(
            record.userId,
            "voice_example_batch.staged_input.context",
            stagedInput.context,
            key,
            previousKey
          );
          return {
            ...item,
            stagedInput: {
              ...stagedInput,
              text,
              context
            }
          };
        });
      }, { concurrency: 1 });
      return {
        ...record,
        items
      };
    })
  };
}
function deriveProtectionKey(keyMaterial) {
  return createHash3("sha256").update(keyMaterial).digest();
}
function protectOptionalStringField(userId, fieldName, value, key) {
  if (value === void 0) {
    return Effect105.succeed(void 0);
  }
  return protectStringField(userId, fieldName, value, key);
}
function unprotectOptionalStringFieldWithFallback(userId, fieldName, value, key, previousKey) {
  if (value === void 0) {
    return Effect105.succeed(void 0);
  }
  return unprotectStringFieldWithFallback(userId, fieldName, value, key, previousKey);
}
function protectStringField(userId, fieldName, value, key) {
  return Effect105.try({
    try: () => {
      const iv = randomBytes(ivLength);
      const cipher = createCipheriv(cipherAlgorithm, key, iv);
      const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return `${protectedVoiceFieldPrefix}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
    },
    catch: (cause) => new BackendVoiceTrainingConsentFailureError({
      userId,
      reason: "protection_failed",
      message: `Failed to protect persisted voice field "${fieldName}": ${cause instanceof Error ? cause.message : String(cause)}`
    })
  });
}
function unprotectStringFieldWithFallback(userId, fieldName, value, key, previousKey) {
  if (!isProtectedVoiceField(value)) {
    return Effect105.succeed(value);
  }
  return decryptProtectedString(userId, fieldName, value, key).pipe(
    Effect105.catchAll((currentError) => {
      if (!previousKey) {
        return Effect105.fail(currentError);
      }
      return decryptProtectedString(userId, fieldName, value, previousKey);
    })
  );
}
function decryptProtectedString(userId, fieldName, value, key) {
  return Effect105.try({
    try: () => {
      const payload = value.slice(protectedVoiceFieldPrefix.length);
      const [ivEncoded, authTagEncoded, encryptedEncoded] = payload.split(":");
      if (!ivEncoded || !authTagEncoded || !encryptedEncoded) {
        return failMalformedProtectedPayload();
      }
      const iv = Buffer.from(ivEncoded, "base64");
      const authTag = Buffer.from(authTagEncoded, "base64");
      const encrypted = Buffer.from(encryptedEncoded, "base64");
      if (iv.length !== ivLength || authTag.length !== authTagLength) {
        return failMalformedProtectedPayload();
      }
      const decipher = createDecipheriv(cipherAlgorithm, key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString("utf8");
    },
    catch: (cause) => new BackendVoiceTrainingConsentFailureError({
      userId,
      reason: "protection_failed",
      message: `Failed to unprotect persisted voice field "${fieldName}": ${cause instanceof Error ? cause.message : String(cause)}`
    })
  });
}
function failMalformedProtectedPayload() {
  throw new Error("Malformed protected payload");
}

// src/product/voice/protected-voice-training-database.ts
import { Effect as Effect106 } from "effect";
function createProtectedVoiceTrainingDatabaseClient(database, protection) {
  const baseClient = {
    ...database,
    voiceExamples: {
      create: (record, version) => Effect106.gen(function* () {
        const protectedRecord = yield* protection.protectVoiceExample(record);
        const stored = yield* database.voiceExamples.create(protectedRecord, version);
        return yield* protection.unprotectVoiceExample(stored);
      }),
      save: (record) => Effect106.gen(function* () {
        const protectedRecord = yield* protection.protectVoiceExample(record);
        const stored = yield* database.voiceExamples.save(protectedRecord);
        return yield* protection.unprotectVoiceExample(stored);
      }),
      get: (id) => Effect106.flatMap(
        database.voiceExamples.get(id),
        (record) => record ? protection.unprotectVoiceExample(record) : Effect106.succeed(void 0)
      ),
      listByUser: (userId) => Effect106.flatMap(
        database.voiceExamples.listByUser(userId),
        (records) => Effect106.forEach(records, (record) => protection.unprotectVoiceExample(record), { concurrency: 1 })
      ),
      remove: database.voiceExamples.remove,
      removeByUser: database.voiceExamples.removeByUser
    },
    voiceExampleBatches: {
      create: (record, version) => Effect106.gen(function* () {
        const protectedRecord = yield* protection.protectVoiceExampleBatch(record);
        const stored = yield* database.voiceExampleBatches.create(protectedRecord, version);
        return yield* protection.unprotectVoiceExampleBatch(stored);
      }),
      save: (record) => Effect106.gen(function* () {
        const protectedRecord = yield* protection.protectVoiceExampleBatch(record);
        const stored = yield* database.voiceExampleBatches.save(protectedRecord);
        return yield* protection.unprotectVoiceExampleBatch(stored);
      }),
      get: (id) => Effect106.flatMap(
        database.voiceExampleBatches.get(id),
        (record) => record ? protection.unprotectVoiceExampleBatch(record) : Effect106.succeed(void 0)
      ),
      listByUser: (userId) => Effect106.flatMap(
        database.voiceExampleBatches.listByUser(userId),
        (records) => Effect106.forEach(records, (record) => protection.unprotectVoiceExampleBatch(record), { concurrency: 1 })
      ),
      remove: database.voiceExampleBatches.remove
    },
    transaction: (operation) => database.transaction(
      (transactionClient) => operation(createProtectedVoiceTrainingDatabaseClient(transactionClient, protection))
    ),
    snapshot: database.snapshot
  };
  if ("kysely" in database) {
    return {
      ...baseClient,
      kysely: database.kysely
    };
  }
  return baseClient;
}

// src/product/core/service-dependencies.ts
function createBackendProductDependencies(config, now, options = {}) {
  return Effect107.gen(function* () {
    const database = options.database ?? (yield* createBackendDatabaseClient(config));
    const featureFlagRegistry = yield* createFeatureFlagRegistry(resolveBackendFeatureFlags(config));
    const featureFlags = yield* createFeatureFlagService({ registry: featureFlagRegistry });
    const aiAdapters = createAIAdapterService(registerDefaultAIProviders(createAIAdapterRegistry()));
    const postgres = config.databaseUrl ? getPostgresDatabase(database) : void 0;
    const billingRepository = postgres ? yield* loadBillingRepository(postgres) : createBillingRepository();
    const billing = postgres ? createPersistingBillingService(postgres, billingRepository, now) : createBillingService({ repository: billingRepository });
    const aiPolicy = yield* loadBackendAIPolicyService(config, {}, {
      database,
      now
    });
    const experimentalAIPolicy = yield* loadBackendAIPolicyService(config, {
      manifestPath: config.experimentalAIPolicyManifestPath,
      optional: true
    }, {
      database,
      now
    });
    const safetyPolicy = yield* loadBackendSafetyPolicyService(config);
    const activeSafetyPolicy = yield* safetyPolicy.getActivePolicy();
    const redaction = createBackendRedactionService({
      redactedClassifications: resolveProtectedDiagnosticClassifications(activeSafetyPolicy.classifications)
    });
    const voiceFieldProtection = createBackendVoiceFieldProtectionService({
      keyMaterial: resolveVoiceDataProtectionKeyMaterial(config),
      previousKeyMaterial: config.voiceDataProtectionPreviousKey
    });
    const protectedDatabase = createProtectedVoiceTrainingDatabaseClient(database, voiceFieldProtection);
    yield* registerBackendBillingPlans(billing);
    yield* seedBillingState(billing, config, now);
    return {
      database: protectedDatabase,
      rawDatabase: database,
      featureFlagRegistry,
      featureFlags,
      aiAdapters,
      billing,
      billingRepository,
      aiPolicy,
      experimentalAIPolicy,
      safetyPolicy,
      redaction
    };
  });
}
function resolveVoiceDataProtectionKeyMaterial(config) {
  return config.voiceDataProtectionKey ?? `${config.serviceName}:${config.environment}:voice-training-protection`;
}
function resolveProtectedDiagnosticClassifications(classifications) {
  return Object.entries(classifications).filter(
    ([category, definition]) => definition.minimizationRequired && category !== "ordinary_generation_input"
  ).map(([category]) => category);
}

// src/product/voice/voice-rebuild-service.ts
import { Effect as Effect117, Either } from "effect";

// ../../packages/text-quality/src/errors.ts
import { Data as Data11 } from "effect";
var TextQualityInputError = class extends Data11.TaggedError("TextQualityInputError") {
};
var VoiceProfileNotFoundError = class extends Data11.TaggedError("VoiceProfileNotFoundError") {
};
var CandidateGenerationError = class extends Data11.TaggedError("CandidateGenerationError") {
};
var CandidateSelectionError = class extends Data11.TaggedError("CandidateSelectionError") {
};

// ../../packages/text-quality/src/voice/voice-resolution.ts
import { Effect as Effect108 } from "effect";

// ../../packages/text-quality/src/domain/tech-terms.ts
var TECH_LEXICON_TERMS = /* @__PURE__ */ new Set([
  "api",
  "apis",
  "algoritmo",
  "algoritmos",
  "algorithm",
  "algorithms",
  "backend",
  "backends",
  "banco",
  "bug",
  "bugs",
  "cache",
  "caches",
  "codebase",
  "codigo",
  "c\xF3digo",
  "database",
  "databases",
  "deploy",
  "deploys",
  "docker",
  "endpoint",
  "endpoints",
  "feature",
  "features",
  "framework",
  "frameworks",
  "frontend",
  "frontends",
  "infraestrutura",
  "infrastructure",
  "kubernetes",
  "legacy",
  "llm",
  "llms",
  "microservice",
  "microservices",
  "microservico",
  "microservi\xE7o",
  "middleware",
  "modelo",
  "modelos",
  "model",
  "models",
  "pipeline",
  "pipelines",
  "prompt",
  "prompts",
  "query",
  "queries",
  "refactor",
  "refactoring",
  "release",
  "releases",
  "rollback",
  "rollbacks",
  "sprint",
  "sprints",
  "stack",
  "stacks",
  "token",
  "tokens",
  "versao",
  "vers\xE3o",
  "version",
  "versions"
]);
function isTechLexiconTerm(token) {
  return TECH_LEXICON_TERMS.has(token.toLowerCase());
}
function filterTechLexiconTerms(terms) {
  return terms.filter((term) => !isTechLexiconTerm(term));
}

// ../../packages/text-quality/src/candidate/candidate-selector.ts
import { Effect as Effect109 } from "effect";

// ../../packages/text-quality/src/services/VoiceProfileResolver.ts
import { Context as Context12 } from "effect";
var VoiceProfileResolver = class extends Context12.Tag("VoiceProfileResolver")() {
};

// ../../packages/text-quality/src/services/CandidateScorer.ts
import { Context as Context13 } from "effect";
var CandidateScorer = class extends Context13.Tag("CandidateScorer")() {
};

// ../../packages/text-quality/src/services/CandidateSelector.ts
import { Context as Context14 } from "effect";
var CandidateSelector = class extends Context14.Tag("CandidateSelector")() {
};

// ../../packages/text-quality/src/services/TextQualityService.ts
import { Context as Context15 } from "effect";
var TextQualityService = class extends Context15.Tag("TextQualityService")() {
};

// ../../packages/text-quality/src/pipeline/text-quality-pipeline.ts
import { Effect as Effect111 } from "effect";

// ../../packages/text-quality/src/candidate/lane-runner.ts
import { Effect as Effect110 } from "effect";

// ../../packages/text-quality/src/layers/live.ts
import { Layer as Layer11, Effect as Effect112 } from "effect";

// src/product/voice/voice-rebuild-derivation.ts
function deriveVoiceRebuildState(args) {
  const activeExamples = args.allExamples.filter((example) => example.state === "active");
  const materialBase = buildVoiceMaterialBase(args.allExamples);
  const confidence = deriveConfidence(activeExamples);
  const reasonCodes = [...deriveReasonCodes(activeExamples)];
  if (args.reasoningExtractionFailed) {
    reasonCodes.push("reasoning_extraction_failed");
  }
  if (args.developmentExtractionFailed) {
    reasonCodes.push("development_extraction_failed");
  }
  if (args.reconciliationFailed) {
    reasonCodes.push("voice_signature_reconciliation_failed");
  }
  const nextActionCodes = unique2(
    reasonCodes.flatMap((reasonCode) => nextActionCodesForReason(reasonCode))
  );
  const coverage = deriveCoverage(activeExamples);
  const profile = {
    id: `voice-profile:${args.userId}`,
    userId: args.userId,
    version: args.version,
    snapshotId: `voice-profile-snapshot:${args.userId}:v${args.version}`,
    confidence,
    adaptationMode: confidence === "low" ? "conservative" : "standard",
    primaryLanguage: resolvePrimaryLanguage(activeExamples),
    tone: resolveTone(activeExamples),
    cadence: resolveCadence(activeExamples),
    description: buildProfileDescription(activeExamples, confidence),
    lexicon: resolveLexicon(activeExamples),
    constraints: confidence === "low" ? ["avoid_voice_caricature"] : ["preserve_author_voice"],
    styleMarkers: resolveStyleMarkers(activeExamples),
    rules: resolveRules(activeExamples, confidence),
    antiPatterns: resolveAntiPatterns(activeExamples),
    coreReasoningSignature: args.reasoning?.core ?? args.previousProfile?.coreReasoningSignature,
    argumentDevelopmentSignature: args.development ?? args.previousProfile?.argumentDevelopmentSignature,
    formatExpressionProfiles: args.reasoning?.formatExpressions ?? args.previousProfile?.formatExpressionProfiles,
    createdAt: args.timestamp,
    updatedAt: args.timestamp
  };
  const diagnostics = {
    id: `voice-diagnostics:${args.userId}`,
    userId: args.userId,
    activeVersion: args.version,
    updating: false,
    summary: buildDiagnosticsSummary(confidence, reasonCodes, coverage.bestCovered.length),
    reasonCodes,
    nextActionCodes,
    bestCoveredContentTypes: coverage.bestCovered,
    underrepresentedContentTypes: coverage.underrepresented,
    pendingRebuild: args.reasoningExtractionFailed || args.developmentExtractionFailed || args.reconciliationFailed ? {
      status: "failed",
      reasonCode: args.reconciliationFailed ? "voice_signature_reconciliation_failed" : args.developmentExtractionFailed ? "development_extraction_failed" : "reasoning_extraction_failed",
      nextActionCodes: nextActionCodesForReason(
        args.reconciliationFailed ? "voice_signature_reconciliation_failed" : args.developmentExtractionFailed ? "development_extraction_failed" : "reasoning_extraction_failed"
      )
    } : {
      status: "idle",
      nextActionCodes: []
    },
    materialBase,
    createdAt: args.timestamp,
    updatedAt: args.timestamp
  };
  return {
    profile,
    diagnostics
  };
}
function buildVoiceMaterialBase(examples) {
  const activeExamples = examples.filter((example) => example.state === "active");
  const byClassification = countBy(
    examples.flatMap((example) => example.classificationLabels.length > 0 ? example.classificationLabels : ["unclassified"])
  );
  const byContentType = countBy(
    activeExamples.flatMap(
      (example) => example.explicitContentType ? [example.explicitContentType] : example.effectiveContentTypeHints.length > 0 ? [...example.effectiveContentTypeHints] : ["general"]
    )
  );
  const byLanguage = countBy(examples.map((example) => example.language));
  return {
    totalExamples: examples.length,
    activeExamples: activeExamples.length,
    excludedExamples: examples.filter((example) => example.state === "excluded").length,
    pinnedExamples: activeExamples.filter((example) => example.pinned).length,
    byClassification,
    byContentType,
    byLanguage
  };
}
function resolveNextProfileVersion(currentProfile, currentDiagnostics) {
  const activeVersion = currentProfile?.profileVersion ?? currentDiagnostics?.activeVersion ?? 0;
  return Math.max(activeVersion + 1, currentDiagnostics?.pendingVersion ?? 0);
}
function deriveConfidence(activeExamples) {
  if (activeExamples.length < 5) {
    return "low";
  }
  const diversityScore = calculateDiversityScore(activeExamples);
  if (diversityScore < 4) {
    return "medium";
  }
  return "high";
}
function deriveReasonCodes(activeExamples) {
  const reasonCodes = [];
  const diversityScore = calculateDiversityScore(activeExamples);
  if (activeExamples.length < 5) {
    reasonCodes.push("insufficient_examples");
  }
  if (activeExamples.length >= 5 && diversityScore < 4) {
    reasonCodes.push("insufficient_diversity");
  }
  if (detectLanguageConflict(activeExamples)) {
    reasonCodes.push("language_conflict");
  }
  return reasonCodes;
}
function deriveCoverage(activeExamples) {
  const counts = countBy(
    activeExamples.flatMap(
      (example) => example.explicitContentType ? [example.explicitContentType] : example.effectiveContentTypeHints.length > 0 ? [...example.effectiveContentTypeHints] : ["general"]
    )
  );
  const items = Object.entries(counts).map(([contentType, total]) => {
    const coverage = total >= 3 ? "high" : total >= 2 ? "medium" : "low";
    const reasonCodes = [];
    if (total < 2) {
      reasonCodes.push("insufficient_examples");
    }
    if (coverage === "low") {
      reasonCodes.push("insufficient_diversity");
    }
    return {
      contentType,
      coverage,
      reasonCodes: unique2(reasonCodes)
    };
  });
  return {
    bestCovered: items.filter((item) => item.coverage !== "low"),
    underrepresented: items.filter((item) => item.coverage === "low")
  };
}
function buildDiagnosticsSummary(confidence, reasonCodes, wellCoveredContentTypes) {
  if (reasonCodes.includes("voice_signature_reconciliation_failed")) {
    return "N\xE3o foi poss\xEDvel harmonizar o perfil inferido agora. O \xFAltimo snapshot v\xE1lido continua ativo.";
  }
  if (reasonCodes.includes("development_extraction_failed")) {
    return "N\xE3o foi poss\xEDvel atualizar como voc\xEA desenvolve textos agora. O \xFAltimo snapshot v\xE1lido continua ativo.";
  }
  if (reasonCodes.includes("reasoning_extraction_failed")) {
    return "N\xE3o foi poss\xEDvel atualizar o racioc\xEDnio inferido agora. O \xFAltimo snapshot v\xE1lido continua ativo.";
  }
  if (reasonCodes.includes("insufficient_examples")) {
    return "Ainda faltam exemplos suficientes para consolidar uma voz forte e previs\xEDvel.";
  }
  if (reasonCodes.includes("language_conflict")) {
    return "A voz j\xE1 tem base razo\xE1vel, mas os exemplos misturam idiomas e isso reduz a consist\xEAncia.";
  }
  if (reasonCodes.includes("insufficient_diversity")) {
    return "J\xE1 existe base suficiente, mas ainda falta diversidade de formatos e contextos para estabilizar a voz.";
  }
  if (confidence === "high" && wellCoveredContentTypes > 1) {
    return "A voz do autor est\xE1 bem representada e cobre bem mais de um tipo de conte\xFAdo.";
  }
  if (confidence === "high") {
    return "A voz do autor est\xE1 bem representada e pronta para adapta\xE7\xF5es mais firmes.";
  }
  return "O profile atual j\xE1 est\xE1 utiliz\xE1vel, mas ainda pode ficar mais representativo.";
}
function buildProfileDescription(activeExamples, confidence) {
  const tone = resolveTone(activeExamples);
  const cadence = resolveCadence(activeExamples);
  if (confidence === "low") {
    return `Voz ${tone} com cad\xEAncia ${cadence}, ainda em consolida\xE7\xE3o.`;
  }
  return `Voz ${tone} com cad\xEAncia ${cadence} e sinais consistentes entre os exemplos.`;
}
function resolvePrimaryLanguage(activeExamples) {
  const languageEntries = Object.entries(countBy(activeExamples.map((example) => example.language)));
  return languageEntries.sort((left, right) => right[1] - left[1])[0]?.[0] ?? "pt-BR";
}
function resolveTone(activeExamples) {
  const informalSignals = activeExamples.filter(
    (example) => /\b(eu|minha|minhas|meu|meus|voce|voces|vc|vcs)\b/i.test(normalizeText(example.text))
  ).length;
  return informalSignals >= Math.max(1, Math.ceil(activeExamples.length / 2)) ? "informal" : "formal";
}
function resolveCadence(activeExamples) {
  const averageWordsPerSentence = average(
    activeExamples.map((example) => {
      const words = tokenize(example.text);
      const sentenceCount = Math.max(1, example.text.split(/[.!?]+/).filter(Boolean).length);
      return words.length / sentenceCount;
    })
  );
  return averageWordsPerSentence <= 16 ? "direct" : averageWordsPerSentence <= 24 ? "balanced" : "measured";
}
function resolveLexicon(activeExamples) {
  const stopWords = /* @__PURE__ */ new Set([
    "para",
    "com",
    "uma",
    "como",
    "mais",
    "isso",
    "essa",
    "esse",
    "sobre",
    "quando",
    "muito",
    "pouco",
    "entre",
    "depois",
    "antes"
  ]);
  const frequencies = /* @__PURE__ */ new Map();
  for (const token of activeExamples.flatMap((example) => tokenize(example.text))) {
    if (token.length < 5 || stopWords.has(token) || isTechLexiconTerm(token)) {
      continue;
    }
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }
  return [...frequencies.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5).map(([token]) => token);
}
function resolveStyleMarkers(activeExamples) {
  const markers = /* @__PURE__ */ new Set();
  if (activeExamples.some((example) => /\b(eu|minha|minhas|meu|meus)\b/i.test(normalizeText(example.text)))) {
    markers.add("first-person");
  }
  if (average(activeExamples.map((example) => tokenize(example.text).length)) < 30) {
    markers.add("short-paragraphs");
  }
  if (activeExamples.some((example) => /\b(voce|voces|vc|vcs)\b/i.test(normalizeText(example.text)))) {
    markers.add("direct-address");
  }
  if (activeExamples.some((example) => example.pinned)) {
    markers.add("author-selected-reference");
  }
  return [...markers];
}
function resolveRules(activeExamples, confidence) {
  const rules = /* @__PURE__ */ new Set();
  if (activeExamples.some((example) => /\b(eu|minha|minhas|meu|meus)\b/i.test(normalizeText(example.text)))) {
    rules.add("prefer_first_person_when_relevant");
  }
  if (confidence === "low") {
    rules.add("prefer_conservative_voice_adaptation");
  }
  if (average(activeExamples.map((example) => tokenize(example.text).length)) < 30) {
    rules.add("prefer_shorter_paragraphs");
  }
  if (detectLanguageConflict(activeExamples)) {
    rules.add("avoid_mixing_languages_without_context");
  }
  return [...rules];
}
function resolveAntiPatterns(activeExamples) {
  return unique2(activeExamples.flatMap((example) => example.antiPatternsExplicit));
}
function calculateDiversityScore(activeExamples) {
  const contentTypes = new Set(
    activeExamples.flatMap(
      (example) => example.explicitContentType ? [example.explicitContentType] : example.effectiveContentTypeHints.length > 0 ? [...example.effectiveContentTypeHints] : ["general"]
    )
  );
  const channels = new Set(activeExamples.map((example) => example.channel).filter(Boolean));
  const formats = new Set(activeExamples.map((example) => example.format).filter(Boolean));
  const lengthBuckets = new Set(
    activeExamples.map((example) => {
      const length = tokenize(example.text).length;
      if (length < 18) {
        return "short";
      }
      if (length < 40) {
        return "medium";
      }
      return "long";
    })
  );
  return contentTypes.size + channels.size + formats.size + lengthBuckets.size - 1;
}
function detectLanguageConflict(activeExamples) {
  const languages = new Set(activeExamples.map((example) => example.language));
  return languages.size > 1;
}
function countBy(values) {
  return values.reduce((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}
function average(values) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}
function tokenize(text) {
  return normalizeText(text).split(/[^a-z0-9]+/i).map((token) => token.trim()).filter((token) => token.length > 0);
}
function normalizeText(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function unique2(values) {
  return [...new Set(values)];
}

// src/product/voice/reasoning-extraction.ts
import { Effect as Effect114, Schema as Schema13 } from "effect";

// src/product/voice/voice-extraction-errors.ts
import { Data as Data12 } from "effect";
var ReasoningExtractionError = class extends Data12.TaggedError("ReasoningExtractionError") {
};
var ArgumentDevelopmentExtractionError = class extends Data12.TaggedError(
  "ArgumentDevelopmentExtractionError"
) {
};
var VoiceSignatureReconciliationError = class extends Data12.TaggedError(
  "VoiceSignatureReconciliationError"
) {
};

// src/product/voice/voice-extraction-json.ts
import { Effect as Effect113 } from "effect";
function extractJsonObject(content) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}
function parseJsonFromLlmResponse(content) {
  return Effect113.try({
    try: () => JSON.parse(extractJsonObject(content)),
    catch: (error) => error instanceof Error ? error.message : "Failed to parse JSON"
  });
}

// src/product/voice/reasoning-extraction.ts
var decodeReasoningExtraction = Schema13.decodeUnknown(ReasoningExtractionResultSchema);
var LANGUAGE_RETRY_SUFFIX = "\n\nRETRY: Your previous JSON used the wrong language. Rewrite every narrativeProse field in Brazilian Portuguese. Do not use English in narrativeProse.";
function groupExamplesByContentType(examples) {
  const groups = /* @__PURE__ */ new Map();
  for (const example of examples.filter((item) => item.state === "active")) {
    const contentTypes = example.explicitContentType ? [example.explicitContentType] : (example.effectiveContentTypeHints?.length ?? 0) > 0 ? [...example.effectiveContentTypeHints] : ["general"];
    for (const contentType of contentTypes) {
      const bucket = groups.get(contentType) ?? [];
      bucket.push(example);
      groups.set(contentType, bucket);
    }
  }
  return Object.fromEntries(groups.entries());
}
function filterFormatExpressionsByCoverage(result, examplesByContentType) {
  const formatExpressions = Object.fromEntries(
    Object.entries(result.formatExpressions).filter(([contentType]) => {
      const count = examplesByContentType[contentType]?.length ?? 0;
      return count >= 2;
    })
  );
  return {
    core: result.core,
    formatExpressions
  };
}
function extractReasoningSignature(args) {
  return Effect114.gen(function* () {
    const grouped = groupExamplesByContentType(args.examples);
    const outputLanguage = resolveReasoningOutputLanguage(args.examples);
    const systemPrompt = buildReasoningExtractionSystemPrompt(outputLanguage);
    let userPrompt = buildExtractionPrompt(grouped, args.examples, outputLanguage);
    let lastError;
    for (const attempt of args.attempts) {
      for (let languageRetry = 0; languageRetry < 2; languageRetry += 1) {
        const completion = yield* Effect114.either(
          args.aiAdapters.complete({
            request: {
              provider: attempt.provider,
              model: attempt.model,
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: userPrompt
                }
              ],
              temperature: 0.2,
              metadata: {
                purpose: "reasoning-extraction",
                adapter: attempt.provider,
                model: attempt.model,
                ...typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {}
              }
            },
            transport: args.providerTransport.complete
          })
        );
        if (completion._tag === "Left") {
          lastError = new ReasoningExtractionError({ message: completion.left.message });
          break;
        }
        const parsed = yield* parseExtractionResponse(completion.right.response.text).pipe(Effect114.either);
        if (parsed._tag === "Left") {
          lastError = parsed.left;
          break;
        }
        if (outputLanguage.primary === "pt" && languageRetry === 0 && !isReasoningNarrativeLikelyPortuguese(parsed.right)) {
          userPrompt = `${buildExtractionPrompt(grouped, args.examples, outputLanguage)}${LANGUAGE_RETRY_SUFFIX}`;
          continue;
        }
        return filterFormatExpressionsByCoverage(parsed.right, grouped);
      }
    }
    return yield* Effect114.fail(lastError ?? new ReasoningExtractionError({ message: "Reasoning extraction failed" }));
  });
}
function parseExtractionResponse(content) {
  return Effect114.gen(function* () {
    const parsed = yield* parseJsonFromLlmResponse(content).pipe(
      Effect114.mapError((message) => new ReasoningExtractionError({ message }))
    );
    const decoded = yield* decodeReasoningExtraction(parsed).pipe(
      Effect114.mapError(
        (error) => new ReasoningExtractionError({
          message: error instanceof Error ? error.message : "Invalid reasoning extraction schema"
        })
      )
    );
    return normalizeExtractionResult(decoded);
  });
}
function normalizeExtractionResult(result) {
  const formatExpressions = Object.fromEntries(
    Object.entries(result.formatExpressions).map(([contentType, profile]) => [
      contentType,
      {
        ...profile,
        contentType: profile.contentType || contentType
      }
    ])
  );
  return {
    core: {
      ...result.core,
      derivedAntiPatterns: [...new Set(result.core.derivedAntiPatterns.map((item) => item.trim()).filter(Boolean))]
    },
    formatExpressions
  };
}
function buildExtractionPrompt(grouped, examples, outputLanguage) {
  const sections = Object.entries(grouped).map(([contentType, groupedExamples]) => {
    const exampleBlocks = groupedExamples.map(
      (example, index) => `Example ${index + 1} (language: ${example.language}):
${example.text.trim()}`
    ).join("\n\n");
    return `## Content type: ${contentType}
${exampleBlocks}`;
  });
  return [
    `Dominant example language: ${outputLanguage.bcp47} (${outputLanguage.label}).`,
    `Write every narrativeProse field in ${outputLanguage.label}.`,
    "Analyze the author's reasoning patterns across all examples below.",
    "Return JSON only matching the agreed schema.",
    "Infer a single global core reasoning signature and per-content-type format expression profiles.",
    "Do not copy example text verbatim into narrative prose.",
    resolveReasoningLanguageInstruction(outputLanguage),
    "",
    ...sections
  ].join("\n");
}
function normalizeExampleLanguage(language) {
  const lower = language.trim().toLowerCase();
  if (lower.startsWith("pt")) {
    return "pt";
  }
  if (lower.startsWith("en")) {
    return "en";
  }
  return lower.split("-")[0] ?? lower;
}
function resolvePrimaryExampleLanguage(examples) {
  const counts = /* @__PURE__ */ new Map();
  for (const example of examples.filter((item) => item.state === "active")) {
    const language = normalizeExampleLanguage(example.language);
    counts.set(language, (counts.get(language) ?? 0) + 1);
  }
  let primary;
  let highestCount = 0;
  for (const [language, count] of counts) {
    if (count > highestCount) {
      primary = language;
      highestCount = count;
    }
  }
  return primary;
}
function resolveReasoningOutputLanguage(examples) {
  const primary = resolvePrimaryExampleLanguage(examples);
  if (primary === "pt") {
    return {
      primary: "pt",
      bcp47: "pt-BR",
      label: "Brazilian Portuguese"
    };
  }
  if (primary === "en") {
    return {
      primary: "en",
      bcp47: "en-US",
      label: "English"
    };
  }
  const dominantExample = examples.find((example) => example.state === "active");
  return {
    primary: primary ?? "unknown",
    bcp47: dominantExample?.language ?? "unknown",
    label: "the same language as the majority of examples"
  };
}
function resolveReasoningLanguageInstruction(outputLanguage) {
  if (outputLanguage.primary === "pt") {
    return "CRITICAL: Every narrativeProse field MUST be written in Brazilian Portuguese (pt-BR). English is not allowed in narrativeProse.";
  }
  if (outputLanguage.primary === "en") {
    return "CRITICAL: Every narrativeProse field MUST be written in English.";
  }
  return "CRITICAL: Every narrativeProse field MUST be written in the same language as the majority of examples.";
}
function buildReasoningExtractionSystemPrompt(outputLanguage) {
  return [
    "You extract an author's reasoning signature from writing examples.",
    "Respond with JSON only \u2014 no markdown fences or commentary.",
    `OUTPUT LANGUAGE: ${outputLanguage.label} (${outputLanguage.bcp47}).`,
    `Every narrativeProse value MUST be written in ${outputLanguage.label}.`,
    "Enum fields remain the schema literals in English (for example low|moderate|high).",
    "derivedAntiPatterns may stay short phrase labels in the example language.",
    "Schema:",
    "{",
    '  "core": {',
    '    "narrativeProse": "string",',
    '    "certaintyLevel": "low|moderate|high",',
    '    "judgmentFrequency": "low|moderate|high",',
    '    "conclusionPace": "slow|moderate|fast",',
    '    "readerRelationship": "peer|mentor|observer|collaborator|guide",',
    '    "authoritySource": "personal_observation|lived_experience|data|reference|practice",',
    '    "derivedAntiPatterns": ["string"]',
    "  },",
    '  "formatExpressions": {',
    '    "<contentType>": {',
    '      "contentType": "<contentType>",',
    '      "narrativeProse": "string",',
    '      "register": "formal|informal|technical|conversational",',
    '      "openingStyle": "direct|contextual|provocative",',
    '      "technicalDensity": "low|medium|high"',
    "    }",
    "  }",
    "}"
  ].join("\n");
}
function isLikelyPortugueseText(text) {
  const normalized = text.trim();
  if (!normalized) {
    return true;
  }
  if (/^(The author|They |Author |This author|Opens with|LinkedIn posts stay)/i.test(normalized)) {
    return false;
  }
  return /[áàâãéêíóôõúç]/i.test(normalized) || /\b(que|com|para|não|autor|abordagem|observa|tom|estilo)\b/i.test(normalized);
}
function isReasoningNarrativeLikelyPortuguese(result) {
  const narratives = [
    result.core.narrativeProse,
    ...Object.values(result.formatExpressions).map((expression) => expression.narrativeProse)
  ];
  return narratives.every(isLikelyPortugueseText);
}
var TEST_REASONING_EXTRACTION_FIXTURE = {
  core: {
    narrativeProse: "The author observes before judging, lets tension build through concrete situations, and arrives at insight without prescribing universal rules.",
    certaintyLevel: "moderate",
    judgmentFrequency: "low",
    conclusionPace: "slow",
    readerRelationship: "peer",
    authoritySource: "personal_observation",
    derivedAntiPatterns: ["generic linkedin tone", "numbered thesis proof list"]
  },
  formatExpressions: {
    "linkedin-post": {
      contentType: "linkedin-post",
      narrativeProse: "LinkedIn posts stay conversational with short paragraphs and a direct opening.",
      register: "conversational",
      openingStyle: "direct",
      technicalDensity: "low"
    }
  }
};
var TEST_REASONING_EXTRACTION_FIXTURE_PT = {
  core: {
    narrativeProse: "O autor observa antes de julgar, deixa a tens\xE3o crescer em situa\xE7\xF5es concretas e chega a insights sem prescrever regras universais.",
    certaintyLevel: "moderate",
    judgmentFrequency: "low",
    conclusionPace: "slow",
    readerRelationship: "peer",
    authoritySource: "personal_observation",
    derivedAntiPatterns: ["tom gen\xE9rico de linkedin", "lista numerada de tese e prova"]
  },
  formatExpressions: {
    "linkedin-post": {
      contentType: "linkedin-post",
      narrativeProse: "Posts no LinkedIn mant\xEAm tom conversacional, com par\xE1grafos curtos e abertura direta.",
      register: "conversational",
      openingStyle: "direct",
      technicalDensity: "low"
    }
  }
};

// src/product/voice/argument-development-extraction.ts
import { Effect as Effect115, Schema as Schema14 } from "effect";
var decodeDevelopmentExtraction = Schema14.decodeUnknown(ArgumentDevelopmentExtractionResultSchema);
var LANGUAGE_RETRY_SUFFIX2 = "\n\nRETRY: Your previous JSON used the wrong language. Rewrite developmentProse in Brazilian Portuguese. Do not use English in developmentProse.";
function extractArgumentDevelopmentSignature(args) {
  return Effect115.gen(function* () {
    const activeExamples = args.examples.filter((example) => example.state === "active");
    if (activeExamples.length < 2) {
      return yield* Effect115.fail(
        new ArgumentDevelopmentExtractionError({
          message: "At least two active examples are required for development extraction"
        })
      );
    }
    const outputLanguage = resolveReasoningOutputLanguage(activeExamples);
    const systemPrompt = buildDevelopmentExtractionSystemPrompt(outputLanguage);
    let userPrompt = buildDevelopmentExtractionPrompt(activeExamples, outputLanguage);
    let lastError;
    for (const attempt of args.attempts) {
      for (let languageRetry = 0; languageRetry < 2; languageRetry += 1) {
        const completion = yield* Effect115.either(
          args.aiAdapters.complete({
            request: {
              provider: attempt.provider,
              model: attempt.model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              temperature: 0.2,
              metadata: {
                purpose: "argument-development-extraction",
                adapter: attempt.provider,
                model: attempt.model,
                ...typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {}
              }
            },
            transport: args.providerTransport.complete
          })
        );
        if (completion._tag === "Left") {
          lastError = new ArgumentDevelopmentExtractionError({ message: completion.left.message });
          break;
        }
        const parsed = yield* parseDevelopmentExtractionResponse(completion.right.response.text).pipe(Effect115.either);
        if (parsed._tag === "Left") {
          lastError = parsed.left;
          break;
        }
        if (outputLanguage.primary === "pt" && languageRetry === 0 && !isLikelyPortugueseText(parsed.right.development.developmentProse)) {
          userPrompt = `${buildDevelopmentExtractionPrompt(activeExamples, outputLanguage)}${LANGUAGE_RETRY_SUFFIX2}`;
          continue;
        }
        return normalizeDevelopmentExtractionResult(parsed.right);
      }
    }
    return yield* Effect115.fail(
      lastError ?? new ArgumentDevelopmentExtractionError({ message: "Argument development extraction failed" })
    );
  });
}
function parseDevelopmentExtractionResponse(content) {
  return Effect115.gen(function* () {
    const parsed = yield* parseJsonFromLlmResponse(content).pipe(
      Effect115.mapError((message) => new ArgumentDevelopmentExtractionError({ message }))
    );
    const decoded = yield* decodeDevelopmentExtraction(parsed).pipe(
      Effect115.mapError(
        (error) => new ArgumentDevelopmentExtractionError({
          message: error instanceof Error ? error.message : "Invalid argument development extraction schema"
        })
      )
    );
    return normalizeDevelopmentExtractionResult(decoded);
  });
}
function normalizeDevelopmentExtractionResult(result) {
  const { traitProfile: _ignored, ...developmentCore } = result.development;
  return {
    ...result.traits ? { traits: result.traits } : {},
    ...result.traitEvidence ? { traitEvidence: result.traitEvidence } : {},
    development: {
      ...developmentCore,
      moveLabels: [...new Set(developmentCore.moveLabels.map((item) => item.trim()).filter(Boolean))],
      structuralAntiPatterns: [
        ...new Set(developmentCore.structuralAntiPatterns.map((item) => item.trim()).filter(Boolean))
      ],
      transitionTendencies: developmentCore.transitionTendencies.filter(
        (tendency) => tendency.from.trim().length > 0 && tendency.to.trim().length > 0
      )
    }
  };
}
function buildDevelopmentExtractionPrompt(examples, outputLanguage) {
  const exampleBlocks = examples.map((example, index) => `Example ${index + 1} (language: ${example.language}):
${example.text.trim()}`).join("\n\n");
  return [
    `Dominant example language: ${outputLanguage.bcp47} (${outputLanguage.label}).`,
    `Write developmentProse and moveLabels in ${outputLanguage.label}.`,
    "Analyze how the author develops texts \u2014 argumentative moves, transitions, epistemic posture while writing, and structural habits.",
    "Do NOT infer cognitive traits (certainty, judgment) \u2014 focus on how the text unfolds.",
    "Do NOT impose a fixed phase template; infer moves from examples only.",
    "Return JSON only matching the agreed schema.",
    resolveDevelopmentLanguageInstruction(outputLanguage),
    "",
    exampleBlocks
  ].join("\n");
}
function resolveDevelopmentLanguageInstruction(outputLanguage) {
  if (outputLanguage.primary === "pt") {
    return "CRITICAL: developmentProse and moveLabels MUST be written in Brazilian Portuguese (pt-BR). Use short snake_case slugs in Portuguese (for example experiencia_vivida, duvida) or natural Portuguese phrases \u2014 never English move labels when examples are Portuguese.";
  }
  if (outputLanguage.primary === "en") {
    return "CRITICAL: developmentProse and moveLabels MUST be written in English.";
  }
  return "CRITICAL: developmentProse and moveLabels MUST match the majority example language.";
}
function buildDevelopmentExtractionSystemPrompt(outputLanguage) {
  return [
    "You extract how an author develops texts from writing examples.",
    "Respond with JSON only \u2014 no markdown fences or commentary.",
    `OUTPUT LANGUAGE: ${outputLanguage.label} (${outputLanguage.bcp47}).`,
    `developmentProse and moveLabels MUST be written in ${outputLanguage.label}.`,
    "moveLabels are author-specific short labels (snake_case slugs or brief phrases) in the output language \u2014 not schema enum literals.",
    "Enum fields remain schema literals in English.",
    "Schema:",
    "{",
    '  "development": {',
    '    "developmentProse": "string",',
    '    "moveLabels": ["author-specific move label"],',
    '    "transitionTendencies": [{ "from": "move", "to": "move", "frequency": "rare|occasional|common|dominant" }],',
    '    "epistemicPosture": "exploratory|investigative|advocacy_mixed",',
    '    "structuralAntiPatterns": ["wrong arc label"]',
    "  },",
    '  "traits": {',
    '    "openingMode": "observation|thesis|mixed",',
    '    "perspectiveShiftDensity": "low|moderate|high",',
    '    "usesCounterexamples": "rare|occasional|common|dominant",',
    '    "selfQuestioning": "low|moderate|high",',
    '    "insightTiming": "early|moderate|late",',
    '    "usesAnalogies": "rare|occasional|common|dominant",',
    '    "closingMode": "conclusion|open_question|mixed"',
    "  },",
    '  "traitEvidence": {',
    '    "<traitKey>": [{ "exampleIndex": 1, "value": "<enum>" }]',
    "  }",
    "}",
    "Omit trait keys you cannot infer from examples. Do not invent enum values for unknown traits."
  ].join("\n");
}
var TEST_DEVELOPMENT_TRAITS = {
  openingMode: "observation",
  perspectiveShiftDensity: "moderate",
  usesCounterexamples: "occasional",
  selfQuestioning: "high",
  insightTiming: "late",
  usesAnalogies: "rare",
  closingMode: "open_question"
};
var TEST_DEVELOPMENT_TRAIT_EVIDENCE = {
  openingMode: [
    { exampleIndex: 1, value: "observation" },
    { exampleIndex: 2, value: "observation" }
  ],
  perspectiveShiftDensity: [
    { exampleIndex: 1, value: "moderate" },
    { exampleIndex: 2, value: "moderate" },
    { exampleIndex: 3, value: "moderate" }
  ],
  usesCounterexamples: [{ exampleIndex: 2, value: "occasional" }],
  selfQuestioning: [
    { exampleIndex: 1, value: "high" },
    { exampleIndex: 2, value: "high" }
  ],
  insightTiming: [
    { exampleIndex: 1, value: "late" },
    { exampleIndex: 2, value: "late" },
    { exampleIndex: 3, value: "late" }
  ],
  usesAnalogies: [{ exampleIndex: 3, value: "rare" }],
  closingMode: [
    { exampleIndex: 2, value: "open_question" },
    { exampleIndex: 3, value: "open_question" }
  ]
};
var TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE = {
  development: {
    developmentProse: "The author opens from lived experience, tolerates doubt, tests ideas in concrete situations, and only then lands on a conclusion.",
    moveLabels: ["lived_experience", "doubt", "experimentation", "conclusion"],
    transitionTendencies: [
      { from: "lived_experience", to: "doubt", frequency: "common" },
      { from: "doubt", to: "experimentation", frequency: "common" },
      { from: "experimentation", to: "conclusion", frequency: "occasional" }
    ],
    epistemicPosture: "exploratory",
    structuralAntiPatterns: ["premature_thesis", "advocacy_arc"]
  },
  traits: TEST_DEVELOPMENT_TRAITS,
  traitEvidence: TEST_DEVELOPMENT_TRAIT_EVIDENCE
};
var TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE_PT = {
  development: {
    developmentProse: "O autor parte da experi\xEAncia vivida, tolera a d\xFAvida, testa ideias em situa\xE7\xF5es concretas e s\xF3 ent\xE3o chega a uma conclus\xE3o.",
    moveLabels: ["experiencia_vivida", "duvida", "experimentacao", "conclusao"],
    transitionTendencies: [
      { from: "experiencia_vivida", to: "duvida", frequency: "common" },
      { from: "duvida", to: "experimentacao", frequency: "common" },
      { from: "experimentacao", to: "conclusao", frequency: "occasional" }
    ],
    epistemicPosture: "exploratory",
    structuralAntiPatterns: ["tese_prematura", "arco_advocacia"]
  },
  traits: TEST_DEVELOPMENT_TRAITS,
  traitEvidence: TEST_DEVELOPMENT_TRAIT_EVIDENCE
};

// src/product/voice/voice-signature-divergence.ts
function evaluateVoiceSignatureDivergence(args) {
  const reasons = [];
  const { core } = args.reasoning;
  const development = args.development;
  const traitProfile = args.traitProfile ?? development.traitProfile;
  if (development.epistemicPosture === "exploratory" && (core.certaintyLevel === "high" || core.conclusionPace === "fast" || core.judgmentFrequency === "high")) {
    reasons.push("exploratory_posture_conflicts_with_core_certainty_or_pace");
  }
  if (development.epistemicPosture === "advocacy_mixed" && core.judgmentFrequency === "low" && (core.readerRelationship === "observer" || core.conclusionPace === "slow")) {
    reasons.push("advocacy_mixed_conflicts_with_observational_core");
  }
  if (development.epistemicPosture === "investigative" && core.judgmentFrequency === "high" && hasDoubtOrExperimentMoves(development)) {
    reasons.push("investigative_moves_conflict_with_high_judgment");
  }
  if (hasProseCollapse(core.narrativeProse, development.developmentProse)) {
    reasons.push("prose_collapse_between_core_and_development");
  }
  if (hasStructuralClash(core, development)) {
    reasons.push("structural_anti_pattern_conflicts_with_core_traits");
  }
  if (traitProfile) {
    const insightTiming = traitProfile.traits.insightTiming ?? traitProfile.records.insightTiming?.value;
    if (insightTiming === "late" && core.conclusionPace === "fast") {
      reasons.push("late_insight_timing_conflicts_with_fast_conclusion_pace");
    }
    const openingMode = traitProfile.traits.openingMode ?? traitProfile.records.openingMode?.value;
    if (openingMode === "thesis" && development.epistemicPosture === "exploratory" && hasDoubtOrExperimentMoves(development)) {
      reasons.push("thesis_opening_conflicts_with_exploratory_doubt_moves");
    }
    const disputedTraits = countDisputedTraits(traitProfile);
    if (disputedTraits >= 2) {
      reasons.push("multiple_disputed_development_traits");
    }
  }
  return {
    hasConflict: reasons.length > 0,
    reasons
  };
}
function countDisputedTraits(traitProfile) {
  return Object.keys(traitProfile.records).filter(
    (key) => traitProfile.records[key]?.status === "disputed"
  ).length;
}
function hasDoubtOrExperimentMoves(development) {
  const labels = development.moveLabels.map((label) => label.toLowerCase());
  return labels.some(
    (label) => /doubt|duvida|experiment|experimenta|hesitat|incert/.test(label)
  );
}
function hasProseCollapse(coreProse, developmentProse) {
  const coreTokens = tokenSet(coreProse);
  const developmentTokens = tokenSet(developmentProse);
  if (coreTokens.size === 0 || developmentTokens.size === 0) {
    return false;
  }
  const intersection = [...coreTokens].filter((token) => developmentTokens.has(token));
  const unionSize = (/* @__PURE__ */ new Set([...coreTokens, ...developmentTokens])).size;
  const jaccard = intersection.length / unionSize;
  return jaccard >= 0.72;
}
function hasStructuralClash(core, development) {
  const patterns = development.structuralAntiPatterns.map((pattern) => pattern.toLowerCase());
  const prematureThesis = patterns.some(
    (pattern) => /premature|tese_prematura|early_thesis|thesis_early/.test(pattern)
  );
  return prematureThesis && core.conclusionPace === "slow";
}
function tokenSet(text) {
  return new Set(
    text.toLowerCase().split(/[^\p{L}0-9]+/u).map((token) => token.trim()).filter((token) => token.length > 3)
  );
}

// src/product/voice/voice-signature-reconciliation.ts
import { Effect as Effect116, Schema as Schema15 } from "effect";
var decodeUnifiedVoiceSignature2 = Schema15.decodeUnknown(UnifiedVoiceSignatureSchema);
function reconcileVoiceSignatures(args) {
  return Effect116.gen(function* () {
    const grouped = groupExamplesByContentType(args.examples);
    const systemPrompt = buildReconciliationSystemPrompt();
    const userPrompt = buildReconciliationPrompt(args.reasoning, args.development, grouped, args.examples);
    let lastError;
    for (const attempt of args.attempts) {
      const completion = yield* Effect116.either(
        args.aiAdapters.complete({
          request: {
            provider: attempt.provider,
            model: attempt.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0,
            metadata: {
              purpose: "voice-signature-reconciliation",
              adapter: attempt.provider,
              model: attempt.model,
              ...typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {}
            }
          },
          transport: args.providerTransport.complete
        })
      );
      if (completion._tag === "Left") {
        lastError = new VoiceSignatureReconciliationError({ message: completion.left.message });
        continue;
      }
      const parsed = yield* parseReconciliationResponse(completion.right.response.text).pipe(Effect116.either);
      if (parsed._tag === "Left") {
        lastError = parsed.left;
        continue;
      }
      const filtered = filterFormatExpressionsByCoverage(
        {
          core: parsed.right.core,
          formatExpressions: parsed.right.formatExpressions
        },
        grouped
      );
      return {
        core: filtered.core,
        development: parsed.right.development,
        formatExpressions: filtered.formatExpressions
      };
    }
    return yield* Effect116.fail(
      lastError ?? new VoiceSignatureReconciliationError({ message: "Voice signature reconciliation failed" })
    );
  });
}
function parseReconciliationResponse(content) {
  return Effect116.gen(function* () {
    const parsed = yield* parseJsonFromLlmResponse(content).pipe(
      Effect116.mapError((message) => new VoiceSignatureReconciliationError({ message }))
    );
    const decoded = yield* decodeUnifiedVoiceSignature2(parsed).pipe(
      Effect116.mapError(
        (error) => new VoiceSignatureReconciliationError({
          message: error instanceof Error ? error.message : "Invalid voice signature reconciliation schema"
        })
      )
    );
    return {
      ...decoded,
      development: {
        ...decoded.development,
        moveLabels: [...new Set(decoded.development.moveLabels.map((item) => item.trim()).filter(Boolean))],
        structuralAntiPatterns: [
          ...new Set(decoded.development.structuralAntiPatterns.map((item) => item.trim()).filter(Boolean))
        ]
      },
      core: {
        ...decoded.core,
        derivedAntiPatterns: [...new Set(decoded.core.derivedAntiPatterns.map((item) => item.trim()).filter(Boolean))]
      }
    };
  });
}
function buildReconciliationPrompt(reasoning, development, grouped, examples) {
  const exampleSections = Object.entries(grouped).map(([contentType, groupedExamples]) => {
    const blocks = groupedExamples.map((example, index) => `Example ${index + 1}:
${example.text.trim()}`).join("\n\n");
    return `## ${contentType}
${blocks}`;
  });
  return [
    "Voice examples are ground truth. Harmonize the draft Core Reasoning Signature and Argument Development Signature into one coherent author profile.",
    "Keep Core focused on cognitive traits; keep Development focused on how texts unfold.",
    "Harmonize development traits with Core and Development prose when traitProfile is present.",
    "Resolve contradictions without collapsing the two layers into duplicate prose.",
    "",
    "Draft Core:",
    JSON.stringify(reasoning.core, null, 2),
    "",
    "Draft Development:",
    JSON.stringify(development, null, 2),
    "",
    ...development.traitProfile ? [
      "Draft Development Traits:",
      JSON.stringify(development.traitProfile, null, 2),
      ""
    ] : [],
    "Draft Format Expressions:",
    JSON.stringify(reasoning.formatExpressions, null, 2),
    "",
    "Examples:",
    ...exampleSections,
    "",
    `Total active examples: ${examples.filter((example) => example.state === "active").length}`
  ].join("\n");
}
function buildReconciliationSystemPrompt() {
  return [
    "You reconcile author voice signature drafts into one coherent profile.",
    "Respond with JSON only.",
    "Schema:",
    "{",
    '  "core": { narrativeProse, certaintyLevel, judgmentFrequency, conclusionPace, readerRelationship, authoritySource, derivedAntiPatterns },',
    '  "development": { developmentProse, moveLabels, transitionTendencies, epistemicPosture, structuralAntiPatterns, traitProfile? },',
    '  "formatExpressions": { "<contentType>": { contentType, narrativeProse, register, openingStyle, technicalDensity } }',
    "}"
  ].join("\n");
}

// src/product/voice/trait-confidence-pass.ts
function applyTraitConfidencePass(args) {
  const activeExampleIds = new Set(args.activeExamples.map((example) => example.id));
  const immature = args.activeExamples.length < 3;
  const traits = { ...args.traits ?? {} };
  const records = {};
  const countsByConfidence = { low: 0, medium: 0, high: 0 };
  const countsByStatus = {
    inferred: 0,
    confirmed: 0,
    disputed: 0,
    unknown: 0
  };
  let hasAnySignal = false;
  for (const traitKey of TRAIT_KEYS) {
    const proposedValue = traits[traitKey];
    const evidenceIds = normalizeEvidenceIds({
      traitKey,
      traitEvidence: args.traitEvidence,
      activeExamples: args.activeExamples,
      activeExampleIds
    });
    if (proposedValue === void 0 && evidenceIds.length === 0) {
      records[traitKey] = {
        confidence: "low",
        status: "unknown",
        evidenceExampleIds: []
      };
      countsByStatus.unknown += 1;
      countsByConfidence.low += 1;
      continue;
    }
    hasAnySignal = true;
    const contradiction = detectContradiction({
      traitKey,
      proposedValue,
      traitEvidence: args.traitEvidence,
      activeExamples: args.activeExamples,
      activeExampleIds
    });
    if (contradiction) {
      records[traitKey] = {
        ...proposedValue !== void 0 ? { value: proposedValue } : {},
        confidence: "low",
        status: "disputed",
        evidenceExampleIds: evidenceIds
      };
      countsByStatus.disputed += 1;
      countsByConfidence.low += 1;
      continue;
    }
    if (proposedValue === void 0) {
      records[traitKey] = {
        confidence: "low",
        status: "unknown",
        evidenceExampleIds: evidenceIds
      };
      countsByStatus.unknown += 1;
      countsByConfidence.low += 1;
      continue;
    }
    const supportingCount = Math.max(evidenceIds.length, proposedValue !== void 0 ? 1 : 0);
    let confidence = deriveConfidence2(supportingCount, {
      traitKey,
      value: proposedValue,
      development: args.development
    });
    let status = "inferred";
    if (immature && confidence === "high") {
      confidence = "medium";
    }
    records[traitKey] = {
      value: proposedValue,
      confidence,
      status,
      evidenceExampleIds: evidenceIds
    };
    countsByConfidence[confidence] += 1;
    countsByStatus[status] += 1;
  }
  if (!hasAnySignal && Object.values(records).every((record) => record?.status === "unknown")) {
    return void 0;
  }
  return {
    profile: {
      traits,
      records
    },
    countsByConfidence,
    countsByStatus
  };
}
function normalizeEvidenceIds(args) {
  const entries = args.traitEvidence?.[args.traitKey] ?? [];
  const ids = entries.map((entry) => {
    if (typeof entry.exampleId === "string" && args.activeExampleIds.has(entry.exampleId)) {
      return entry.exampleId;
    }
    if (typeof entry.exampleIndex === "number") {
      const index = entry.exampleIndex - 1;
      const example = args.activeExamples[index];
      return example?.id;
    }
    return void 0;
  }).filter((id) => typeof id === "string" && args.activeExampleIds.has(id));
  return [...new Set(ids)];
}
function detectContradiction(args) {
  const entries = args.traitEvidence?.[args.traitKey] ?? [];
  const valuesByExample = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    let exampleId;
    if (typeof entry.exampleId === "string" && args.activeExampleIds.has(entry.exampleId)) {
      exampleId = entry.exampleId;
    } else if (typeof entry.exampleIndex === "number") {
      exampleId = args.activeExamples[entry.exampleIndex - 1]?.id;
    }
    if (!exampleId) {
      continue;
    }
    const entryValue = entry.value ?? args.proposedValue;
    if (entryValue === void 0) {
      continue;
    }
    const previous = valuesByExample.get(exampleId);
    if (previous !== void 0 && previous !== entryValue) {
      return true;
    }
    valuesByExample.set(exampleId, entryValue);
  }
  const distinctValues = new Set(valuesByExample.values());
  return distinctValues.size > 1;
}
function deriveConfidence2(supportingCount, args) {
  if (supportingCount >= 3) {
    return "high";
  }
  if (supportingCount >= 2 && hasAlignedTransitionTendency(args.traitKey, args.value, args.development)) {
    return "high";
  }
  if (supportingCount >= 2) {
    return "medium";
  }
  return "low";
}
function hasAlignedTransitionTendency(traitKey, value, development) {
  if (traitKey === "perspectiveShiftDensity" && (value === "moderate" || value === "high")) {
    return development.transitionTendencies.some(
      (tendency) => tendency.frequency === "common" || tendency.frequency === "dominant"
    );
  }
  if (traitKey === "usesCounterexamples" && value !== "rare") {
    return development.moveLabels.some((label) => /counter|contra/i.test(label));
  }
  if (traitKey === "usesAnalogies" && value !== "rare") {
    return development.moveLabels.some((label) => /analog/i.test(label));
  }
  if (traitKey === "selfQuestioning" && (value === "moderate" || value === "high")) {
    return development.moveLabels.some((label) => /doubt|question|duvida/i.test(label));
  }
  return false;
}
function capTraitConfidenceForImmature(profile, activeExampleCount) {
  if (activeExampleCount >= 3) {
    return profile;
  }
  const records = Object.fromEntries(
    Object.entries(profile.records).map(([key, record]) => {
      if (record.confidence === "high") {
        return [key, { ...record, confidence: "medium" }];
      }
      return [key, record];
    })
  );
  return { ...profile, records };
}
function mergeTraitConfirmations(profile, confirmations) {
  const records = { ...profile.records };
  for (const traitKey of TRAIT_KEYS) {
    const confirmation = confirmations[traitKey];
    const record = records[traitKey];
    if (!confirmation || !record || confirmation.response === "skipped") {
      continue;
    }
    if (confirmation.response === "confirmed") {
      records[traitKey] = {
        ...record,
        status: "confirmed",
        confidence: bumpConfidence(record.confidence)
      };
      continue;
    }
    if (confirmation.response === "rejected") {
      records[traitKey] = {
        ...record,
        status: "disputed",
        confidence: record.confidence
      };
    }
  }
  return { ...profile, records };
}
function bumpConfidence(current) {
  if (current === "low") {
    return "medium";
  }
  return "high";
}

// src/product/voice/voice-rebuild-service.ts
function createBackendVoiceRebuildService(database, now, observability, logger, voiceConsent, dependencies = {}) {
  const states = /* @__PURE__ */ new Map();
  const ensureState = (userId) => {
    const existing = states.get(userId);
    if (existing) {
      return existing;
    }
    const created = {
      running: false,
      queued: false
    };
    states.set(userId, created);
    return created;
  };
  const startRunner = (userId, state) => {
    if (state.running) {
      return;
    }
    state.running = true;
    state.activePromise = (async () => {
      try {
        while (state.queued) {
          state.queued = false;
          await Effect117.runPromise(
            processUserRebuild(database, userId, now, observability, logger, voiceConsent, dependencies)
          );
          if (state.queued) {
            await Effect117.runPromise(markRebuildQueued(database, userId, now));
          }
        }
      } finally {
        state.running = false;
        state.activePromise = void 0;
        if (state.queued) {
          startRunner(userId, state);
        }
      }
    })().catch((error) => {
      logger?.error("Voice profile rebuild runner failed", {
        userId,
        reason: error instanceof Error ? error.message : "unknown_error"
      });
    });
  };
  const waitForIdle = async (userId) => {
    while (true) {
      const relevantStates = userId ? [ensureState(userId)] : [...states.values()];
      const activePromises = relevantStates.map((state) => state.activePromise).filter((promise) => promise !== void 0);
      const stillBusy = relevantStates.some((state) => state.running || state.queued);
      if (!stillBusy) {
        return;
      }
      if (activePromises.length === 0) {
        await Promise.resolve();
        continue;
      }
      await Promise.all(activePromises);
    }
  };
  return {
    schedule(userId) {
      return Effect117.sync(() => {
        const state = ensureState(userId);
        state.queued = true;
        Effect117.runSync(
          observability.recordVoiceRebuildQueued({
            userId,
            queuedAt: now().toISOString()
          })
        );
        logger?.info("Queued voice profile rebuild", {
          userId
        });
        void Effect117.runPromise(markRebuildQueued(database, userId, now)).catch(() => void 0);
        startRunner(userId, state);
      });
    },
    drain(userId) {
      return Effect117.promise(() => waitForIdle(userId));
    }
  };
}
function processUserRebuild(database, userId, now, observability, logger, voiceConsent, dependencies = {}) {
  return Effect117.gen(function* () {
    if (voiceConsent) {
      const consentStatus = yield* voiceConsent.getConsentStatus(userId).pipe(
        Effect117.orElseSucceed(() => ({ granted: false, revokedAt: void 0 }))
      );
      if (!consentStatus.granted || consentStatus.revokedAt !== void 0) {
        logger?.info("Skipped voice profile rebuild because voice training consent is not active", { userId });
        yield* observability.recordVoiceRebuildFailed({
          userId,
          reason: "consent_revoked"
        });
        return;
      }
    }
    const timestamp = now().toISOString();
    const currentProfile = yield* database.voiceProfiles.getByUser(userId);
    const currentDiagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);
    const allExamples = yield* database.voiceExamples.listByUser(userId);
    yield* observability.recordVoiceRebuildStarted({
      userId,
      startedAt: timestamp
    });
    const nextVersion = resolveNextProfileVersion(currentProfile, currentDiagnostics);
    const previousProfile = currentProfile ? toVoiceProfileDomain(currentProfile) : void 0;
    const reasoningEnabled = dependencies.featureFlags?.isEnabled("voice.reasoningSignatureV1", {
      userId,
      environment: dependencies.config?.environment
    }) ?? false;
    let reasoning;
    let development;
    let reasoningExtractionFailed = false;
    let developmentExtractionFailed = false;
    let reconciliationFailed = false;
    const activeExamples = allExamples.filter((example) => example.state === "active");
    if (reasoningEnabled && dependencies.aiAdapters && dependencies.providerTransport && dependencies.aiPolicy) {
      const policy = yield* dependencies.aiPolicy.getActivePolicy();
      const routingProfile = policy.routingProfiles["voice-extraction-llm"];
      const attempts = routingProfile ? [...routingProfile.preferredAttempts, ...routingProfile.fallbackAttempts] : [];
      if (attempts.length > 0) {
        const reasoningEffect = extractReasoningSignature({
          examples: allExamples,
          attempts,
          aiAdapters: dependencies.aiAdapters,
          providerTransport: dependencies.providerTransport
        }).pipe(Effect117.either);
        const developmentEffect = activeExamples.length >= 2 ? extractArgumentDevelopmentSignature({
          examples: allExamples,
          attempts,
          aiAdapters: dependencies.aiAdapters,
          providerTransport: dependencies.providerTransport
        }).pipe(Effect117.either) : Effect117.succeed(
          Either.right(void 0)
        );
        const [reasoningResult, developmentResult] = yield* Effect117.all([
          reasoningEffect,
          developmentEffect
        ]);
        if (reasoningResult._tag === "Right") {
          reasoning = reasoningResult.right;
          logger?.info("Reasoning extraction succeeded", {
            userId,
            formatExpressionCount: Object.keys(reasoningResult.right.formatExpressions).length
          });
        } else {
          reasoningExtractionFailed = true;
          logger?.warn("Reasoning extraction failed; keeping previous reasoning snapshot", {
            userId,
            reason: reasoningResult.left.message
          });
          yield* observability.recordVoiceReasoningExtractionFailed({
            userId,
            reason: reasoningResult.left.message
          });
        }
        if (activeExamples.length >= 2) {
          if (developmentResult._tag === "Right" && developmentResult.right !== void 0) {
            const attached = attachTraitProfileToDevelopment({
              extraction: developmentResult.right,
              activeExamples,
              previousDevelopment: previousProfile?.argumentDevelopmentSignature
            });
            development = attached.development;
            if (attached.confidenceMetrics) {
              yield* observability.recordTraitConfidenceComputed({
                userId,
                ...attached.confidenceMetrics
              });
            }
            logger?.info("Argument development extraction succeeded", {
              userId,
              epistemicPosture: development.epistemicPosture,
              traitCount: development.traitProfile ? Object.keys(development.traitProfile.records).length : 0
            });
          } else if (developmentResult._tag === "Left") {
            developmentExtractionFailed = true;
            logger?.warn("Argument development extraction failed; keeping previous development snapshot", {
              userId,
              reason: developmentResult.left.message
            });
            yield* observability.recordVoiceDevelopmentExtractionFailed({
              userId,
              reason: developmentResult.left.message
            });
          }
        }
        if (reasoning && development && !reasoningExtractionFailed && !developmentExtractionFailed) {
          const divergence = evaluateVoiceSignatureDivergence({
            reasoning,
            development,
            traitProfile: development.traitProfile
          });
          if (divergence.hasConflict) {
            const reconciled = yield* reconcileVoiceSignatures({
              examples: allExamples,
              reasoning,
              development,
              attempts,
              aiAdapters: dependencies.aiAdapters,
              providerTransport: dependencies.providerTransport
            }).pipe(Effect117.either);
            if (reconciled._tag === "Right") {
              reasoning = {
                core: reconciled.right.core,
                formatExpressions: reconciled.right.formatExpressions
              };
              development = reconciled.right.development;
              yield* observability.recordVoiceSignatureReconciliationInvoked({
                userId,
                reasons: divergence.reasons
              });
            } else {
              reconciliationFailed = true;
              reasoning = void 0;
              development = void 0;
              logger?.warn("Voice signature reconciliation failed; keeping previous profile snapshots", {
                userId,
                reason: reconciled.left.message
              });
              yield* observability.recordVoiceSignatureReconciliationFailed({
                userId,
                reason: reconciled.left.message,
                reasons: divergence.reasons
              });
            }
          } else {
            yield* observability.recordVoiceSignatureReconciliationSkipped({
              userId
            });
          }
        }
      } else if (attempts.length === 0) {
        reasoningExtractionFailed = true;
        logger?.warn("Reasoning extraction skipped; voice-extraction-llm routing profile has no attempts", {
          userId
        });
      }
    }
    const derivedState = deriveVoiceRebuildState({
      userId,
      version: nextVersion,
      timestamp,
      allExamples,
      previousProfile,
      reasoning,
      development,
      reasoningExtractionFailed,
      developmentExtractionFailed,
      reconciliationFailed
    });
    yield* database.voiceProfiles.put(derivedState.profile).pipe(Effect117.orDie);
    yield* database.voiceProfileDiagnostics.put(derivedState.diagnostics).pipe(Effect117.orDie);
    yield* observability.recordVoiceRefreshEvent({
      userId,
      version: derivedState.profile.version,
      snapshotId: derivedState.profile.snapshotId
    });
    logger?.info("Refreshed voice profile snapshot", {
      userId,
      version: derivedState.profile.version,
      snapshotId: derivedState.profile.snapshotId
    });
    yield* clearProfileImpactFlags(database, allExamples, nextVersion, timestamp);
    yield* observability.recordVoiceRebuildCompleted({
      userId,
      version: derivedState.profile.version,
      snapshotId: derivedState.profile.snapshotId
    });
  }).pipe(
    Effect117.catchAllCause(
      (cause) => markRebuildFailure(database, userId, now, cause).pipe(
        Effect117.tap(
          () => observability.recordVoiceRebuildFailed({
            userId,
            reason: "processing_failed"
          })
        ),
        Effect117.tap(
          () => Effect117.sync(
            () => logger?.error("Voice profile rebuild failed", {
              userId,
              reason: "processing_failed"
            })
          )
        ),
        Effect117.orDie
      )
    )
  );
}
function markRebuildQueued(database, userId, now) {
  return Effect117.gen(function* () {
    const timestamp = now().toISOString();
    const profile = yield* database.voiceProfiles.getByUser(userId);
    const currentDiagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);
    const nextVersion = resolveNextProfileVersion(profile, currentDiagnostics);
    const diagnostics = {
      id: currentDiagnostics?.id ?? `voice-diagnostics:${userId}`,
      userId,
      activeVersion: currentDiagnostics?.activeVersion ?? profile?.profileVersion ?? 0,
      pendingVersion: nextVersion,
      updating: true,
      summary: currentDiagnostics?.summary ?? "Atualizando o profile de voz com os exemplos mais recentes.",
      reasonCodes: currentDiagnostics?.reasonCodes ?? [],
      nextActionCodes: currentDiagnostics?.nextActionCodes ?? [],
      bestCoveredContentTypes: currentDiagnostics?.bestCoveredContentTypes ?? [],
      underrepresentedContentTypes: currentDiagnostics?.underrepresentedContentTypes ?? [],
      pendingRebuild: {
        status: "in_progress",
        reasonCode: "rebuild_in_progress",
        nextActionCodes: nextActionCodesForReason("rebuild_in_progress")
      },
      materialBase: currentDiagnostics?.materialBase ?? buildVoiceMaterialBase(yield* database.voiceExamples.listByUser(userId)),
      createdAt: currentDiagnostics?.createdAt ?? timestamp,
      updatedAt: timestamp
    };
    yield* database.voiceProfileDiagnostics.put(diagnostics).pipe(Effect117.orDie);
  });
}
function markRebuildFailure(database, userId, now, _cause) {
  return Effect117.gen(function* () {
    const timestamp = now().toISOString();
    const profile = yield* database.voiceProfiles.getByUser(userId);
    const currentDiagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);
    const examples = yield* database.voiceExamples.listByUser(userId);
    const materialBase = buildVoiceMaterialBase(examples);
    const diagnostics = {
      id: currentDiagnostics?.id ?? `voice-diagnostics:${userId}`,
      userId,
      activeVersion: currentDiagnostics?.activeVersion ?? profile?.profileVersion ?? 0,
      updating: false,
      summary: "N\xE3o foi poss\xEDvel atualizar o profile agora. O \xFAltimo profile v\xE1lido continua ativo.",
      reasonCodes: currentDiagnostics?.reasonCodes ?? ["processing_failed"],
      nextActionCodes: currentDiagnostics?.nextActionCodes ?? nextActionCodesForReason("processing_failed"),
      bestCoveredContentTypes: currentDiagnostics?.bestCoveredContentTypes ?? [],
      underrepresentedContentTypes: currentDiagnostics?.underrepresentedContentTypes ?? [],
      pendingRebuild: {
        status: "failed",
        reasonCode: "processing_failed",
        nextActionCodes: nextActionCodesForReason("processing_failed")
      },
      materialBase,
      createdAt: currentDiagnostics?.createdAt ?? timestamp,
      updatedAt: timestamp
    };
    yield* database.voiceProfileDiagnostics.put(diagnostics).pipe(Effect117.orDie);
  });
}
function clearProfileImpactFlags(database, examples, activeVersion, timestamp) {
  return Effect117.forEach(
    examples.filter(
      (example) => example.pendingProfileImpact && (example.targetProfileVersion === void 0 || example.targetProfileVersion <= activeVersion)
    ),
    (example) => database.voiceExamples.save({
      ...example,
      pendingProfileImpact: false,
      targetProfileVersion: activeVersion,
      updatedAt: timestamp
    }).pipe(Effect117.orDie),
    { concurrency: 1, discard: true }
  );
}
function attachTraitProfileToDevelopment(args) {
  const { traits, traitEvidence, development } = args.extraction;
  const confidenceResult = applyTraitConfidencePass({
    traits,
    traitEvidence,
    development,
    activeExamples: args.activeExamples
  });
  if (!confidenceResult) {
    return {
      development: {
        ...development,
        ...args.previousDevelopment?.traitProfile ? { traitProfile: args.previousDevelopment.traitProfile } : {}
      }
    };
  }
  const traitProfile = capTraitConfidenceForImmature(
    confidenceResult.profile,
    args.activeExamples.length
  );
  return {
    development: {
      ...development,
      traitProfile
    },
    confidenceMetrics: {
      countsByConfidence: confidenceResult.countsByConfidence,
      countsByStatus: confidenceResult.countsByStatus
    }
  };
}

// src/execution/pipeline/provider-transport.ts
import { Effect as Effect118 } from "effect";
function createBackendProviderTransport(config) {
  if (config.environment === "test") {
    return createTestProviderTransport();
  }
  return {
    complete: (providerRequest) => Effect118.gen(function* () {
      const endpoint = resolveProviderEndpoint(config, providerRequest);
      const fetchTransport = resolveFetchTransport(providerRequest.provider);
      const headers = yield* Effect118.try({
        try: () => resolveProviderHeaders(config, providerRequest),
        catch: (cause) => cause instanceof AIAdapterTransportError ? cause : new AIAdapterTransportError({
          provider: providerRequest.provider,
          message: `Failed to configure provider "${providerRequest.provider}" transport`
        })
      });
      const response = yield* Effect118.tryPromise({
        try: (signal) => {
          const timeoutSignal = createProviderTimeoutSignal(signal, providerRequest);
          return fetchTransport(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(providerRequest.body),
            signal: timeoutSignal
          });
        },
        catch: (cause) => new AIAdapterTransportError({
          provider: providerRequest.provider,
          message: cause instanceof Error ? cause.message : `Failed to reach provider "${providerRequest.provider}"`
        })
      });
      if (!response.ok) {
        const responseBody = yield* readResponseBody(response);
        return yield* Effect118.fail(
          new AIAdapterTransportError({
            provider: providerRequest.provider,
            message: `Provider "${providerRequest.provider}" returned HTTP ${response.status}: ${responseBody}`
          })
        );
      }
      return yield* Effect118.tryPromise({
        try: () => response.json(),
        catch: (cause) => new AIAdapterTransportError({
          provider: providerRequest.provider,
          message: `Provider "${providerRequest.provider}" returned an invalid JSON payload: ${String(cause)}`
        })
      });
    })
  };
}
function resolveFetchTransport(provider) {
  const candidate = globalThis.fetch;
  if (typeof candidate !== "function") {
    throw new AIAdapterTransportError({
      provider,
      message: "Global fetch is not available in this runtime"
    });
  }
  return candidate;
}
function createTestProviderTransport() {
  return {
    complete: (providerRequest) => Effect118.succeed({
      choices: [
        {
          message: {
            content: renderTestResponse(providerRequest)
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        promptTokens: 32,
        completionTokens: 48,
        totalTokens: 80
      }
    })
  };
}
function resolveProviderEndpoint(config, providerRequest) {
  if (providerRequest.provider === "openai") {
    return `${stripTrailingSlash(config.openAIBaseUrl ?? "https://api.openai.com/v1")}/chat/completions`;
  }
  if (providerRequest.provider === "anthropic") {
    return `${stripTrailingSlash(config.anthropicBaseUrl ?? "https://api.anthropic.com/v1")}/messages`;
  }
  if (providerRequest.provider === "gemini") {
    return `${stripTrailingSlash(config.geminiBaseUrl ?? "https://generativelanguage.googleapis.com/v1beta")}/models/${providerRequest.model}:generateContent`;
  }
  if (providerRequest.provider === "deepseek") {
    return `${stripTrailingSlash(config.deepSeekBaseUrl ?? "https://api.deepseek.com/v1")}/chat/completions`;
  }
  if (providerRequest.provider === "groq") {
    return `${stripTrailingSlash(config.groqBaseUrl ?? "https://api.groq.com/openai/v1")}/chat/completions`;
  }
  if (providerRequest.provider === "ollama") {
    return `${stripTrailingSlash(config.ollamaBaseUrl ?? "http://127.0.0.1:11434")}/api/generate`;
  }
  throw new Error(`Unsupported provider "${providerRequest.provider}"`);
}
function resolveProviderHeaders(config, providerRequest) {
  if (providerRequest.provider === "openai") {
    const apiKey = config.openAIApiKey;
    if (!apiKey) {
      throw new AIAdapterTransportError({
        provider: providerRequest.provider,
        message: 'OpenAI transport requires "OPENAI_API_KEY"'
      });
    }
    return {
      ...providerRequest.headers,
      authorization: `Bearer ${apiKey}`
    };
  }
  if (providerRequest.provider === "anthropic") {
    const apiKey = config.anthropicApiKey;
    if (!apiKey) {
      throw new AIAdapterTransportError({
        provider: providerRequest.provider,
        message: 'Anthropic transport requires "ANTHROPIC_API_KEY"'
      });
    }
    return {
      ...providerRequest.headers,
      "x-api-key": apiKey,
      "anthropic-version": config.anthropicVersion ?? "2023-06-01"
    };
  }
  if (providerRequest.provider === "gemini") {
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
      throw new AIAdapterTransportError({
        provider: providerRequest.provider,
        message: 'Gemini transport requires "GEMINI_API_KEY"'
      });
    }
    return {
      ...providerRequest.headers,
      "x-goog-api-key": apiKey
    };
  }
  if (providerRequest.provider === "deepseek") {
    const apiKey = config.deepSeekApiKey;
    if (!apiKey) {
      throw new AIAdapterTransportError({
        provider: providerRequest.provider,
        message: 'DeepSeek transport requires "DEEPSEEK_API_KEY"'
      });
    }
    return {
      ...providerRequest.headers,
      authorization: `Bearer ${apiKey}`
    };
  }
  if (providerRequest.provider === "groq") {
    const apiKey = config.groqApiKey;
    if (!apiKey) {
      throw new AIAdapterTransportError({
        provider: providerRequest.provider,
        message: 'Groq transport requires "GROQ_API_KEY"'
      });
    }
    return {
      ...providerRequest.headers,
      authorization: `Bearer ${apiKey}`
    };
  }
  return {
    ...providerRequest.headers
  };
}
function readResponseBody(response) {
  return Effect118.tryPromise({
    try: () => response.text(),
    catch: () => ""
  }).pipe(
    Effect118.map((value) => typeof value === "string" ? value : ""),
    Effect118.orElseSucceed(() => "")
  );
}
function stripTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
function renderTestResponse(providerRequest) {
  if (providerRequest.metadata?.purpose === "reasoning-extraction") {
    const body = providerRequest.body;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const systemMessage = messages.find((message) => message.role === "system");
    const systemContent = typeof systemMessage?.content === "string" ? systemMessage.content : "";
    if (systemContent.includes("Brazilian Portuguese") || systemContent.includes("pt-BR")) {
      return JSON.stringify(TEST_REASONING_EXTRACTION_FIXTURE_PT);
    }
    return JSON.stringify(TEST_REASONING_EXTRACTION_FIXTURE);
  }
  if (providerRequest.metadata?.purpose === "argument-development-extraction") {
    const body = providerRequest.body;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const systemMessage = messages.find((message) => message.role === "system");
    const systemContent = typeof systemMessage?.content === "string" ? systemMessage.content : "";
    if (systemContent.includes("Brazilian Portuguese") || systemContent.includes("pt-BR")) {
      return JSON.stringify(TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE_PT);
    }
    return JSON.stringify(TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE);
  }
  if (providerRequest.metadata?.purpose === "voice-signature-reconciliation") {
    return JSON.stringify({
      core: TEST_REASONING_EXTRACTION_FIXTURE_PT.core,
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE_PT.development,
      formatExpressions: TEST_REASONING_EXTRACTION_FIXTURE_PT.formatExpressions
    });
  }
  if (providerRequest.metadata?.purpose === "voice-judge") {
    return JSON.stringify({
      score: 82,
      rationale: "Candidate matches the author's observational reasoning and moderate certainty."
    });
  }
  const bodyMessages = Array.isArray(providerRequest.body.messages) ? providerRequest.body.messages : [];
  const lastMessage = bodyMessages.at(-1);
  const content = typeof lastMessage?.content === "string" ? lastMessage.content : providerRequest.model;
  return `provider:${providerRequest.provider}:${content}`;
}
function createProviderTimeoutSignal(signal, providerRequest) {
  const timeoutMs = typeof providerRequest.metadata.timeoutMs === "number" ? providerRequest.metadata.timeoutMs : void 0;
  if (!timeoutMs || timeoutMs <= 0 || typeof AbortController === "undefined") {
    return signal;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal.addEventListener?.("abort", () => controller.abort(), { once: true });
  controller.signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  return controller.signal;
}

// src/product/voice/voice-service.ts
import { Effect as Effect126 } from "effect";

// src/product/voice/voice-batches.ts
import { Effect as Effect121 } from "effect";

// src/product/voice/voice-shared.ts
import { Effect as Effect119 } from "effect";
function normalizeOptional(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : void 0;
}
function buildExampleId(userId, nextIndex) {
  return `voice-example:${userId}:${nextIndex}`;
}
function validateVoiceExampleInput(input) {
  if (input.text.trim().length === 0) {
    return Effect119.fail(
      new VoiceExampleValidationError({
        reasonCode: "invalid_example_payload",
        field: "text",
        message: "Voice example text cannot be empty"
      })
    );
  }
  return Effect119.succeed(void 0);
}
function resolveContentTypeHints(explicitContentType, channel) {
  const hints = /* @__PURE__ */ new Set();
  if (explicitContentType) {
    hints.add(explicitContentType);
  }
  if (channel === "linkedin") {
    hints.add("linkedin-post");
  }
  if (channel === "newsletter") {
    hints.add("newsletter");
  }
  if (channel === "blog") {
    hints.add("long-form-blog");
  }
  return [...hints];
}
function buildInitialEvaluation(args) {
  const tooShort = args.text.trim().length < 80;
  const state = args.state ?? "active";
  const contributionCode = resolveContributionCode(args);
  return {
    systemWeight: args.pinned ? 1 : tooShort ? 0.35 : 0.6,
    attentionLevel: resolveAttentionLevel(tooShort, state),
    attentionReasonCodes: [],
    contributionCode,
    contributionPreview: resolveContributionPreview(contributionCode),
    userPinned: args.pinned
  };
}
function resolveAttentionLevel(tooShort, state) {
  if (state === "excluded") {
    return "high";
  }
  if (tooShort) {
    return "medium";
  }
  return "low";
}
function enforcePinnedLimits(examples, userId, requestedPinned, explicitContentType) {
  if (!requestedPinned) {
    return Effect119.succeed(void 0);
  }
  const activeExamples = examples.filter((example) => example.state === "active");
  const nextPinnedCount = activeExamples.filter((example) => example.pinned).length + 1;
  const pinnedLimit = resolvePinnedLimit(activeExamples.length + 1);
  if (nextPinnedCount > pinnedLimit) {
    return Effect119.fail(
      new VoicePinnedLimitExceededError({
        userId,
        attemptedPinnedCount: nextPinnedCount,
        pinnedLimit
      })
    );
  }
  if (activeExamples.length + 1 >= 15 && explicitContentType) {
    const sameContentTypePinnedCount = activeExamples.filter(
      (example) => example.pinned && (example.explicitContentType === explicitContentType || example.effectiveContentTypeHints.includes(explicitContentType))
    ).length;
    if (sameContentTypePinnedCount >= 2) {
      return Effect119.fail(
        new VoicePinnedLimitExceededError({
          userId,
          attemptedPinnedCount: sameContentTypePinnedCount + 1,
          pinnedLimit: 2
        })
      );
    }
  }
  return Effect119.succeed(void 0);
}
function resolvePinnedLimit(totalExamples) {
  if (totalExamples >= 15) {
    return 5;
  }
  if (totalExamples >= 10) {
    return 4;
  }
  if (totalExamples >= 5) {
    return 2;
  }
  return 1;
}
function resolveTargetProfileVersion(database, userId) {
  return Effect119.gen(function* () {
    const diagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);
    if (diagnostics?.pendingVersion) {
      return diagnostics.pendingVersion;
    }
    if (diagnostics) {
      return diagnostics.activeVersion + 1;
    }
    const profile = yield* database.voiceProfiles.getByUser(userId);
    if (profile) {
      return profile.profileVersion + 1;
    }
    return 1;
  });
}
function toVoiceExampleDraft(input) {
  return {
    text: input.text,
    language: input.language,
    channel: input.channel,
    format: input.format,
    explicitContentType: input.explicitContentType,
    context: input.context,
    antiPatternsExplicit: input.antiPatternsExplicit,
    userLabels: input.userLabels,
    pinned: input.pinned,
    performance: input.performance ? {
      channel: input.performance.channel,
      publishedAt: input.performance.publishedAt,
      selfRating: input.performance.selfRating,
      likes: input.performance.likes,
      comments: input.performance.comments
    } : void 0
  };
}
function resolveContributionCode(example) {
  if (example.explicitContentType === "linkedin-post" || example.channel === "linkedin") {
    return "useful_for_linkedin";
  }
  if (example.explicitContentType === "newsletter" || example.channel === "newsletter") {
    return "useful_for_newsletter";
  }
  if (example.explicitContentType === "long-form-blog" || example.channel === "blog") {
    return "useful_for_blog";
  }
  if (/\b(eu|minha|minhas|meu|meus)\b/i.test(example.text)) {
    return "supports_first_person_voice";
  }
  return "reinforces_informal_tone";
}
function resolveContributionPreview(code) {
  switch (code) {
    case "useful_for_linkedin":
      return "\xDAtil para LinkedIn.";
    case "useful_for_newsletter":
      return "\xDAtil para newsletter.";
    case "useful_for_blog":
      return "\xDAtil para blog.";
    case "supports_first_person_voice":
      return "Sustenta escrita em primeira pessoa.";
    case "reinforces_formal_tone":
      return "Refor\xE7a um tom mais formal.";
    case "redundant_with_recent_examples":
      return "Redundante em rela\xE7\xE3o a exemplos recentes.";
    case "signals_negative_pattern":
      return "Sinaliza um padr\xE3o a evitar.";
    default:
      return "Refor\xE7a um tom mais informal.";
  }
}

// src/product/voice/voice-mappers.ts
function toVoiceProfileView(profile) {
  return {
    userId: profile.userId,
    snapshotId: profile.snapshotId,
    version: profile.version,
    confidence: profile.confidence,
    adaptationMode: profile.adaptationMode,
    primaryLanguage: profile.primaryLanguage,
    tone: profile.tone,
    cadence: profile.cadence,
    description: profile.description,
    lexicon: [...profile.lexicon],
    constraints: [...profile.constraints],
    styleMarkers: [...profile.styleMarkers],
    rules: [...profile.rules],
    antiPatterns: [...profile.antiPatterns]
  };
}
function toVoiceProfileDiagnosticsView(diagnostics) {
  return {
    updating: diagnostics.updating,
    activeVersion: diagnostics.activeVersion,
    pendingVersion: diagnostics.pendingVersion,
    summary: diagnostics.summary,
    reasonCodes: [...diagnostics.reasonCodes],
    nextActionCodes: [...diagnostics.nextActionCodes],
    bestCoveredContentTypes: diagnostics.bestCoveredContentTypes.map((item) => ({
      contentType: item.contentType,
      coverage: item.coverage,
      reasonCodes: [...item.reasonCodes]
    })),
    underrepresentedContentTypes: diagnostics.underrepresentedContentTypes.map((item) => ({
      contentType: item.contentType,
      coverage: item.coverage,
      reasonCodes: [...item.reasonCodes]
    })),
    pendingRebuild: {
      status: diagnostics.pendingRebuild.status,
      reasonCode: diagnostics.pendingRebuild.reasonCode,
      nextActionCodes: [...diagnostics.pendingRebuild.nextActionCodes]
    },
    ...diagnostics.traitConfirmations ? {
      traitConfirmations: Object.fromEntries(
        Object.entries(diagnostics.traitConfirmations).map(([key, value]) => [key, { ...value }])
      )
    } : {}
  };
}
function toVoiceProfileScreenView(profile, diagnostics, options) {
  return {
    profile: toVoiceProfileView(profile),
    diagnostics: toVoiceProfileDiagnosticsView(diagnostics),
    materialBase: {
      ...diagnostics.materialBase,
      byClassification: { ...diagnostics.materialBase.byClassification },
      byContentType: { ...diagnostics.materialBase.byContentType },
      byLanguage: { ...diagnostics.materialBase.byLanguage }
    },
    ...options?.includeReasoning && profile.coreReasoningSignature ? {
      reasoning: toVoiceReasoningPresentationView(profile, {
        activeExamples: diagnostics.materialBase.activeExamples,
        traitConfirmations: diagnostics.traitConfirmations
      })
    } : {}
  };
}
function toVoiceReasoningPresentationView(profile, options) {
  if (!profile.coreReasoningSignature) {
    return void 0;
  }
  const formatExpressions = Object.values(profile.formatExpressionProfiles ?? {}).map(
    (expression) => ({ ...expression })
  );
  const rawTraitProfile = profile.argumentDevelopmentSignature?.traitProfile;
  const traitProfile = rawTraitProfile ? overlayTraitConfirmations(rawTraitProfile, options?.traitConfirmations) : void 0;
  return {
    core: { ...profile.coreReasoningSignature, derivedAntiPatterns: [...profile.coreReasoningSignature.derivedAntiPatterns] },
    formatExpressions,
    reasoningVersion: profile.version,
    ...profile.argumentDevelopmentSignature ? {
      development: {
        ...profile.argumentDevelopmentSignature,
        moveLabels: [...profile.argumentDevelopmentSignature.moveLabels],
        structuralAntiPatterns: [...profile.argumentDevelopmentSignature.structuralAntiPatterns],
        transitionTendencies: profile.argumentDevelopmentSignature.transitionTendencies.map((tendency) => ({
          ...tendency
        })),
        ...traitProfile ? { traitProfile } : {}
      },
      developmentImmature: typeof options?.activeExamples === "number" && options.activeExamples >= 2 && options.activeExamples < 3,
      ...traitProfile ? { traitProfile } : {}
    } : {}
  };
}
function cloneDevelopmentTraitProfile(traitProfile) {
  const records = TRAIT_KEYS.reduce((acc, key) => {
    const record = traitProfile.records[key];
    acc[key] = {
      ...record,
      evidenceExampleIds: [...record.evidenceExampleIds]
    };
    return acc;
  }, {});
  return {
    traits: { ...traitProfile.traits },
    records
  };
}
function overlayTraitConfirmations(traitProfile, confirmations) {
  if (!confirmations) {
    return cloneDevelopmentTraitProfile(traitProfile);
  }
  const confirmationResponses = Object.fromEntries(
    Object.entries(confirmations).map(([key, record]) => [key, { response: record.response }])
  );
  return mergeTraitConfirmations(traitProfile, confirmationResponses);
}
function toVoiceExampleListItemView(example, version) {
  return {
    exampleId: example.id,
    version,
    state: example.state,
    text: example.text,
    previewText: buildPreviewText(example.text),
    language: example.language,
    channel: example.channel,
    format: example.format,
    explicitContentType: example.explicitContentType,
    effectiveContentTypeHints: [...example.effectiveContentTypeHints],
    classificationLabels: [...example.classificationLabels],
    pinned: example.pinned,
    pendingProfileImpact: example.pendingProfileImpact,
    targetProfileVersion: example.targetProfileVersion,
    evaluation: {
      systemWeight: example.evaluation.systemWeight,
      attentionLevel: example.evaluation.attentionLevel,
      attentionReasonCodes: deriveAttentionReasonCodes(example),
      contributionCode: example.evaluation.contributionCode,
      contributionPreview: example.evaluation.contributionPreview,
      userPinned: example.evaluation.userPinned
    },
    createdAt: example.createdAt,
    updatedAt: example.updatedAt
  };
}
function sortVoiceExamples(items) {
  return [...items].sort((left, right) => {
    const attention = attentionRank(right.evaluation.attentionLevel) - attentionRank(left.evaluation.attentionLevel);
    if (attention !== 0) {
      return attention;
    }
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}
function paginateVoiceExamples(items, limit, offset) {
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    limit,
    offset
  };
}
function toVoiceExampleBatchView(batch) {
  return {
    batchId: batch.id,
    status: batch.status,
    expiresAt: batch.expiresAt,
    acceptedItems: batch.acceptedItems,
    rejectedItems: batch.rejectedItems,
    itemResults: batch.items.map((item) => ({
      clientItemId: item.clientItemId,
      accepted: item.accepted,
      exampleId: item.exampleId,
      reasonCode: item.reasonCode,
      message: item.message
    }))
  };
}
function toVoiceExampleBatchCommitResultView(batch) {
  return {
    batchId: batch.id,
    committedAt: batch.committedAt ?? batch.updatedAt,
    acceptedItems: batch.acceptedItems,
    rejectedItems: batch.rejectedItems,
    targetProfileVersion: batch.targetProfileVersion
  };
}
function buildPreviewText(text) {
  const normalized = text.trim();
  if (normalized.length <= 160) {
    return normalized;
  }
  return `${normalized.slice(0, 157)}...`;
}
function attentionRank(level) {
  switch (level) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}
function deriveAttentionReasonCodes(example) {
  const reasons = [];
  if (example.text.trim().length < 80) {
    reasons.push("too_short");
  }
  if (example.state === "excluded") {
    reasons.push("excluded_from_profile");
  }
  return reasons;
}

// src/product/voice/voice-batch-helpers.ts
import { Effect as Effect120 } from "effect";
function buildBatchId(userId, epochMs) {
  return `voice-batch:${userId}:${epochMs}`;
}
function buildBatchItemResult(batchId, item, index, existingClientItemIds) {
  if (existingClientItemIds.has(item.clientItemId)) {
    return {
      id: `${batchId}:item:${index + 1}`,
      batchId,
      clientItemId: item.clientItemId,
      accepted: false,
      reasonCode: "invalid_example_payload",
      message: "Duplicate clientItemId in batch",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  existingClientItemIds.add(item.clientItemId);
  if (item.input.text.trim().length === 0) {
    return {
      id: `${batchId}:item:${index + 1}`,
      batchId,
      clientItemId: item.clientItemId,
      accepted: false,
      reasonCode: "invalid_example_payload",
      message: "Voice example text cannot be empty",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  return {
    id: `${batchId}:item:${index + 1}`,
    batchId,
    clientItemId: item.clientItemId,
    accepted: true,
    stagedInput: toVoiceExampleDraft(item.input),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function requireOpenBatch(database, userId, batchId, now) {
  return Effect120.gen(function* () {
    const batch = yield* database.voiceExampleBatches.get(batchId);
    if (!batch || batch.userId !== userId) {
      return yield* Effect120.fail(new VoiceBatchNotFoundError({ batchId }));
    }
    if (batch.status !== "open" || batch.expiresAt <= now().toISOString()) {
      return yield* Effect120.fail(
        new VoiceBatchExpiredError({
          batchId,
          expiredAt: batch.expiresAt
        })
      );
    }
    return batch;
  });
}
function commitAcceptedBatchItems(database, userId, batch, targetProfileVersion, now) {
  return Effect120.gen(function* () {
    const existing = yield* database.voiceExamples.listByUser(userId);
    let nextExamples = existing;
    const created = [];
    for (const item of batch.items) {
      if (!item.accepted || !item.stagedInput) {
        continue;
      }
      yield* enforcePinnedLimits(
        nextExamples,
        userId,
        item.stagedInput.pinned ?? false,
        item.stagedInput.explicitContentType
      );
      const example = buildVoiceExampleFromInput(
        userId,
        item.stagedInput,
        nextExamples.length + 1,
        targetProfileVersion,
        now
      );
      const stored = yield* database.voiceExamples.create(example).pipe(Effect120.orDie);
      nextExamples = [...nextExamples, stored];
      created.push({
        clientItemId: item.clientItemId,
        exampleId: stored.id
      });
    }
    return created;
  });
}
function buildVoiceExampleFromInput(userId, input, nextIndex, targetProfileVersion, now) {
  const timestamp = now().toISOString();
  return {
    id: buildExampleId(userId, nextIndex),
    userId,
    text: input.text.trim(),
    language: input.language?.trim() || "pt-BR",
    channel: normalizeOptional(input.channel),
    format: normalizeOptional(input.format),
    explicitContentType: normalizeOptional(input.explicitContentType),
    context: normalizeOptional(input.context),
    state: "active",
    classificationLabels: input.userLabels?.length ? [...input.userLabels] : ["positive"],
    antiPatternsExplicit: input.antiPatternsExplicit ? [...input.antiPatternsExplicit] : [],
    pinned: input.pinned ?? false,
    pendingProfileImpact: true,
    targetProfileVersion,
    effectiveContentTypeHints: resolveContentTypeHints(input.explicitContentType, input.channel),
    evaluation: buildInitialEvaluation({
      text: input.text,
      explicitContentType: input.explicitContentType,
      channel: input.channel,
      pinned: input.pinned ?? false
    }),
    performance: input.performance ? {
      channel: normalizeOptional(input.performance.channel),
      publishedAt: normalizeOptional(input.performance.publishedAt),
      selfRating: input.performance.selfRating,
      likes: input.performance.likes,
      comments: input.performance.comments
    } : void 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
function commitExpiredBatch(database, batch, now, observability, logger, voiceConsent) {
  return Effect120.gen(function* () {
    if (voiceConsent) {
      yield* voiceConsent.assertConsent(batch.userId);
    }
    const { createdExamples, saved } = yield* database.transaction(
      (trxDatabase) => Effect120.gen(function* () {
        const targetProfileVersion = yield* resolveTargetProfileVersion(trxDatabase, batch.userId);
        const createdExamples2 = yield* commitAcceptedBatchItems(trxDatabase, batch.userId, batch, targetProfileVersion, now);
        const itemsByClientId = new Map(createdExamples2.map((item) => [item.clientItemId, item.exampleId]));
        const committedAt = now().toISOString();
        const status = batch.expiresAt <= committedAt ? "expired" : "committed";
        const saved2 = yield* trxDatabase.voiceExampleBatches.save({
          ...batch,
          status,
          committedAt,
          targetProfileVersion,
          updatedAt: committedAt,
          items: batch.items.map(
            (item) => item.accepted ? {
              ...item,
              exampleId: itemsByClientId.get(item.clientItemId) ?? item.exampleId
            } : item
          )
        }).pipe(Effect120.orDie);
        yield* persistBackendAuditEvent(trxDatabase, {
          logicalKey: `voice-batch:${saved2.id}:auto-committed:${saved2.committedAt ?? saved2.updatedAt}`,
          actorId: "system",
          actorType: "system",
          resourceType: "voice_example_batch",
          resourceId: saved2.id,
          mutationType: "voice_batch.auto_committed",
          occurredAt: saved2.committedAt ?? saved2.updatedAt,
          metadata: {
            createdExamples: createdExamples2.length,
            acceptedItems: saved2.acceptedItems,
            rejectedItems: saved2.rejectedItems,
            status: saved2.status,
            targetProfileVersion: saved2.targetProfileVersion ?? null
          }
        });
        return { createdExamples: createdExamples2, saved: saved2 };
      })
    ).pipe(
      Effect120.catchTag("DatabaseTransactionInvariantError", (error) => Effect120.die(error))
    );
    yield* observability.recordVoiceBatchCommitted({
      userId: batch.userId,
      batchId: saved.id,
      createdExamples: createdExamples.length,
      acceptedItems: saved.acceptedItems,
      expired: true
    });
    logger?.info("Auto-committed expired voice batch", {
      userId: batch.userId,
      batchId: saved.id,
      createdExamples: createdExamples.length,
      expired: true
    });
    return toVoiceExampleBatchCommitResultView(saved);
  });
}
function listAllVoiceBatches(database) {
  return Effect120.sync(() => Object.values(database.snapshot().voiceExampleBatches));
}

// src/product/voice/voice-batches.ts
function createVoiceBatchOperations(database, voiceRebuild, now, observability, logger, voiceConsent) {
  return {
    createBatch(userId, options = {}) {
      return Effect121.gen(function* () {
        const instant = now();
        const timestamp = instant.toISOString();
        const batch = {
          id: buildBatchId(userId, instant.getTime()),
          userId,
          status: "open",
          expiresAt: options.expiresAt ?? new Date(now().getTime() + 30 * 60 * 1e3).toISOString(),
          acceptedItems: 0,
          rejectedItems: 0,
          items: [],
          createdAt: timestamp,
          updatedAt: timestamp
        };
        const created = yield* database.voiceExampleBatches.create(batch).pipe(Effect121.orDie);
        return toVoiceExampleBatchView(created);
      });
    },
    addBatchItems(userId, batchId, items) {
      return Effect121.gen(function* () {
        const batch = yield* requireOpenBatch(database, userId, batchId, now);
        const existingClientItemIds = new Set(batch.items.map((item) => item.clientItemId));
        const additions = items.map(
          (item, index) => buildBatchItemResult(batch.id, item, index, existingClientItemIds)
        );
        const nextBatch = {
          ...batch,
          acceptedItems: batch.acceptedItems + additions.filter((item) => item.accepted).length,
          rejectedItems: batch.rejectedItems + additions.filter((item) => !item.accepted).length,
          items: [...batch.items, ...additions],
          updatedAt: now().toISOString()
        };
        const saved = yield* database.voiceExampleBatches.save({
          ...nextBatch,
          version: batch.version
        }).pipe(Effect121.orDie);
        return toVoiceExampleBatchView(saved);
      });
    },
    commitBatch(userId, batchId) {
      return Effect121.gen(function* () {
        if (voiceConsent) {
          yield* voiceConsent.assertConsent(userId);
        }
        const { createdExamples, saved } = yield* database.transaction(
          (trxDatabase) => Effect121.gen(function* () {
            const batch = yield* requireOpenBatch(trxDatabase, userId, batchId, now);
            const targetProfileVersion = yield* resolveTargetProfileVersion(trxDatabase, userId);
            const createdExamples2 = yield* commitAcceptedBatchItems(trxDatabase, userId, batch, targetProfileVersion, now);
            const itemsByClientId = new Map(createdExamples2.map((item) => [item.clientItemId, item.exampleId]));
            const committedAt = now().toISOString();
            const committedBatch = {
              ...batch,
              status: "committed",
              committedAt,
              targetProfileVersion,
              updatedAt: committedAt,
              items: batch.items.map(
                (item) => item.accepted ? {
                  ...item,
                  exampleId: itemsByClientId.get(item.clientItemId) ?? item.exampleId
                } : item
              )
            };
            const saved2 = yield* trxDatabase.voiceExampleBatches.save({
              ...committedBatch,
              version: batch.version
            }).pipe(Effect121.orDie);
            yield* persistBackendAuditEvent(trxDatabase, {
              logicalKey: `voice-batch:${saved2.id}:committed:${saved2.committedAt ?? saved2.updatedAt}`,
              actorId: userId,
              actorType: "application_user",
              resourceType: "voice_example_batch",
              resourceId: saved2.id,
              mutationType: "voice_batch.committed",
              occurredAt: saved2.committedAt ?? saved2.updatedAt,
              metadata: {
                createdExamples: createdExamples2.length,
                acceptedItems: saved2.acceptedItems,
                rejectedItems: saved2.rejectedItems,
                targetProfileVersion: saved2.targetProfileVersion ?? null
              }
            });
            return { createdExamples: createdExamples2, saved: saved2 };
          })
        ).pipe(
          Effect121.catchTag("DatabaseTransactionInvariantError", (error) => Effect121.die(error))
        );
        if (createdExamples.length > 0) {
          yield* voiceRebuild.schedule(userId);
        }
        yield* observability.recordVoiceBatchCommitted({
          userId,
          batchId: saved.id,
          createdExamples: createdExamples.length,
          acceptedItems: saved.acceptedItems
        });
        logger?.info("Committed voice example batch", {
          userId,
          batchId: saved.id,
          createdExamples: createdExamples.length,
          acceptedItems: saved.acceptedItems
        });
        return toVoiceExampleBatchCommitResultView(saved);
      });
    },
    autoCommitExpiredBatches(userId) {
      return Effect121.gen(function* () {
        if (voiceConsent && userId) {
          yield* voiceConsent.assertConsent(userId);
        }
        const batches = userId ? yield* database.voiceExampleBatches.listByUser(userId) : yield* listAllVoiceBatches(database);
        const expired = batches.filter(
          (batch) => batch.status === "open" && batch.expiresAt <= now().toISOString()
        );
        const committed = yield* Effect121.forEach(
          expired,
          (batch) => commitExpiredBatch(database, batch, now, observability, logger, voiceConsent),
          { concurrency: 1 }
        );
        const affectedUsers = unique3(
          expired.filter((batch) => batch.items.some((item) => item.accepted && item.stagedInput)).map((batch) => batch.userId)
        );
        yield* Effect121.forEach(affectedUsers, (affectedUserId) => voiceRebuild.schedule(affectedUserId), {
          concurrency: 1,
          discard: true
        });
        return committed;
      });
    }
  };
}
function unique3(values) {
  return [...new Set(values)];
}

// src/product/voice/voice-lifecycle-list.ts
import { Effect as Effect122 } from "effect";
function createVoiceLifecycleListOperations(database) {
  return {
    listExamples(userId, options = {}) {
      return Effect122.gen(function* () {
        const examples = yield* database.voiceExamples.listByUser(userId);
        const filtered = filterExamples(examples, options).map((record) => toVoiceExampleListItemView(record, record.version));
        const sorted = sortVoiceExamples(filtered);
        return paginateVoiceExamples(sorted, clampLimit(options.limit), clampOffset(options.offset));
      });
    }
  };
}
function filterExamples(examples, options) {
  return examples.filter((example) => {
    if (options.state && example.state !== options.state) {
      return false;
    }
    if (options.pinned !== void 0 && example.pinned !== options.pinned) {
      return false;
    }
    if (options.contentType) {
      const matchesExplicit = example.explicitContentType === options.contentType;
      const matchesHint = example.effectiveContentTypeHints.includes(options.contentType);
      if (!matchesExplicit && !matchesHint) {
        return false;
      }
    }
    return true;
  });
}
function clampLimit(limit) {
  if (!limit || limit <= 0) {
    return 20;
  }
  return Math.min(limit, 100);
}
function clampOffset(offset) {
  if (!offset || offset < 0) {
    return 0;
  }
  return offset;
}

// src/product/voice/voice-lifecycle-mutations.ts
import { Effect as Effect123 } from "effect";
function createVoiceLifecycleMutationOperations(database, voiceRebuild, now, logger, voiceConsent) {
  return {
    createExample(userId, input) {
      return Effect123.gen(function* () {
        if (voiceConsent) {
          yield* voiceConsent.assertConsent(userId);
        }
        const created = yield* database.transaction(
          (trxDatabase) => Effect123.gen(function* () {
            yield* validateVoiceExampleInput(input);
            const existing = yield* trxDatabase.voiceExamples.listByUser(userId);
            const pinned = input.pinned ?? false;
            yield* enforcePinnedLimits(existing, userId, pinned, input.explicitContentType);
            const timestamp = now().toISOString();
            const targetProfileVersion = yield* resolveTargetProfileVersion(trxDatabase, userId);
            const example = {
              id: buildExampleId(userId, existing.length + 1),
              userId,
              text: input.text.trim(),
              language: input.language?.trim() || "pt-BR",
              channel: normalizeOptional(input.channel),
              format: normalizeOptional(input.format),
              explicitContentType: normalizeOptional(input.explicitContentType),
              context: normalizeOptional(input.context),
              state: "active",
              classificationLabels: input.userLabels?.length ? [...input.userLabels] : ["positive"],
              antiPatternsExplicit: input.antiPatternsExplicit ? [...input.antiPatternsExplicit] : [],
              pinned,
              pendingProfileImpact: true,
              targetProfileVersion,
              effectiveContentTypeHints: resolveContentTypeHints(input.explicitContentType, input.channel),
              evaluation: buildInitialEvaluation({
                text: input.text,
                explicitContentType: input.explicitContentType,
                channel: input.channel,
                pinned
              }),
              performance: input.performance ? {
                channel: normalizeOptional(input.performance.channel),
                publishedAt: normalizeOptional(input.performance.publishedAt),
                selfRating: input.performance.selfRating,
                likes: input.performance.likes,
                comments: input.performance.comments
              } : void 0,
              createdAt: timestamp,
              updatedAt: timestamp
            };
            const stored = yield* trxDatabase.voiceExamples.create(example).pipe(Effect123.orDie);
            yield* persistBackendAuditEvent(trxDatabase, {
              logicalKey: `voice-example:${stored.id}:created:${stored.createdAt}`,
              actorId: userId,
              actorType: "application_user",
              resourceType: "voice_example",
              resourceId: stored.id,
              mutationType: "voice_example.created",
              occurredAt: stored.createdAt,
              metadata: {
                explicitContentType: stored.explicitContentType ?? null,
                pinned: stored.pinned,
                targetProfileVersion: stored.targetProfileVersion
              }
            });
            return stored;
          })
        ).pipe(
          Effect123.catchTag("DatabaseTransactionInvariantError", (error) => Effect123.die(error))
        );
        logger?.info("Stored voice example", {
          userId,
          exampleId: created.id,
          pinned: created.pinned
        });
        yield* voiceRebuild.schedule(userId);
        return toVoiceExampleListItemView(created, created.version);
      });
    },
    updateExample(userId, exampleId, input) {
      return Effect123.gen(function* () {
        if (voiceConsent) {
          yield* voiceConsent.assertConsent(userId);
        }
        const updatedRecord = yield* database.transaction(
          (trxDatabase) => Effect123.gen(function* () {
            const current = yield* trxDatabase.voiceExamples.get(exampleId);
            if (!current || current.userId !== userId) {
              return void 0;
            }
            if (input.text !== void 0 && input.text.trim().length === 0) {
              return yield* Effect123.fail(
                new VoiceExampleValidationError({
                  reasonCode: "invalid_example_payload",
                  field: "text",
                  message: "Voice example text cannot be empty"
                })
              );
            }
            const allExamples = yield* trxDatabase.voiceExamples.listByUser(userId);
            const nextPinned = input.pinned ?? current.pinned;
            yield* enforcePinnedLimits(
              allExamples.filter((example) => example.id !== current.id),
              userId,
              nextPinned,
              input.explicitContentType ?? current.explicitContentType
            );
            const targetProfileVersion = yield* resolveTargetProfileVersion(trxDatabase, userId);
            const updatedDomain = {
              ...current,
              text: input.text?.trim() ?? current.text,
              language: input.language?.trim() ?? current.language,
              channel: input.channel !== void 0 ? normalizeOptional(input.channel) : current.channel,
              format: input.format !== void 0 ? normalizeOptional(input.format) : current.format,
              explicitContentType: input.explicitContentType !== void 0 ? normalizeOptional(input.explicitContentType) : current.explicitContentType,
              context: input.context !== void 0 ? normalizeOptional(input.context) : current.context,
              antiPatternsExplicit: input.antiPatternsExplicit !== void 0 ? [...input.antiPatternsExplicit] : current.antiPatternsExplicit,
              classificationLabels: input.userLabels !== void 0 && input.userLabels.length > 0 ? [...input.userLabels] : current.classificationLabels,
              pinned: nextPinned,
              state: input.state ?? current.state,
              pendingProfileImpact: true,
              targetProfileVersion,
              effectiveContentTypeHints: input.explicitContentType !== void 0 || input.channel !== void 0 ? resolveContentTypeHints(input.explicitContentType ?? current.explicitContentType, input.channel ?? current.channel) : current.effectiveContentTypeHints,
              evaluation: buildInitialEvaluation({
                text: input.text ?? current.text,
                explicitContentType: input.explicitContentType ?? current.explicitContentType,
                channel: input.channel ?? current.channel,
                pinned: nextPinned,
                state: input.state ?? current.state
              }),
              updatedAt: now().toISOString()
            };
            const stored = yield* trxDatabase.voiceExamples.save({
              ...updatedDomain,
              version: current.version
            }).pipe(Effect123.orDie);
            yield* persistBackendAuditEvent(trxDatabase, {
              logicalKey: `voice-example:${stored.id}:updated:${stored.updatedAt}`,
              actorId: userId,
              actorType: "application_user",
              resourceType: "voice_example",
              resourceId: stored.id,
              mutationType: "voice_example.updated",
              occurredAt: stored.updatedAt,
              metadata: {
                state: stored.state,
                explicitContentType: stored.explicitContentType ?? null,
                pinned: stored.pinned,
                targetProfileVersion: stored.targetProfileVersion
              }
            });
            return stored;
          })
        ).pipe(
          Effect123.catchTag("DatabaseTransactionInvariantError", (error) => Effect123.die(error))
        );
        if (!updatedRecord) {
          return void 0;
        }
        logger?.info("Updated voice example", {
          userId,
          exampleId: updatedRecord.id,
          state: updatedRecord.state,
          pinned: updatedRecord.pinned
        });
        yield* voiceRebuild.schedule(userId);
        return toVoiceExampleListItemView(updatedRecord, updatedRecord.version);
      });
    }
  };
}

// src/product/voice/voice-lifecycle.ts
function createVoiceLifecycleOperations(database, voiceRebuild, now, logger, voiceConsent) {
  return {
    ...createVoiceLifecycleListOperations(database),
    ...createVoiceLifecycleMutationOperations(database, voiceRebuild, now, logger, voiceConsent)
  };
}

// src/product/voice/voice-effective-resolution.ts
import { Effect as Effect124 } from "effect";

// src/product/voice/voice-utils.ts
function unique4(values) {
  return [...new Set(values)];
}
function normalizeLanguage(value) {
  return value.trim().toLowerCase();
}

// src/product/voice/voice-resolution-helpers.ts
function buildEffectiveVoiceMetadata(args) {
  return {
    voiceProfileConfidence: args.confidence,
    voiceAdaptationMode: args.adaptationMode,
    voiceProfileVersionUsed: args.profile.profileVersion,
    pendingVoiceProfileVersion: args.diagnostics.pendingVersion,
    voiceProfileSnapshotId: args.snapshotId,
    usedFallbackVoiceProfile: args.usedFallbackVoiceProfile,
    fallbackReasonCode: args.fallbackReasonCode,
    appliedSignals: {
      styleMarkers: args.voiceHints.styleMarkers ?? [],
      rules: args.voiceHints.rules ?? [],
      antiPatterns: args.voiceHints.antiPatterns ?? [],
      ...args.voiceHints.coreReasoningSignature ? {
        reasoningApplied: true,
        certaintyLevel: args.voiceHints.coreReasoningSignature.certaintyLevel,
        conclusionPace: args.voiceHints.coreReasoningSignature.conclusionPace
      } : {},
      ...args.voiceHints.argumentDevelopmentSignature ? {
        developmentApplied: true,
        epistemicPosture: args.voiceHints.argumentDevelopmentSignature.epistemicPosture
      } : {}
    },
    pendingProfileRebuild: {
      status: args.diagnostics.pendingRebuild.status,
      reasonCode: args.diagnostics.pendingRebuild.reasonCode,
      nextActionCodes: [...args.diagnostics.pendingRebuild.nextActionCodes]
    }
  };
}
function resolveAdaptationMode(confidence, usedFallbackVoiceProfile, requestedLanguage, primaryLanguage) {
  if (confidence === "low" || usedFallbackVoiceProfile) {
    return "conservative";
  }
  if (typeof requestedLanguage === "string" && typeof primaryLanguage === "string" && normalizeLanguage(requestedLanguage) !== normalizeLanguage(primaryLanguage)) {
    return "conservative";
  }
  return "standard";
}
function resolveFallbackReasonCode(status) {
  switch (status) {
    case "in_progress":
      return "rebuild_in_progress";
    case "failed":
      return "rebuild_failed";
    default:
      return void 0;
  }
}
function buildVoiceProfileSnapshotId(userId, profileVersion, contentType, timestamp) {
  return `voice-profile-snapshot:${userId}:v${profileVersion}:${contentType}:${timestamp.toISOString()}`;
}

// src/product/voice/voice-presets.ts
function resolveContentTypeVoicePreset(contentType) {
  switch (contentType) {
    case "linkedin-post":
      return {
        constraints: ["preserve user voice", "keep the full post between 130 and 220 words", "prefer 2-4 short paragraphs"],
        lexicon: []
      };
    case "twitter-thread":
      return {
        constraints: ["preserve user voice", "keep each tweet concise", "maintain thread momentum"],
        lexicon: []
      };
    case "newsletter":
      return {
        constraints: ["preserve user voice", "use clear section transitions"],
        lexicon: []
      };
    case "long-form-blog":
      return {
        constraints: ["preserve user voice", "allow longer explanations and sections"],
        lexicon: []
      };
    case "validation-post":
      return {
        constraints: ["preserve user voice", "keep claims tied to supplied evidence"],
        lexicon: []
      };
    case "architecture-post":
      return {
        constraints: ["preserve user voice", "surface explicit tradeoffs and constraints"],
        lexicon: []
      };
    default:
      return {
        constraints: ["preserve user voice"],
        lexicon: []
      };
  }
}

// src/product/voice/voice-hints.ts
function buildVoiceHints(profile, matchingExamples, pinnedMatchingExamples, context, confidence, adaptationMode, domainProfile, options) {
  const preset = resolveContentTypeVoicePreset(context.contentType);
  const reasoningSignatureEnabled = options?.reasoningSignatureEnabled === true;
  const languageMismatch = typeof context.requestedLanguage === "string" && context.requestedLanguage.trim().length > 0 && normalizeLanguage(context.requestedLanguage) !== normalizeLanguage(profile.primaryLanguage);
  const styleMarkers = unique4([
    ...profile.styleMarkers.slice(0, confidence === "low" ? 3 : 6),
    ...pinnedMatchingExamples.flatMap((example) => deriveExampleStyleMarkers(example.text)).slice(0, 2)
  ]);
  const rules = unique4([
    ...profile.rules.slice(0, confidence === "low" ? 3 : 6),
    ...languageMismatch ? ["preserve_target_language"] : []
  ]);
  const derivedAntiPatterns = reasoningSignatureEnabled ? profile.coreReasoningSignature?.derivedAntiPatterns ?? [] : [];
  const antiPatterns = unique4([
    ...profile.antiPatterns.slice(0, confidence === "low" ? 3 : 6),
    ...derivedAntiPatterns,
    ...domainProfile?.domain === "non-technical" ? ["forced tech metaphors unrelated to the topic"] : [],
    ...languageMismatch ? ["language drift"] : []
  ]);
  const explicitFromExamples = unique4(
    matchingExamples.flatMap((example) => example.antiPatternsExplicit ?? [])
  );
  const antiPatternsExplicit = explicitFromExamples;
  const examples = unique4([
    ...pinnedMatchingExamples.map((example) => example.text.trim()),
    ...matchingExamples.filter((example) => !example.pinned).map((example) => example.text.trim())
  ]).slice(0, confidence === "low" ? 3 : 6);
  const profileLexicon = unique4(profile.lexicon);
  const lexicon = filterLexiconForDomain(
    unique4([
      ...profileLexicon.slice(0, confidence === "low" ? 4 : 8),
      ...extractLexicon(matchingExamples, confidence === "low" ? 6 : 12)
    ]).slice(0, confidence === "low" ? 4 : 8),
    domainProfile
  );
  const userLabels = unique4(
    matchingExamples.flatMap((example) => example.classificationLabels ?? [])
  );
  const formatExpressionProfile = profile.formatExpressionProfiles?.[context.contentType];
  return {
    tone: profile.tone,
    cadence: profile.cadence,
    description: profile.description,
    lexicon,
    constraints: unique4([
      ...profile.constraints,
      ...preset.constraints,
      ...confidence === "low" || adaptationMode === "conservative" ? ["prefer_conservative_voice_adaptation"] : [],
      ...languageMismatch ? ["preserve_target_language"] : []
    ]),
    examples,
    antiPatterns,
    antiPatternsExplicit,
    rules,
    styleMarkers,
    userLabels,
    ...reasoningSignatureEnabled && profile.coreReasoningSignature ? {
      coreReasoningSignature: profile.coreReasoningSignature,
      formatExpressionProfile,
      derivedAntiPatterns,
      ...profile.argumentDevelopmentSignature ? { argumentDevelopmentSignature: profile.argumentDevelopmentSignature } : {}
    } : {}
  };
}
function filterLexiconForDomain(lexicon, domainProfile) {
  if (!domainProfile || domainProfile.allowTechnicalLexicon) {
    return lexicon;
  }
  return filterTechLexiconTerms(lexicon);
}
function selectExamplesForContentType(examples, contentType) {
  return [...examples].filter((example) => {
    if (example.explicitContentType === contentType) {
      return true;
    }
    return (example.effectiveContentTypeHints ?? []).includes(contentType);
  }).sort((left, right) => {
    const pinnedRank = Number(right.pinned) - Number(left.pinned);
    if (pinnedRank !== 0) {
      return pinnedRank;
    }
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}
function deriveExampleStyleMarkers(text) {
  const normalized = text.toLowerCase();
  const markers = [];
  if (normalized.includes("\n\n")) {
    markers.push("short paragraphs");
  }
  if (/\b(eu|minha|minhas|meu|meus)\b/i.test(text)) {
    markers.push("first-person narrative");
  }
  if (text.length < 180) {
    markers.push("direct opening");
  }
  return markers;
}
var LEXICON_STOPWORDS = /* @__PURE__ */ new Set([
  "para",
  "com",
  "uma",
  "como",
  "mais",
  "isso",
  "essa",
  "esse",
  "sobre",
  "quando",
  "muito",
  "pouco",
  "entre",
  "depois",
  "antes",
  "insight",
  "concrete",
  "observation",
  "claro",
  "concreto",
  "espec\xEDfico",
  "especifico"
]);
function extractLexicon(examples, limit) {
  const frequencies = /* @__PURE__ */ new Map();
  for (const token of examples.flatMap(
    (example) => example.text.toLowerCase().split(/[^\p{L}0-9]+/u).map((value) => value.trim()).filter((value) => value.length > 4 && !LEXICON_STOPWORDS.has(value) && !isTechLexiconTerm(value))
  )) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }
  return [...frequencies.entries()].sort((left, right) => right[1] - left[1]).slice(0, Math.max(1, limit)).map(([token]) => token);
}

// src/product/voice/voice-effective-resolution.ts
function resolveEffectiveVoice(database, userId, context, now, observability, logger, voiceConsent, options) {
  return Effect124.gen(function* () {
    if (voiceConsent) {
      const consentStatus = yield* voiceConsent.getConsentStatus(userId).pipe(
        Effect124.orElseSucceed(() => ({ granted: false, revokedAt: void 0 }))
      );
      if (!consentStatus.granted || consentStatus.revokedAt !== void 0) {
        return void 0;
      }
    }
    const profileRecord = yield* database.voiceProfiles.getByUser(userId);
    const diagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);
    if (!profileRecord || !diagnostics) {
      return void 0;
    }
    const profile = toVoiceProfileDomain(profileRecord);
    const examples = yield* database.voiceExamples.listByUser(userId);
    const activeExamples = examples.filter((example) => example.state === "active");
    const matchingExamples = selectExamplesForContentType(activeExamples, context.contentType);
    const pinnedMatchingExamples = matchingExamples.filter((example) => example.pinned);
    const fallbackReasonCode = resolveFallbackReasonCode(diagnostics.pendingRebuild.status);
    const usedFallbackVoiceProfile = fallbackReasonCode !== void 0;
    const confidence = profile.confidence;
    const adaptationMode = resolveAdaptationMode(
      confidence,
      usedFallbackVoiceProfile,
      context.requestedLanguage,
      profile.primaryLanguage
    );
    const reasoningSignatureEnabled = options?.featureFlags?.isEnabled("voice.reasoningSignatureV1", {
      userId,
      contentType: context.contentType,
      environment: options?.config?.environment
    }) ?? false;
    const voiceHints = buildVoiceHints(
      profile,
      matchingExamples,
      pinnedMatchingExamples,
      context,
      confidence,
      adaptationMode,
      void 0,
      { reasoningSignatureEnabled }
    );
    const snapshotId = buildVoiceProfileSnapshotId(userId, profile.version, context.contentType, now());
    const metadata = buildEffectiveVoiceMetadata({
      profile: {
        profileVersion: profile.version,
        snapshotId: profile.snapshotId,
        confidence: profile.confidence,
        adaptationMode: profile.adaptationMode,
        primaryLanguage: profile.primaryLanguage
      },
      diagnostics,
      context,
      confidence,
      adaptationMode,
      fallbackReasonCode,
      usedFallbackVoiceProfile,
      voiceHints,
      snapshotId
    });
    yield* database.voiceProfileSnapshots.create({
      id: snapshotId,
      userId,
      sourceProfileId: profile.id,
      sourceProfileVersion: profile.version,
      contentType: context.contentType,
      confidence,
      adaptationMode,
      appliedSignals: {
        styleMarkers: voiceHints.styleMarkers ?? [],
        rules: voiceHints.rules ?? [],
        antiPatterns: voiceHints.antiPatterns ?? [],
        ...reasoningSignatureEnabled && voiceHints.coreReasoningSignature ? {
          reasoningApplied: true,
          certaintyLevel: voiceHints.coreReasoningSignature.certaintyLevel,
          conclusionPace: voiceHints.coreReasoningSignature.conclusionPace
        } : {},
        ...reasoningSignatureEnabled && voiceHints.argumentDevelopmentSignature ? {
          developmentApplied: true,
          epistemicPosture: voiceHints.argumentDevelopmentSignature.epistemicPosture,
          ...voiceHints.argumentDevelopmentSignature.traitProfile ? {
            developmentTraitsApplied: true,
            ...voiceHints.argumentDevelopmentSignature.traitProfile.traits.openingMode ? { openingMode: voiceHints.argumentDevelopmentSignature.traitProfile.traits.openingMode } : {},
            ...voiceHints.argumentDevelopmentSignature.traitProfile.traits.closingMode ? { closingMode: voiceHints.argumentDevelopmentSignature.traitProfile.traits.closingMode } : {},
            ...voiceHints.argumentDevelopmentSignature.traitProfile.traits.insightTiming ? { insightTiming: voiceHints.argumentDevelopmentSignature.traitProfile.traits.insightTiming } : {}
          } : {}
        } : {}
      },
      resolutionContext: {
        contentType: context.contentType,
        requestedLanguage: context.requestedLanguage,
        voiceProfileConfidence: confidence,
        voiceAdaptationMode: adaptationMode,
        usedFallbackVoiceProfile,
        reasoningSignatureEnabled
      },
      createdAt: now().toISOString()
    }).pipe(Effect124.orDie);
    yield* observability.recordVoiceSnapshotPersisted({
      userId,
      snapshotId,
      contentType: context.contentType,
      requestedLanguage: context.requestedLanguage,
      voiceProfileVersionUsed: profile.version
    });
    logger?.info("Persisted execution voice snapshot", {
      userId,
      snapshotId,
      contentType: context.contentType,
      requestedLanguage: context.requestedLanguage
    });
    return {
      voiceHints,
      metadata
    };
  });
}

// src/product/voice/trait-confirmation.ts
import { Effect as Effect125 } from "effect";
function recordTraitConfirmation(database, userId, input, now, observability) {
  return Effect125.gen(function* () {
    const diagnosticsRecord = yield* database.voiceProfileDiagnostics.getByUser(userId);
    if (!diagnosticsRecord) {
      return void 0;
    }
    const timestamp = now().toISOString();
    const existingConfirmations = diagnosticsRecord.traitConfirmations ?? {};
    const nextActionCodes = new Set(diagnosticsRecord.nextActionCodes);
    if (input.response === "rejected") {
      for (const code of nextActionCodesForTraitGap(input.traitKey)) {
        nextActionCodes.add(code);
      }
    }
    const diagnostics = {
      ...diagnosticsRecord,
      traitConfirmations: {
        ...existingConfirmations,
        [input.traitKey]: {
          response: input.response,
          recordedAt: timestamp
        }
      },
      nextActionCodes: input.response === "rejected" ? [...nextActionCodes] : [...diagnosticsRecord.nextActionCodes],
      updatedAt: timestamp
    };
    yield* database.voiceProfileDiagnostics.put(diagnostics).pipe(Effect125.orDie);
    const profile = yield* database.voiceProfiles.getByUser(userId);
    if (profile) {
      yield* observability.recordTraitConfirmationRecorded({
        userId,
        traitKey: input.traitKey,
        response: input.response,
        profileVersion: profile.profileVersion
      });
    }
    return toVoiceProfileDiagnosticsView(diagnostics);
  });
}
function nextActionCodesForTraitGap(traitKey) {
  switch (traitKey) {
    case "closingMode":
    case "openingMode":
      return ["review_conflicting_examples"];
    case "usesAnalogies":
      return ["add_examples_from_other_content_types"];
    case "perspectiveShiftDensity":
    case "usesCounterexamples":
    case "selfQuestioning":
    case "insightTiming":
      return ["add_more_examples"];
    default:
      return ["add_more_examples"];
  }
}

// src/product/voice/voice-service.ts
function createBackendVoiceService(database, voiceRebuild, now, observability, logger, voiceConsent, options) {
  const lifecycle = createVoiceLifecycleOperations(database, voiceRebuild, now, logger, voiceConsent);
  const batches = createVoiceBatchOperations(database, voiceRebuild, now, observability, logger, voiceConsent);
  return {
    getProfileScreen(userId) {
      return Effect126.gen(function* () {
        if (voiceConsent) {
          const consentStatus = yield* voiceConsent.getConsentStatus(userId).pipe(
            Effect126.orElseSucceed(() => ({ granted: false, revokedAt: void 0 }))
          );
          if (!consentStatus.granted || consentStatus.revokedAt !== void 0) {
            return void 0;
          }
        }
        const profile = yield* database.voiceProfiles.getByUser(userId);
        const diagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);
        if (!profile || !diagnostics) {
          return void 0;
        }
        return toVoiceProfileScreenView(
          {
            ...profile,
            version: profile.profileVersion
          },
          diagnostics,
          {
            includeReasoning: options?.featureFlags?.isEnabled("voice.reasoningSignatureV1", {
              userId,
              environment: options?.config?.environment
            }) ?? false
          }
        );
      });
    },
    recordTraitConfirmation(userId, input) {
      return recordTraitConfirmation(database, userId, input, now, observability);
    },
    resolveEffectiveVoice(userId, context) {
      return resolveEffectiveVoice(
        database,
        userId,
        context,
        now,
        observability,
        logger,
        voiceConsent,
        options
      );
    },
    ...lifecycle,
    ...batches
  };
}

// src/product/core/observability.ts
import { Effect as Effect127, Ref as Ref3 } from "effect";
var emptyCounters = {
  voice_rebuild_queued: 0,
  voice_rebuild_started: 0,
  voice_rebuild_completed: 0,
  voice_rebuild_failed: 0,
  voice_batch_committed: 0,
  voice_snapshot_persisted: 0,
  voice_refresh_event: 0,
  voice_judge_invoked: 0,
  voice_judge_fallback: 0,
  voice_reasoning_extraction_failed: 0,
  voice_development_extraction_failed: 0,
  voice_signature_reconciliation_invoked: 0,
  voice_signature_reconciliation_skipped: 0,
  voice_signature_reconciliation_failed: 0,
  trait_confidence_computed: 0,
  trait_confirmation_recorded: 0
};
function createBackendObservabilityService(redaction) {
  return Effect127.gen(function* () {
    const stateRef = yield* Ref3.make({
      counters: { ...emptyCounters },
      events: []
    });
    const record = (kind, details) => {
      const safeDetails = redaction ? redaction.redactObject(details).redacted : details;
      return Ref3.update(stateRef, (state) => ({
        counters: {
          ...state.counters,
          [kind]: state.counters[kind] + 1
        },
        events: [
          ...state.events,
          {
            kind,
            occurredAt: (/* @__PURE__ */ new Date()).toISOString(),
            details: safeDetails
          }
        ]
      }));
    };
    const snapshot = () => Ref3.get(stateRef).pipe(
      Effect127.map((state) => ({
        counters: state.counters,
        events: [...state.events]
      }))
    );
    return {
      recordVoiceRebuildQueued: (details) => record("voice_rebuild_queued", details),
      recordVoiceRebuildStarted: (details) => record("voice_rebuild_started", details),
      recordVoiceRebuildCompleted: (details) => record("voice_rebuild_completed", details),
      recordVoiceRebuildFailed: (details) => record("voice_rebuild_failed", details),
      recordVoiceBatchCommitted: (details) => record("voice_batch_committed", details),
      recordVoiceSnapshotPersisted: (details) => record("voice_snapshot_persisted", details),
      recordVoiceRefreshEvent: (details) => record("voice_refresh_event", details),
      recordVoiceJudgeInvoked: (details) => record("voice_judge_invoked", details),
      recordVoiceJudgeFallback: (details) => record("voice_judge_fallback", details),
      recordVoiceReasoningExtractionFailed: (details) => record("voice_reasoning_extraction_failed", details),
      recordVoiceDevelopmentExtractionFailed: (details) => record("voice_development_extraction_failed", details),
      recordVoiceSignatureReconciliationInvoked: (details) => record("voice_signature_reconciliation_invoked", details),
      recordVoiceSignatureReconciliationSkipped: (details) => record("voice_signature_reconciliation_skipped", details),
      recordVoiceSignatureReconciliationFailed: (details) => record("voice_signature_reconciliation_failed", details),
      recordTraitConfidenceComputed: (details) => record("trait_confidence_computed", details),
      recordTraitConfirmationRecorded: (details) => record("trait_confirmation_recorded", details),
      snapshot
    };
  });
}

// src/auth/application-user-memory.ts
import { Effect as Effect128 } from "effect";
function createBackendApplicationUserMemoryRepository() {
  const store = /* @__PURE__ */ new Map();
  const indexBySubject = /* @__PURE__ */ new Map();
  return {
    findByExternalSubject(externalSubject) {
      return Effect128.sync(() => {
        const id = indexBySubject.get(externalSubject);
        if (!id) return void 0;
        return store.get(id);
      });
    },
    create(args) {
      return Effect128.sync(() => {
        const now = args.createdAt ?? /* @__PURE__ */ new Date();
        const user = {
          id: args.id,
          externalSubject: args.externalSubject,
          status: args.status ?? "active",
          createdAt: now,
          updatedAt: args.updatedAt ?? now
        };
        store.set(user.id, user);
        indexBySubject.set(user.externalSubject, user.id);
        return user;
      });
    },
    findById(id) {
      return Effect128.sync(() => store.get(id));
    }
  };
}

// src/auth/operator-memory.ts
import { Effect as Effect129 } from "effect";
function createBackendOperatorMemoryRepository() {
  const store = /* @__PURE__ */ new Map();
  return {
    findById(id) {
      return Effect129.sync(() => store.get(id));
    },
    create(args) {
      return Effect129.sync(() => {
        const operator = {
          id: args.id,
          permissions: args.permissions ?? [],
          roles: args.roles ?? [],
          status: args.status ?? "active"
        };
        store.set(operator.id, operator);
        return operator;
      });
    }
  };
}

// src/infra/postgres-repositories/postgres-application-user-repository.ts
import { Effect as Effect130 } from "effect";
function parseApplicationUser(row) {
  return {
    id: row.id,
    externalSubject: row.external_subject,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
function createPostgresApplicationUserRepository(db) {
  return {
    findByExternalSubject(externalSubject) {
      return Effect130.gen(function* () {
        const row = yield* Effect130.tryPromise({
          try: () => db.selectFrom("application_users").where("external_subject", "=", externalSubject).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect130.catchAll(() => Effect130.succeed(void 0)));
        return row ? parseApplicationUser(row) : void 0;
      }).pipe(Effect130.orDie);
    },
    create(args) {
      return Effect130.gen(function* () {
        const createdAt = args.createdAt ?? /* @__PURE__ */ new Date();
        const updatedAt = args.updatedAt ?? createdAt;
        const row = {
          id: args.id,
          external_subject: args.externalSubject,
          status: args.status ?? "active",
          created_at: createdAt.toISOString(),
          updated_at: updatedAt.toISOString()
        };
        yield* Effect130.tryPromise({
          try: () => db.insertInto("application_users").values(row).execute(),
          catch: (error) => error
        }).pipe(Effect130.orDie);
        return parseApplicationUser(row);
      }).pipe(Effect130.orDie);
    },
    findById(id) {
      return Effect130.gen(function* () {
        const row = yield* Effect130.tryPromise({
          try: () => db.selectFrom("application_users").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect130.catchAll(() => Effect130.succeed(void 0)));
        return row ? parseApplicationUser(row) : void 0;
      }).pipe(Effect130.orDie);
    }
  };
}

// src/infra/postgres-repositories/postgres-operator-repository.ts
import { Effect as Effect131 } from "effect";
function parseJsonArray(value) {
  if (typeof value !== "string") {
    return [...value];
  }
  const parsed = JSON.parse(value);
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
}
function parseOperator(row) {
  return {
    id: row.id,
    permissions: parseJsonArray(row.permissions),
    roles: parseJsonArray(row.roles),
    status: row.status
  };
}
function createPostgresOperatorRepository(db) {
  return {
    findById(id) {
      return Effect131.gen(function* () {
        const row = yield* Effect131.tryPromise({
          try: () => db.selectFrom("operators").where("id", "=", id).selectAll().executeTakeFirst(),
          catch: () => void 0
        }).pipe(Effect131.catchAll(() => Effect131.succeed(void 0)));
        return row ? parseOperator(row) : void 0;
      }).pipe(Effect131.orDie);
    },
    create(args) {
      return Effect131.gen(function* () {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const operator = {
          id: args.id,
          permissions: args.permissions ?? [],
          roles: args.roles ?? [],
          status: args.status ?? "active"
        };
        yield* Effect131.tryPromise({
          try: () => db.insertInto("operators").values({
            id: operator.id,
            permissions: JSON.stringify(operator.permissions),
            roles: JSON.stringify(operator.roles),
            status: operator.status,
            created_at: now,
            updated_at: now
          }).execute(),
          catch: (error) => error
        }).pipe(Effect131.orDie);
        return operator;
      }).pipe(Effect131.orDie);
    }
  };
}

// src/infra/redis-client.ts
import { Redis } from "ioredis";
var sharedRedis;
function createRedisClient(config) {
  if (!config.redisUrl) {
    throw new Error("REDIS_URL is required for durable runtime");
  }
  return new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false
  });
}
function getSharedRedisClient(config) {
  if (!sharedRedis) {
    sharedRedis = createRedisClient(config);
  }
  return sharedRedis;
}

// src/runtime/redis-rate-limit-store.ts
import { Effect as Effect132 } from "effect";
function createRedisTrafficLimitStore(redis) {
  return {
    increment(key, ttlMs) {
      return Effect132.tryPromise({
        try: async () => {
          const redisKey = `traffic:${key}`;
          const count = await redis.incr(redisKey);
          if (count === 1) {
            await redis.pexpire(redisKey, ttlMs);
          }
          return count;
        },
        catch: () => 1
      }).pipe(Effect132.catchAll(() => Effect132.succeed(1)));
    }
  };
}

// src/product/core/services.ts
function createBackendProductServices(config, options = {}) {
  return Effect133.gen(function* () {
    const now = options.now ?? (() => /* @__PURE__ */ new Date());
    const dependencies = yield* createBackendProductDependencies(config, now, {
      database: options.database
    });
    const redaction = dependencies.redaction;
    const safeLogger = options.logger ? redaction.createRedactedLogger(options.logger) : void 0;
    const observability = yield* createBackendObservabilityService(redaction);
    const policyVersion = (yield* dependencies.safetyPolicy.getActivePolicy()).version;
    const policyEvidence = createBackendPolicyEvidenceService({
      database: dependencies.database,
      policyVersion,
      redaction
    });
    const operationalOverride = createBackendOperationalOverrideService({
      database: dependencies.database,
      now,
      safetyPolicy: dependencies.safetyPolicy,
      policyEvidence,
      redaction
    });
    const voiceConsent = createBackendVoiceConsentService({ database: dependencies.database, now, policyEvidence });
    const voiceRebuild = createBackendVoiceRebuildService(
      dependencies.database,
      now,
      observability,
      safeLogger,
      voiceConsent,
      {
        aiAdapters: dependencies.aiAdapters,
        providerTransport: options.providerTransport ?? createBackendProviderTransport(config),
        featureFlags: dependencies.featureFlags,
        aiPolicy: dependencies.aiPolicy,
        config
      }
    );
    const postgresDatabase = config.databaseUrl ? getPostgresDatabase(dependencies.rawDatabase) : void 0;
    const inputSafety = createBackendPublicInputSafetyGatewayService({
      safetyPolicy: dependencies.safetyPolicy,
      policyEvidence
    });
    const users = postgresDatabase ? createPostgresApplicationUserRepository(postgresDatabase) : createBackendApplicationUserMemoryRepository();
    const operators = postgresDatabase ? createPostgresOperatorRepository(postgresDatabase) : createBackendOperatorMemoryRepository();
    return {
      ...dependencies,
      observability,
      persistence: createBackendPersistence(dependencies.database, now),
      aiPolicy: dependencies.aiPolicy,
      experimentalAIPolicy: dependencies.experimentalAIPolicy,
      safetyPolicy: dependencies.safetyPolicy,
      inputSafety,
      outputSafety: createBackendOutputReleaseGateService({
        safetyPolicy: dependencies.safetyPolicy,
        policyEvidence
      }),
      usagePolicy: createBackendUsagePolicy({
        billing: dependencies.billing,
        featureFlagRegistry: dependencies.featureFlagRegistry,
        config,
        now,
        incrementTraffic: config.redisUrl && !config.allowInMemoryRuntime ? (key) => {
          const store = createRedisTrafficLimitStore(getSharedRedisClient(config));
          return store.increment(key, 864e5);
        } : void 0
      }),
      generationPreview: createBackendGenerationPreviewService({
        config,
        database: dependencies.database,
        billing: dependencies.billing,
        aiPolicy: dependencies.aiPolicy,
        inputSafety
      }),
      voiceRebuild,
      voiceConsent,
      voice: createBackendVoiceService(
        dependencies.database,
        voiceRebuild,
        now,
        observability,
        safeLogger,
        voiceConsent,
        {
          featureFlags: dependencies.featureFlags,
          config
        }
      ),
      policyEvidence,
      operationalOverride,
      redaction,
      users,
      operators
    };
  });
}

// src/cli/billing-activate.ts
var usage = `Usage:
  pnpm --filter @my-ai-orchestrator/backend billing:activate -- --user-id <uuid> [--plan-id pro|free]

Activates a billing subscription and opens the credit cycle when missing.
Requires DATABASE_URL and a built backend (node dist/cli/billing-activate.js).
`;
function readFlag(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return void 0;
  }
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    return void 0;
  }
  return value;
}
async function main() {
  const userId = readFlag("--user-id");
  const planId = readFlag("--plan-id") ?? "pro";
  if (!userId) {
    console.error(usage);
    process.exit(1);
  }
  const config = bootstrapBackendConfig();
  if (!config.databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const services = await Effect134.runPromise(createBackendProductServices(config));
  await Effect134.runPromise(registerBackendBillingPlans(services.billing));
  const entitlement = await Effect134.runPromise(
    activateSubscription(services.billing, {
      userId,
      planId,
      now: () => /* @__PURE__ */ new Date(),
      idempotencyNamespace: "billing-activate-cli"
    })
  );
  console.log(
    JSON.stringify(
      {
        userId: entitlement.userId,
        planId: entitlement.planId,
        tier: entitlement.tier,
        status: entitlement.status,
        activeCycleId: entitlement.activeCycleId,
        availableCredits: entitlement.wallet.availableCredits
      },
      null,
      2
    )
  );
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
//# sourceMappingURL=billing-activate.js.map
