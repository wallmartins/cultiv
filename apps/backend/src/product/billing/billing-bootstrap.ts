import { Effect } from "effect";
import { activateSubscription, createBillingService, DEFAULT_BILLING_PLANS } from "@my-ai-orchestrator/payments";
import { swallowWithDiagnostic } from "../../effects/non-blocking-diagnostics.js";

export function seedUserBillingState(
  billing: ReturnType<typeof createBillingService>,
  config: {
    /** Dev bootstrap only — not used to resolve per-request entitlements. */
    readonly billingPlanId?: string;
    readonly serviceName: string;
    readonly version: string;
  },
  userId: string,
  now: () => Date
): Effect.Effect<void, never> {
  const planId = config.billingPlanId;

  if (!planId) {
    return Effect.void;
  }

  return activateSubscription(billing, {
    userId,
    planId,
    now,
    idempotencyNamespace: config.serviceName,
    cycleId: `${userId}:${planId}:cycle:${config.version}`
  }).pipe(
    Effect.catchAll(
      swallowWithDiagnostic({
        operation: "Failed to seed billing cycle state",
        context: { userId, planId }
      })
    )
  );
}

export function seedBillingState(
  billing: ReturnType<typeof createBillingService>,
  config: {
    readonly billingUserId?: string;
    readonly billingPlanId?: string;
    readonly databaseUrl?: string;
    readonly serviceName: string;
    readonly version: string;
  },
  now: () => Date
): Effect.Effect<void, never> {
  // ponytail: with PostgreSQL, entitlements live in the DB; env seed on boot can clobber paid plans after lazy catalog load
  if (config.databaseUrl) {
    return Effect.void;
  }

  const userId = config.billingUserId ?? config.serviceName;
  return seedUserBillingState(billing, config, userId, now);
}

export function registerBackendBillingPlans(
  billing: ReturnType<typeof createBillingService>
): Effect.Effect<void, never> {
  return Effect.gen(function* () {
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

    if (billing.listTopUpPackages().length === 0) {
      billing.registerTopUpPackage({
        id: "topup_500",
        credits: 500,
        priceCents: 2900,
        currency: "BRL",
        description: "500 credits"
      });
    }
  }).pipe(Effect.catchAll(swallowWithDiagnostic({
    operation: "Failed to register backend billing plans"
  })));
}
