import type { BillingRepository } from "@my-ai-orchestrator/payments";

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
