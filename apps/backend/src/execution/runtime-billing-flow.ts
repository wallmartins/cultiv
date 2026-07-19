import { Effect } from "effect";
import type { BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { BackendExecutionFailedError } from "../http/errors.js";
import { createExecutionFailure, normalizeExecutionFailure } from "./pipeline/execution-failure.js";
import type { RuntimeSelectionContext } from "./runtime-types.js";
import {
  captureBackendExecutionCredits,
  ensureBackendBillingSubscription,
  releaseBackendExecutionCredits,
  reserveBackendExecutionCredits
} from "./billing.js";

export interface ReservedRuntimeCredits {
  readonly reservationId: string;
}

export function reserveRuntimeCredits(
  billing: BillingServiceContract,
  context: RuntimeSelectionContext,
  pipelineName: string,
  contentType: string,
  now: () => Date,
  briefingTopic?: string
): Effect.Effect<ReservedRuntimeCredits | undefined, BackendExecutionFailedError> {
  if (!context.billingEnabled) {
    return Effect.succeed(undefined);
  }

  ensureBackendBillingSubscription(billing, context.billingIdentity, now);

  return reserveBackendExecutionCredits(
    billing,
    context.billingIdentity,
    context.selection.qualityMode,
    Math.max(0, context.attempts.length - 1),
    context.pricingEnvelope?.creditPrice,
    {
      pipelineName,
      contentType,
      adapter: context.selection.adapter,
      model: context.selection.model,
      briefingTopic
    }
  ).pipe(
    Effect.map((reservation) => ({
      reservationId: reservation.reservationId
    })),
    Effect.catchAll((error) =>
      Effect.fail(
        normalizeExecutionFailure(error, {
          message: `Failed to reserve runtime credits for pipeline "${pipelineName}"`,
          reason: "unexpected_execution_failure"
        })
      )
    )
  );
}

export function releaseRuntimeCreditsOnError(
  billing: BillingServiceContract,
  reservation: ReservedRuntimeCredits | undefined,
  context: RuntimeSelectionContext,
  pipelineName: string,
  error: unknown
): Effect.Effect<never, BackendExecutionFailedError> {
  const normalized = normalizeExecutionFailure(error, {
    message: `Pipeline "${pipelineName}" failed during runtime execution`,
    reason: "unexpected_execution_failure"
  });

  if (!context.billingEnabled || !reservation) {
    return Effect.fail(normalized);
  }

  return releaseBackendExecutionCredits(
    billing,
    reservation.reservationId,
    context.billingIdentity.generationCycleId,
    {
      pipelineName,
      reason: normalized.message
    }
  ).pipe(
    Effect.catchAll(() =>
      Effect.fail(
        createExecutionFailure({
          message: `Pipeline "${pipelineName}" failed and reserved credits could not be released cleanly: ${normalized.message}`,
          reason: "unexpected_execution_failure"
        })
      )
    ),
    Effect.zipRight(Effect.fail(normalized))
  );
}

export function captureRuntimeCredits(
  billing: BillingServiceContract,
  reservation: ReservedRuntimeCredits | undefined,
  context: RuntimeSelectionContext,
  pipelineName: string,
  contentType: string,
  qualityMode: "fast" | "balanced" | "strict"
): Effect.Effect<void, BackendExecutionFailedError> {
  if (!context.billingEnabled || !reservation) {
    return Effect.succeed(undefined);
  }

  return captureBackendExecutionCredits(
    billing,
    reservation.reservationId,
    context.billingIdentity.generationCycleId,
    {
      pipelineName,
      contentType,
      qualityMode
    }
  ).pipe(
    Effect.asVoid,
    Effect.catchAll((error) =>
      Effect.fail(
        normalizeExecutionFailure(error, {
          message: `Failed to capture runtime credits for pipeline "${pipelineName}"`,
          reason: "unexpected_execution_failure"
        })
      )
    )
  );
}
