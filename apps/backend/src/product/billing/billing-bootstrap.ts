import { Effect } from "effect";
import { createBillingService } from "@my-ai-orchestrator/payments";
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

  billing.upsertSubscription({
    id: `${userId}:${planId}:subscription`,
    userId,
    planId,
    status: "active",
    startedAt: now().toISOString()
  });

  return billing
    .startCycle({
      userId,
      planId,
      cycleId: `${userId}:${planId}:cycle:${config.version}`,
      idempotencyKey: `${config.serviceName}:${userId}:${planId}:cycle`
    })
    .pipe(Effect.catchAll(swallowWithDiagnostic({
      operation: "Failed to seed billing cycle state",
      context: { userId, planId }
    })));
}

export function seedBillingState(
  billing: ReturnType<typeof createBillingService>,
  config: {
    readonly billingUserId?: string;
    readonly billingPlanId?: string;
    readonly serviceName: string;
    readonly version: string;
  },
  now: () => Date
): Effect.Effect<void, never> {
  const userId = config.billingUserId ?? config.serviceName;
  return seedUserBillingState(billing, config, userId, now);
}

export function registerBackendBillingPlans(
  billing: ReturnType<typeof createBillingService>
): Effect.Effect<void, never> {
  return Effect.gen(function* () {
    for (const plan of billing.listPlans()) {
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
  }).pipe(Effect.catchAll(swallowWithDiagnostic({
    operation: "Failed to register backend billing plans"
  })));
}
