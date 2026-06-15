import { Effect } from "effect";
import type { PipelineDefinition, PipelineRequest } from "@my-ai-orchestrator/contracts";
import { BackendAIPolicyCatalogError } from "../../http/errors.js";
import type { AIPolicyPipelineDefinition } from "./ai-policy-types.js";
import { resolvePolicyPipeline } from "./ai-policy-version-index.js";

export function validateExplicitPipelineDefinition(
  policyPipeline: AIPolicyPipelineDefinition,
  pipeline: PipelineDefinition,
  policyVersion: string
): Effect.Effect<void, BackendAIPolicyCatalogError> {
  return Effect.gen(function* () {
    if (pipeline.steps.length !== policyPipeline.steps.length) {
      return yield* Effect.fail(
        new BackendAIPolicyCatalogError({
          policyVersion,
          pipelineName: pipeline.name,
          message: `Pipeline "${pipeline.name}" does not match the policy step count`
        })
      );
    }

    for (const [index, step] of pipeline.steps.entries()) {
      const expected = policyPipeline.steps[index];
      if (!expected || step.name !== expected.name || step.skill !== expected.skill) {
        return yield* Effect.fail(
          new BackendAIPolicyCatalogError({
            policyVersion,
            pipelineName: pipeline.name,
            stepName: step.name,
            message: `Step "${step.name}" is not compatible with the active AI policy`
          })
        );
      }
    }
  });
}

export function validatePipelineRequestAgainstPolicy(args: {
  readonly request: PipelineRequest;
  readonly policy: import("./ai-policy-types.js").ResolvedAIPolicyVersion;
}): Effect.Effect<void, BackendAIPolicyCatalogError> {
  const explicitRequest = "pipeline" in args.request ? args.request : undefined;
  if (!explicitRequest) {
    return Effect.void;
  }

  const requestContentType =
    "contentType" in explicitRequest && typeof explicitRequest.contentType === "string"
      ? explicitRequest.contentType
      : undefined;
  const contentType =
    requestContentType && requestContentType.length > 0 ? requestContentType : explicitRequest.pipeline.name;

  return Effect.gen(function* () {
    const pipeline = yield* resolvePolicyPipeline(args.policy, contentType);
    yield* validateExplicitPipelineDefinition(pipeline, explicitRequest.pipeline, args.policy.version);
  });
}
