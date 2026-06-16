import { Effect } from "effect";
import type { BillingGenerationReservation, PipelineRequest } from "@my-ai-orchestrator/contracts";
import {
  createBillingRepository,
  createBillingService,
  type BillingCaptureCreditsRequest,
  type BillingReserveCreditsRequest,
  type BillingServiceContract,
  type BillingSubscription
} from "@my-ai-orchestrator/payments";
import type {
  BillingEntitlementNotFoundError,
  BillingInsufficientCreditsError,
  BillingOperationConflictError,
  BillingPlanNotFoundError,
  BillingReservationNotFoundError,
  BillingSubscriptionInactiveError
} from "@my-ai-orchestrator/payments";
import type { BackendConfig } from "../config/config.js";
import { resolveStoredUserPlanId } from "../product/billing/resolve-user-billing.js";

export interface BackendBillingIdentity {
  readonly userId: string;
  readonly planId: string;
  readonly generationCycleId: string;
}

export function createBackendBillingService(): BillingServiceContract {
  return createBillingService({
    repository: createBillingRepository()
  });
}

export function resolveBackendBillingIdentity(
  request: PipelineRequest,
  billing: BillingServiceContract,
  config: BackendConfig,
  fallbackCycleId: string
): BackendBillingIdentity {
  const requestRecord = request as Record<string, unknown>;
  const requestUserId = typeof requestRecord.userId === "string" ? requestRecord.userId : undefined;
  const userId = requestUserId ?? config.billingUserId ?? config.serviceName;

  return {
    userId,
    planId: resolveStoredUserPlanId(billing, userId),
    generationCycleId: request.idempotencyKey ?? fallbackCycleId
  };
}

export function ensureBackendBillingSubscription(
  billing: BillingServiceContract,
  identity: BackendBillingIdentity,
  now: () => Date
): void {
  const subscription: BillingSubscription = {
    id: createSubscriptionId(identity.userId, identity.planId),
    userId: identity.userId,
    planId: identity.planId,
    status: "active",
    startedAt: now().toISOString()
  };

  billing.upsertSubscription(subscription);
}

export function reserveBackendExecutionCredits(
  billing: BillingServiceContract,
  identity: BackendBillingIdentity,
  qualityMode: "fast" | "balanced" | "strict",
  retryCount: number,
  creditPrice: number | undefined,
  metadata: Readonly<Record<string, unknown>>
): Effect.Effect<
  BillingGenerationReservation,
  | BillingPlanNotFoundError
  | BillingEntitlementNotFoundError
  | BillingSubscriptionInactiveError
  | BillingInsufficientCreditsError
  | BillingOperationConflictError
> {
  const request: BillingReserveCreditsRequest = {
    userId: identity.userId,
    planId: identity.planId,
    generationCycleId: identity.generationCycleId,
    qualityMode,
    retryCount,
    ...(creditPrice !== undefined ? { creditPriceOverride: creditPrice } : {}),
    idempotencyKey: `reserve:${identity.generationCycleId}`,
    metadata
  };

  return Effect.map(billing.reserveGenerationCredits(request), (result) => result.value);
}

export function captureBackendExecutionCredits(
  billing: BillingServiceContract,
  reservationId: string,
  generationCycleId: string,
  metadata: Readonly<Record<string, unknown>>
): Effect.Effect<BillingGenerationReservation, BillingReservationNotFoundError | BillingOperationConflictError> {
  const request: BillingCaptureCreditsRequest = {
    reservationId,
    idempotencyKey: `capture:${generationCycleId}`,
    metadata
  };

  return Effect.map(billing.captureReservedCredits(request), (result) => result.value);
}

export function releaseBackendExecutionCredits(
  billing: BillingServiceContract,
  reservationId: string,
  generationCycleId: string,
  metadata: Readonly<Record<string, unknown>>
): Effect.Effect<BillingGenerationReservation, BillingReservationNotFoundError | BillingOperationConflictError> {
  return Effect.map(
    billing.releaseReservedCredits({
      reservationId,
      idempotencyKey: `release:${generationCycleId}`,
      metadata
    }),
    (result) => result.value
  );
}

function createSubscriptionId(userId: string, planId: string): string {
  return `${userId}:${planId}:subscription`;
}
