import { Effect } from "effect";
import type { AsyncRunResponse, PipelineRequest } from "@my-ai-orchestrator/contracts";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { BackendExecutionOptions } from "./service-types.js";
import type { ResolvedPricingEnvelope } from "../product/ai-policy/ai-policy-types.js";
import type { BackendExecutionFailedError } from "../http/errors.js";

export function createQueuedRun(
  plan: OrchestrationPlan,
  request: PipelineRequest,
  options: BackendExecutionOptions & {
    readonly pricingEnvelope?: ResolvedPricingEnvelope;
    readonly simulateCredits?: boolean;
  }
): Effect.Effect<AsyncRunResponse, BackendExecutionFailedError> {
  const createdAt = options.now().toISOString();
  return Effect.gen(function* () {
    if (options.runtimeMode === "durable" && options.durableEnqueue) {
      const queued = yield* options.durableEnqueue(request, {
        plan,
        voice: options.voice,
        pricingEnvelope: options.pricingEnvelope,
        simulateCredits: options.simulateCredits
      });

      options.logger?.info("Queued durable backend execution", {
        contentType: queued.contentType,
        estimatedSteps: queued.estimatedSteps
      });

      return queued;
    }

    yield* options.services.persistence.recordExecutionPlan(plan);
    const queued = yield* options.jobStore.createQueuedJob(request, {
      createdAt,
      contentType: plan.contentType.id,
      estimatedSteps: Math.max(1, plan.pipeline.steps.length),
      voice: options.voice ?? undefined
    });

    yield* options.services.persistence.recordQueuedJob({
      jobId: queued.jobId,
      request,
      plan,
      createdAt
    });

    options.onQueuedJob?.({
      jobId: queued.jobId,
      request,
      plan,
      pricingEnvelope: options.pricingEnvelope,
      simulateCredits: options.simulateCredits
    });

    options.logger?.info("Queued backend execution", {
      contentType: queued.contentType,
      estimatedSteps: queued.estimatedSteps
    });

    return queued;
  });
}
