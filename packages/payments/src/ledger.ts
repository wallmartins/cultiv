import type { BillingLedgerEntry, BillingWallet } from "@my-ai-orchestrator/contracts";
import {
  createAccountId,
  extractPlanIdFromAccountId,
  hasFeature,
  isSameUtcDay,
  roundCredits
} from "./billing-utils.js";
import { computeEntitlementGate, deriveEffectiveSubscriptionStatus } from "./entitlement.js";
import type { BillingEntitlement, BillingRepository } from "./types.js";
import { findSubscription, resolveDefaultPlanId } from "./subscription-lookup.js";

export function sumLedger(entries: readonly BillingLedgerEntry[]): number {
  return roundCredits(entries.reduce((total, entry) => total + entry.creditsDelta, 0), "ceil_1_decimal");
}

export function createWalletFromRepository(
  repository: BillingRepository,
  userId: string,
  planId: string
): BillingWallet | undefined {
  const subscription = findSubscription(repository, userId, planId);
  const plan = repository.plans.get(planId);
  if (!subscription) {
    return undefined;
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
    lifetimeGrantedCredits:
      baselineCredits + ledger.filter((entry) => entry.creditsDelta > 0).reduce((total, entry) => total + entry.creditsDelta, 0),
    lifetimeDebitedCredits: Math.abs(
      ledger.filter((entry) => entry.creditsDelta < 0).reduce((total, entry) => total + entry.creditsDelta, 0)
    )
  };
}

export function createEntitlementFromRepository(
  repository: BillingRepository,
  userId: string,
  planId: string = resolveDefaultPlanId(repository),
  referenceDate: Date = new Date()
): BillingEntitlement | undefined {
  const plan = repository.plans.get(planId);
  const subscription = findSubscription(repository, userId, planId);
  if (!plan || !subscription) {
    return undefined;
  }

  const wallet = createWalletFromRepository(repository, userId, planId);
  if (!wallet) {
    return undefined;
  }

  const dailyCreditsRemaining =
    plan.dailyCredits === undefined
      ? null
      : Math.max(
          0,
          plan.dailyCredits -
            repository.usage
              .filter(
                (entry) =>
                  entry.userId === userId && entry.planId === planId && isSameUtcDay(entry.createdAt, referenceDate)
              )
              .reduce((total, entry) => total + entry.credits, 0)
        );

  const effectiveStatus = deriveEffectiveSubscriptionStatus({
    status: subscription.status,
    availableCredits: wallet.availableCredits,
    now: referenceDate,
    trialEndsAt: subscription.trialEndsAt,
    accessUntil: subscription.expiresAt
  });

  const { hasLiveAccess, canGenerate, gate } = computeEntitlementGate({
    status: effectiveStatus,
    availableCredits: wallet.availableCredits,
    now: referenceDate,
    trialEndsAt: subscription.trialEndsAt,
    accessUntil: subscription.expiresAt,
    everSubscribed: subscription.everSubscribed
  });

  return {
    userId,
    planId,
    tier: plan.tier,
    status: effectiveStatus,
    monthlyCreditsRemaining: wallet.availableCredits,
    dailyCreditsRemaining,
    canGenerate,
    canRefine: hasLiveAccess && hasFeature(plan, "content.language.refinement"),
    gate,
    trialEndsAt: subscription.trialEndsAt,
    renewsAt: subscription.renewsAt,
    accessUntil: subscription.expiresAt,
    everSubscribed: subscription.everSubscribed,
    paymentMethod: null, // ponytail: filled by backend route from PostgresBillingGatewayStore
    allowedModels: plan.allowedModels ?? [],
    features: Object.fromEntries(plan.features.map((feature) => [feature.key, feature.enabled])),
    wallet,
    activeCycleId: wallet.activeCycleId
  };
}

export function appendLedgerEntry(
  repository: BillingRepository,
  entry: Omit<BillingLedgerEntry, "balanceAfter">
): BillingLedgerEntry {
  const accountLedger = repository.ledger.filter((candidate) => candidate.accountId === entry.accountId);
  const currentPlan = repository.plans.get(extractPlanIdFromAccountId(entry.accountId));
  const currentBalance =
    accountLedger.length === 0 && !repository.cycleStates.get(entry.accountId) && currentPlan
      ? currentPlan.monthlyCredits
      : accountLedger.reduce((total, candidate) => total + candidate.creditsDelta, 0);

  const next: BillingLedgerEntry = {
    ...entry,
    balanceAfter: roundCredits(currentBalance + entry.creditsDelta, "ceil_1_decimal")
  };
  repository.ledger.push(next);
  return next;
}
