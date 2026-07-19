import { Effect } from "effect";
import { resolveExecutionPresentation, type SyncRunResponse } from "@my-ai-orchestrator/contracts";
import type { BackendExecutionFailedError } from "../http/errors.js";
import {
  captureRuntimeCredits,
  releaseRuntimeCreditsOnError,
  reserveRuntimeCredits
} from "./runtime-billing-flow.js";
import { executeRuntimeAttemptLoop } from "./pipeline/runtime-attempt-loop.js";
import { resolveRuntimeSelectionContext } from "./runtime-selection.js";
import type { ExecutePipelineOptions } from "./runtime-types.js";

export type { ExecutePipelineOptions } from "./runtime-types.js";

export function executeSyncRun(options: ExecutePipelineOptions): Effect.Effect<SyncRunResponse, BackendExecutionFailedError> {
  return Effect.gen(function* () {
    const context = yield* resolveRuntimeSelectionContext(options);
    const billing = options.services.billing;
    const reservedCredits = options.existingCreditReservationId
      ? { reservationId: options.existingCreditReservationId }
      : yield* reserveRuntimeCredits(
          billing,
          context,
          options.plan.pipeline.name,
          options.plan.contentType.id,
          options.now,
          resolveExecutionPresentation(options.request, options.plan.contentType.id).briefingTopic
        );

    const finalized = yield* executeRuntimeAttemptLoop(options, context).pipe(
      Effect.catchAll((error) =>
        releaseRuntimeCreditsOnError(
          billing,
          reservedCredits,
          context,
          options.plan.pipeline.name,
          error
        )
      )
    );

    yield* captureRuntimeCredits(
      billing,
      reservedCredits,
      context,
      options.plan.pipeline.name,
      options.plan.contentType.id,
      finalized.qualityMode
    );

    return finalized;
  });
}
