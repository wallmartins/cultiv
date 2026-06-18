import type { BillingCreditPolicy } from "@my-ai-orchestrator/contracts";
import { Effect } from "effect";
import { clone } from "./billing-utils.js";
import { BillingOperationConflictError } from "./errors.js";
import type {
  BillingClock,
  BillingOperationResult,
  BillingRepository,
  BillingUsageKind
} from "./types.js";

export type RememberOperation = <T, E>(
  repository: BillingRepository,
  operation: string,
  idempotencyKey: string,
  compute: () => Effect.Effect<T, E>
) => Effect.Effect<BillingOperationResult<T>, E | BillingOperationConflictError>;

export function rememberOperation<T, E>(
  repository: BillingRepository,
  operation: string,
  idempotencyKey: string,
  compute: () => Effect.Effect<T, E>
): Effect.Effect<BillingOperationResult<T>, E | BillingOperationConflictError> {
  return Effect.suspend(() => {
    const compositeKey = `${operation}:${idempotencyKey}`;
    const existing = repository.idempotency.get(compositeKey);
    if (existing) {
      return Effect.succeed(clone(existing) as BillingOperationResult<T>);
    }

    return Effect.map(compute(), (value) => {
      const result: BillingOperationResult<T> = {
        operation,
        idempotencyKey,
        value
      };
      repository.idempotency.set(compositeKey, clone(result));
      return result;
    });
  });
}

export function createReservationId(generationCycleId: string): string {
  return `${generationCycleId}:reservation`;
}

export function createUsageId(userId: string, planId: string, kind: BillingUsageKind): string {
  return `${userId}:${planId}:${kind}:${Date.now()}`;
}

export function createSystemClock(): BillingClock {
  return {
    now: () => new Date()
  };
}

export type BillingServiceRuntimeContext = {
  readonly repository: BillingRepository;
  readonly clock: BillingClock;
  readonly creditPolicy: BillingCreditPolicy;
  readonly rememberOperation: RememberOperation;
};
