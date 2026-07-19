import { Effect } from "effect";
import {
  BillingEntitlementNotFoundError,
  BillingOperationConflictError,
  BillingPlanNotFoundError
} from "./errors.js";
import type {
  BillingEntitlement,
  BillingServiceContract,
  BillingSubscription
} from "./types.js";
import { createSubscriptionId } from "./subscription-lookup.js";

// ADR 0006 §2 — plano free removido; novos usuários entram no free trial.
export const DEFAULT_TRIAL_PLAN_ID = "trial";
const TRIAL_DURATION_DAYS = 7; // contract-03 §4/Q7 — lapsa em min(pool esgotado, dia 7)

function computeTrialEndsAt(now: Date): string {
  const deadline = new Date(now);
  deadline.setUTCDate(deadline.getUTCDate() + TRIAL_DURATION_DAYS);
  return deadline.toISOString();
}

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
  readonly trialEndsAt?: string;
  readonly everSubscribed?: boolean;
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
      startedAt: request.startedAt ?? request.now().toISOString(),
      trialEndsAt: request.trialEndsAt,
      everSubscribed: request.everSubscribed
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
      planId: DEFAULT_TRIAL_PLAN_ID,
      status: "trialing",
      trialEndsAt: computeTrialEndsAt(options.now()),
      everSubscribed: false,
      now: options.now,
      idempotencyNamespace: options.idempotencyNamespace
    });
  });
}
