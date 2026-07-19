import { Effect } from "effect";
import { BillingPlanInvalidError } from "./errors.js";
import type { BillingPlanDefinition } from "./types.js";

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
  if (plan.prices && (plan.prices.BRL.monthlyCents <= 0 || plan.prices.USD.monthlyCents <= 0)) {
    return Effect.fail(
      new BillingPlanInvalidError({
        planId: plan.id,
        message: `Billing plan "${plan.id}" must have positive monthly prices for BRL and USD`
      })
    );
  }
  return Effect.succeed(plan);
}

export function defineBillingPlan(plan: BillingPlanDefinition): Effect.Effect<BillingPlanDefinition, BillingPlanInvalidError> {
  return validatePlan(plan);
}
