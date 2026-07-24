import type { BillingGenerationReservation } from "@my-ai-orchestrator/contracts";
import { Effect } from "effect";
import { extractPlanIdFromAccountId, extractUserIdFromAccountId } from "./billing-utils.js";
import {
  createReservationId,
  createSystemClock,
  rememberOperation,
  type BillingServiceRuntimeContext,
  type RememberOperation
} from "./billing-service-runtime.js";
import { calculateDebitForMode, DEFAULT_BILLING_CREDIT_POLICY } from "./credit-policy.js";
import {
  BillingEntitlementNotFoundError,
  BillingInsufficientCreditsError,
  BillingReservationNotFoundError,
  BillingSubscriptionInactiveError
} from "./errors.js";
import { computeEntitlementGate } from "./entitlement.js";
import { appendLedgerEntry, createWalletFromRepository } from "./ledger.js";
import { findSubscription } from "./subscription-lookup.js";
import type { BillingCreditPolicy } from "@my-ai-orchestrator/contracts";
import type {
  BillingCaptureCreditsRequest,
  BillingClock,
  BillingReleaseCreditsRequest,
  BillingRepository,
  BillingReserveCreditsRequest
} from "./types.js";

export type BillingGenerationCreditsContext = {
  readonly repository: BillingRepository;
  readonly clock: BillingClock;
  readonly creditPolicy: BillingCreditPolicy;
  readonly rememberOperation: RememberOperation;
  readonly createReservationId: (generationCycleId: string) => string;
};

export function createBillingGenerationCreditsContext(
  options: Partial<BillingGenerationCreditsContext> & Pick<BillingGenerationCreditsContext, "repository">
): BillingGenerationCreditsContext {
  return {
    clock: createSystemClock(),
    creditPolicy: DEFAULT_BILLING_CREDIT_POLICY,
    rememberOperation,
    createReservationId,
    ...options
  };
}

export function reserveGenerationCredits(ctx: BillingGenerationCreditsContext) {
  return (request: BillingReserveCreditsRequest) =>
    ctx.rememberOperation(ctx.repository, "reserveGenerationCredits", request.idempotencyKey, () =>
      Effect.gen(function* () {
        const subscription = findSubscription(ctx.repository, request.userId, request.planId);
        if (!subscription) {
          return yield* Effect.fail(
            new BillingEntitlementNotFoundError({ userId: request.userId, planId: request.planId })
          );
        }

        const wallet = createWalletFromRepository(ctx.repository, request.userId, request.planId);
        if (!wallet) {
          return yield* Effect.fail(
            new BillingEntitlementNotFoundError({ userId: request.userId, planId: request.planId })
          );
        }

        // Live access mirrors the generation gate (ADR 0006): trial-in-window, past_due,
        // and canceled-in-cycle all reserve credits — not just "active". Credit exhaustion
        // is reported separately below as BillingInsufficientCreditsError.
        const { hasLiveAccess } = computeEntitlementGate({
          status: subscription.status,
          availableCredits: wallet.availableCredits,
          now: ctx.clock.now(),
          trialEndsAt: subscription.trialEndsAt,
          accessUntil: subscription.expiresAt,
          everSubscribed: subscription.everSubscribed
        });
        if (!hasLiveAccess) {
          return yield* Effect.fail(
            new BillingSubscriptionInactiveError({ userId: request.userId, planId: request.planId })
          );
        }

        const debit =
          request.creditPriceOverride ??
          calculateDebitForMode(request.qualityMode, request.retryCount, ctx.creditPolicy);
        if (wallet.availableCredits < debit) {
          return yield* Effect.fail(
            new BillingInsufficientCreditsError({
              userId: request.userId,
              planId: request.planId,
              amount: debit
            })
          );
        }

        appendLedgerEntry(ctx.repository, {
          subscriptionId: subscription.id,
          accountId: wallet.accountId,
          entryType: "reserve",
          creditsDelta: -debit,
          referenceType: "generation_cycle",
          referenceId: request.generationCycleId,
          idempotencyKey: request.idempotencyKey,
          metadata: {
            qualityMode: request.qualityMode,
            retryCount: request.retryCount,
            creditPriceOverride: request.creditPriceOverride,
            ...request.metadata
          },
          createdAt: ctx.clock.now().toISOString()
        });

        const reservation: BillingGenerationReservation = {
          reservationId: ctx.createReservationId(request.generationCycleId),
          generationCycleId: request.generationCycleId,
          subscriptionId: subscription.id,
          accountId: wallet.accountId,
          qualityMode: request.qualityMode,
          retryCount: request.retryCount,
          reservedCredits: debit,
          status: "reserved",
          idempotencyKey: request.idempotencyKey,
          metadata: request.metadata ?? {},
          createdAt: ctx.clock.now().toISOString(),
          updatedAt: ctx.clock.now().toISOString()
        };
        ctx.repository.reservations.set(reservation.reservationId, reservation);
        return reservation;
      })
    );
}

