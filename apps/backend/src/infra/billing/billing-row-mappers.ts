import type {
  BillingCycleState,
  BillingGenerationReservation,
  BillingLedgerEntry,
  BillingTopUpPackage
} from "@my-ai-orchestrator/contracts";
import type {
  BillingOperationResult,
  BillingPlanDefinition,
  BillingSubscription,
  BillingUsageRecord
} from "@my-ai-orchestrator/payments";
import type {
  BillingCycleStatesTable,
  BillingLedgerEntriesTable,
  BillingOperationIdempotencyTable,
  BillingPlansTable,
  BillingReservationsTable,
  BillingSubscriptionsTable,
  BillingTopUpPackagesTable,
  BillingUsageRecordsTable
} from "../postgres-tables.js";

export function mapBillingPlanFromRow(row: BillingPlansTable): BillingPlanDefinition {
  return row.data as BillingPlanDefinition;
}

export function mapBillingPlanToRow(
  id: string,
  plan: BillingPlanDefinition
): { id: string; data: Record<string, unknown> } {
  return {
    id,
    data: plan as unknown as Record<string, unknown>
  };
}

export function mapBillingSubscriptionFromRow(row: BillingSubscriptionsTable): BillingSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    status: row.status as BillingSubscription["status"],
    startedAt: row.started_at,
    ...(row.renewed_at ? { renewedAt: row.renewed_at } : {}),
    ...(row.expires_at ? { expiresAt: row.expires_at } : {})
  };
}

export function mapBillingSubscriptionToRow(
  subscription: BillingSubscription
): BillingSubscriptionsTable {
  return {
    id: subscription.id,
    user_id: subscription.userId,
    plan_id: subscription.planId,
    status: subscription.status,
    started_at: subscription.startedAt,
    renewed_at: subscription.renewedAt ?? null,
    expires_at: subscription.expiresAt ?? null
  };
}

export function mapBillingUsageFromRow(row: BillingUsageRecordsTable): BillingUsageRecord {
  return {
    id: row.id,
    userId: row.user_id,
    subscriptionId: row.subscription_id,
    planId: row.plan_id,
    kind: row.kind as BillingUsageRecord["kind"],
    amount: row.amount,
    credits: row.credits,
    createdAt: row.created_at,
    metadata: (row.metadata ?? {}) as Record<string, unknown>
  };
}

export function mapBillingUsageToRow(entry: BillingUsageRecord): BillingUsageRecordsTable {
  return {
    id: entry.id,
    user_id: entry.userId,
    plan_id: entry.planId,
    subscription_id: entry.subscriptionId,
    kind: entry.kind,
    amount: entry.amount,
    credits: entry.credits,
    created_at: entry.createdAt,
    metadata: (entry.metadata ?? {}) as Record<string, unknown>
  };
}

export function mapBillingLedgerFromRow(row: BillingLedgerEntriesTable): BillingLedgerEntry {
  return {
    subscriptionId: row.subscription_id,
    accountId: row.account_id,
    entryType: row.entry_type,
    creditsDelta: row.credits_delta,
    balanceAfter: row.balance_after,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    idempotencyKey: row.idempotency_key,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at
  };
}

export function mapBillingLedgerToRow(entry: BillingLedgerEntry): Omit<BillingLedgerEntriesTable, "id"> {
  return {
    subscription_id: entry.subscriptionId,
    account_id: entry.accountId,
    entry_type: entry.entryType,
    credits_delta: entry.creditsDelta,
    balance_after: entry.balanceAfter,
    reference_type: entry.referenceType,
    reference_id: entry.referenceId,
    idempotency_key: entry.idempotencyKey,
    metadata: entry.metadata as Record<string, unknown>,
    created_at: entry.createdAt
  };
}

export function mapBillingReservationFromRow(
  row: BillingReservationsTable
): BillingGenerationReservation {
  return {
    reservationId: row.reservation_id,
    generationCycleId: row.generation_cycle_id,
    subscriptionId: row.subscription_id,
    accountId: row.account_id,
    qualityMode: row.quality_mode,
    retryCount: row.retry_count,
    reservedCredits: row.reserved_credits,
    status: row.status,
    idempotencyKey: row.idempotency_key,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapBillingReservationToRow(
  reservation: BillingGenerationReservation
): BillingReservationsTable {
  return {
    reservation_id: reservation.reservationId,
    generation_cycle_id: reservation.generationCycleId,
    subscription_id: reservation.subscriptionId,
    account_id: reservation.accountId,
    quality_mode: reservation.qualityMode,
    retry_count: reservation.retryCount,
    reserved_credits: reservation.reservedCredits,
    status: reservation.status,
    idempotency_key: reservation.idempotencyKey,
    metadata: reservation.metadata as Record<string, unknown>,
    created_at: reservation.createdAt,
    updated_at: reservation.updatedAt
  };
}

export function mapBillingCycleStateFromRow(row: BillingCycleStatesTable): BillingCycleState {
  return {
    cycleId: row.cycle_id,
    subscriptionId: row.subscription_id,
    accountId: row.account_id,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    rolloverCredits: row.rollover_credits,
    grantedCredits: row.granted_credits,
    expiredCredits: row.expired_credits
  };
}

export function mapBillingCycleStateToRow(state: BillingCycleState): BillingCycleStatesTable {
  return {
    account_id: state.accountId,
    cycle_id: state.cycleId,
    subscription_id: state.subscriptionId,
    opened_at: state.openedAt,
    closed_at: state.closedAt,
    rollover_credits: state.rolloverCredits,
    granted_credits: state.grantedCredits,
    expired_credits: state.expiredCredits
  };
}

export function mapBillingTopUpPackageFromRow(row: BillingTopUpPackagesTable): BillingTopUpPackage {
  return {
    id: row.id,
    credits: row.credits,
    priceCents: row.price_cents,
    currency: row.currency,
    ...(row.description ? { description: row.description } : {})
  };
}

export function mapBillingTopUpPackageToRow(pkg: BillingTopUpPackage): BillingTopUpPackagesTable {
  return {
    id: pkg.id,
    credits: pkg.credits,
    price_cents: pkg.priceCents,
    currency: pkg.currency,
    description: pkg.description ?? null
  };
}

export function mapBillingIdempotencyToRow(
  operationKey: string,
  result: BillingOperationResult<unknown>
): BillingOperationIdempotencyTable {
  return {
    operation_key: operationKey,
    result: result as unknown as Record<string, unknown>
  };
}
