import { deriveEffectiveSubscriptionStatus } from "./entitlement.js";
import { createWalletFromRepository } from "./ledger.js";
import type { BillingRepository, BillingSubscription } from "./types.js";

export interface LapsedSweepResult {
  readonly subscription: BillingSubscription;
  readonly previousStatus: BillingSubscription["status"];
}

export interface SweepLapsedSubscriptionsOptions {
  readonly now?: () => Date;
  // avisos de purga / fim-de-trial (contract-03 §4) — side-effect hook, sem engine de e-mail aqui.
  readonly onLapse?: (result: LapsedSweepResult) => void;
}

// contract-03 §4 — materializa na coluna a transição que o entitlement já deriva na leitura
// (lazy clock); mantém as duas fontes coerentes e dispara os avisos de fim-de-janela.
export function sweepLapsedSubscriptions(
  repository: BillingRepository,
  options: SweepLapsedSubscriptionsOptions = {}
): readonly LapsedSweepResult[] {
  const now = options.now ?? (() => new Date());
  const referenceDate = now();
  const results: LapsedSweepResult[] = [];

  for (const subscription of repository.subscriptions.values()) {
    if (subscription.status !== "trialing" && subscription.status !== "canceled") {
      continue;
    }

    const wallet = createWalletFromRepository(repository, subscription.userId, subscription.planId);
    const effectiveStatus = deriveEffectiveSubscriptionStatus({
      status: subscription.status,
      availableCredits: wallet?.availableCredits ?? 0,
      now: referenceDate,
      trialEndsAt: subscription.trialEndsAt,
      accessUntil: subscription.expiresAt
    });

    if (effectiveStatus === subscription.status) {
      continue;
    }

    const lapsed: BillingSubscription = { ...subscription, status: effectiveStatus };
    repository.subscriptions.set(lapsed.id, lapsed);

    const result: LapsedSweepResult = { subscription: lapsed, previousStatus: subscription.status };
    results.push(result);
    options.onLapse?.(result);
  }

  return results;
}