export function captureReservedCredits(ctx: BillingGenerationCreditsContext) {
  return (request: BillingCaptureCreditsRequest) =>
    ctx.rememberOperation(ctx.repository, "captureReservedCredits", request.idempotencyKey, () =>
      Effect.gen(function* () {
        const reservation = ctx.repository.reservations.get(request.reservationId);
        if (!reservation) {
          return yield* Effect.fail(new BillingReservationNotFoundError({ reservationId: request.reservationId }));
        }

        // N3 (cancel-in-flight): a reservation already released by a cancel must not be re-captured
        // by a late worker completion — no-op instead of corrupting the ledger with a second entry.
        if (reservation.status !== "reserved") {
          return reservation;
        }

        const next: BillingGenerationReservation = {
          ...reservation,
          status: "captured",
          updatedAt: ctx.clock.now().toISOString(),
          metadata: {
            ...reservation.metadata,
            ...request.metadata
          }
        };

        ctx.repository.reservations.set(next.reservationId, next);
        appendLedgerEntry(ctx.repository, {
          subscriptionId: next.subscriptionId,
          accountId: next.accountId,
          entryType: "capture",
          creditsDelta: 0,
          referenceType: "generation_cycle",
          referenceId: next.generationCycleId,
          idempotencyKey: request.idempotencyKey,
          metadata: {
            reservationId: next.reservationId,
            reservedCredits: next.reservedCredits,
            ...request.metadata
          },
          createdAt: next.updatedAt
        });

        ctx.repository.usage.push({
          id: `${next.reservationId}:capture`,
          userId: extractUserIdFromAccountId(next.accountId),
          subscriptionId: next.subscriptionId,
          planId: extractPlanIdFromAccountId(next.accountId),
          kind: "generation",
          amount: next.reservedCredits,
          credits: next.reservedCredits,
          createdAt: next.updatedAt,
          metadata: {
            creditPriceOverride:
              typeof next.metadata?.creditPriceOverride === "number" ? next.metadata.creditPriceOverride : undefined,
            qualityMode: next.qualityMode,
            retryCount: next.retryCount,
            reservationId: next.reservationId
          }
        });

        return next;
      })
    );
}

export function releaseReservedCredits(ctx: BillingGenerationCreditsContext) {
  return (request: BillingReleaseCreditsRequest) =>
    ctx.rememberOperation(ctx.repository, "releaseReservedCredits", request.idempotencyKey, () =>
      Effect.gen(function* () {
        const reservation = ctx.repository.reservations.get(request.reservationId);
        if (!reservation) {
          return yield* Effect.fail(new BillingReservationNotFoundError({ reservationId: request.reservationId }));
        }

        // guards a double cancel (or cancel racing a completed capture) from releasing twice.
        if (reservation.status !== "reserved") {
          return reservation;
        }

        const next: BillingGenerationReservation = {
          ...reservation,
          status: "released",
          updatedAt: ctx.clock.now().toISOString(),
          metadata: {
            ...reservation.metadata,
            ...request.metadata
          }
        };

        ctx.repository.reservations.set(next.reservationId, next);
        appendLedgerEntry(ctx.repository, {
          subscriptionId: next.subscriptionId,
          accountId: next.accountId,
          entryType: "release",
          creditsDelta: next.reservedCredits,
          referenceType: "generation_cycle",
          referenceId: next.generationCycleId,
          idempotencyKey: request.idempotencyKey,
          metadata: {
            reservationId: next.reservationId,
            releasedCredits: next.reservedCredits,
            ...request.metadata
          },
          createdAt: next.updatedAt
        });

        return next;
      })
    );
}

export function createGenerationCreditOperations(ctx: BillingServiceRuntimeContext) {
  const generationCtx: BillingGenerationCreditsContext = {
    repository: ctx.repository,
    clock: ctx.clock,
    creditPolicy: ctx.creditPolicy,
    rememberOperation: ctx.rememberOperation,
    createReservationId
  };

  return {
    reserveGenerationCredits: reserveGenerationCredits(generationCtx),
    captureReservedCredits: captureReservedCredits(generationCtx),
    releaseReservedCredits: releaseReservedCredits(generationCtx)
  };
}
