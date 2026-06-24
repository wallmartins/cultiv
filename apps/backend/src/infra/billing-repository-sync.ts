import type { BillingCycleState, BillingGenerationReservation, BillingLedgerEntry } from "@my-ai-orchestrator/contracts";
import type { BillingPlanDefinition, BillingRepository, BillingSubscription, BillingUsageRecord } from "@my-ai-orchestrator/payments";

function userAccountPrefix(userId: string): string {
  return `${userId}:`;
}

export interface BillingUserSlice {
  readonly subscriptions: ReadonlyArray<BillingSubscription>;
  readonly usage: ReadonlyArray<BillingUsageRecord>;
  readonly ledger: ReadonlyArray<BillingLedgerEntry>;
  readonly reservations: ReadonlyArray<BillingGenerationReservation>;
  readonly cycleStates: ReadonlyArray<BillingCycleState>;
  readonly plans: ReadonlyArray<readonly [string, BillingPlanDefinition]>;
}

export function mergeBillingUserSliceInto(
  target: BillingRepository,
  userId: string,
  slice: BillingUserSlice
): void {
  const accountPrefix = userAccountPrefix(userId);

  for (const [subscriptionId, subscription] of target.subscriptions) {
    if (subscription.userId === userId) {
      target.subscriptions.delete(subscriptionId);
    }
  }

  target.usage.splice(
    0,
    target.usage.length,
    ...target.usage.filter((entry) => entry.userId !== userId)
  );
  target.ledger.splice(
    0,
    target.ledger.length,
    ...target.ledger.filter((entry) => !entry.accountId.startsWith(accountPrefix))
  );

  for (const [reservationId, reservation] of target.reservations) {
    if (reservation.accountId.startsWith(accountPrefix)) {
      target.reservations.delete(reservationId);
    }
  }

  for (const accountId of target.cycleStates.keys()) {
    if (accountId.startsWith(accountPrefix)) {
      target.cycleStates.delete(accountId);
    }
  }

  for (const subscription of slice.subscriptions) {
    target.subscriptions.set(subscription.id, subscription);
  }

  target.usage.push(...slice.usage);
  target.ledger.push(...slice.ledger);

  for (const reservation of slice.reservations) {
    target.reservations.set(reservation.reservationId, reservation);
  }

  for (const cycleState of slice.cycleStates) {
    target.cycleStates.set(cycleState.accountId, cycleState);
  }

  for (const [planId, plan] of slice.plans) {
    target.plans.set(planId, plan);
  }
}

export function replaceBillingRepositoryContents(
  target: BillingRepository,
  source: BillingRepository
): void {
  target.plans.clear();
  for (const [key, value] of source.plans) {
    target.plans.set(key, value);
  }

  target.subscriptions.clear();
  for (const [key, value] of source.subscriptions) {
    target.subscriptions.set(key, value);
  }

  target.usage.splice(0, target.usage.length, ...source.usage);
  target.ledger.splice(0, target.ledger.length, ...source.ledger);

  target.topUpPackages.clear();
  for (const [key, value] of source.topUpPackages) {
    target.topUpPackages.set(key, value);
  }

  target.reservations.clear();
  for (const [key, value] of source.reservations) {
    target.reservations.set(key, value);
  }

  target.cycleStates.clear();
  for (const [key, value] of source.cycleStates) {
    target.cycleStates.set(key, value);
  }

  target.idempotency.clear();
  for (const [key, value] of source.idempotency) {
    target.idempotency.set(key, value);
  }
}
