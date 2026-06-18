import type { BillingRepository, BillingSubscription } from "./types.js";

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
