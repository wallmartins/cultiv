import type {
  BillingCycleState,
  BillingGenerationReservation,
  BillingLedgerEntry,
  BillingTopUpPackage
} from "@my-ai-orchestrator/contracts";
import type {
  BillingOperationResult,
  BillingPlanDefinition,
  BillingRepository,
  BillingSubscription,
  BillingUsageRecord
} from "./types.js";
import { DEFAULT_BILLING_PLANS } from "./default-plans.js";

export function createBillingRepository(seed: {
  readonly plans?: readonly BillingPlanDefinition[];
  readonly subscriptions?: readonly BillingSubscription[];
  readonly usage?: readonly BillingUsageRecord[];
  readonly ledger?: readonly BillingLedgerEntry[];
  readonly topUpPackages?: readonly BillingTopUpPackage[];
  readonly reservations?: readonly BillingGenerationReservation[];
  readonly cycleStates?: readonly BillingCycleState[];
} = {}): BillingRepository {
  return {
    plans: new Map((seed.plans ?? DEFAULT_BILLING_PLANS).map((plan) => [plan.id, plan] as const)),
    subscriptions: new Map((seed.subscriptions ?? []).map((subscription) => [subscription.id, subscription] as const)),
    usage: [...(seed.usage ?? [])],
    ledger: [...(seed.ledger ?? [])],
    topUpPackages: new Map((seed.topUpPackages ?? []).map((pkg) => [pkg.id, pkg] as const)),
    reservations: new Map((seed.reservations ?? []).map((reservation) => [reservation.reservationId, reservation] as const)),
    cycleStates: new Map((seed.cycleStates ?? []).map((state) => [state.accountId, state] as const)),
    idempotency: new Map<string, BillingOperationResult<unknown>>()
  };
}
