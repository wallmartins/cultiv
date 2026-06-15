import { Effect } from "effect";
import { BackendExecutionIntegrityError } from "../../http/errors.js";
import type { ResolvedExecutionSnapshot } from "../../product/ai-policy/ai-policy-types.js";

export function validateTrustedExecutionSnapshot(
  snapshot: ResolvedExecutionSnapshot
): Effect.Effect<void, BackendExecutionIntegrityError> {
  return Effect.gen(function* () {
    if (snapshot.policyVersion.length === 0) {
      return yield* integrityFailure(snapshot, "missing_policy_version", "Execution snapshot is missing a policy version");
    }

    if (snapshot.plan.pipeline.steps.length === 0) {
      return yield* integrityFailure(
        snapshot,
        "empty_pipeline",
        `Pipeline "${snapshot.plan.pipeline.name}" cannot execute without steps`
      );
    }

    if (snapshot.plan.pipeline.name !== snapshot.plan.request.pipelineName) {
      return yield* integrityFailure(
        snapshot,
        "pipeline_name_mismatch",
        `Pipeline "${snapshot.plan.pipeline.name}" does not match normalized request "${snapshot.plan.request.pipelineName}"`,
        { pipelineName: snapshot.plan.pipeline.name }
      );
    }

    if (snapshot.pricingEnvelope.policyVersion !== snapshot.policyVersion) {
      return yield* integrityFailure(
        snapshot,
        "pricing_policy_mismatch",
        `Pricing envelope policy "${snapshot.pricingEnvelope.policyVersion}" does not match execution snapshot policy "${snapshot.policyVersion}"`,
        { pipelineName: snapshot.plan.pipeline.name }
      );
    }

    if (snapshot.pricingEnvelope.contentType !== snapshot.plan.contentType.id) {
      return yield* integrityFailure(
        snapshot,
        "content_type_mismatch",
        `Pricing envelope content type "${snapshot.pricingEnvelope.contentType}" does not match plan content type "${snapshot.plan.contentType.id}"`,
        { pipelineName: snapshot.plan.pipeline.name }
      );
    }

    if (snapshot.pricingEnvelope.qualityMode !== snapshot.plan.request.qualityMode) {
      return yield* integrityFailure(
        snapshot,
        "quality_mode_mismatch",
        `Pricing envelope quality mode "${snapshot.pricingEnvelope.qualityMode}" does not match normalized request "${snapshot.plan.request.qualityMode}"`,
        { pipelineName: snapshot.plan.pipeline.name }
      );
    }

    if (snapshot.pricingEnvelope.creditPrice < 0) {
      return yield* integrityFailure(
        snapshot,
        "invalid_credit_price",
        `Pricing envelope for "${snapshot.plan.contentType.id}" has an invalid negative credit price`,
        { pipelineName: snapshot.plan.pipeline.name }
      );
    }

    if (snapshot.steps.length !== snapshot.plan.pipeline.steps.length) {
      return yield* integrityFailure(
        snapshot,
        "step_count_mismatch",
        `Execution snapshot carries ${snapshot.steps.length} steps but the plan requires ${snapshot.plan.pipeline.steps.length}`,
        { pipelineName: snapshot.plan.pipeline.name }
      );
    }

    for (const [index, step] of snapshot.plan.pipeline.steps.entries()) {
      const policyStep = snapshot.steps[index];
      if (!policyStep || policyStep.name !== step.name || policyStep.skill !== step.skill) {
        return yield* integrityFailure(
          snapshot,
          "step_mismatch",
          `Execution step "${step.name}" does not match the resolved policy snapshot`,
          {
            pipelineName: snapshot.plan.pipeline.name,
            stepName: step.name
          }
        );
      }

      if (policyStep.execution === "llm" && policyStep.attempts.length === 0) {
        return yield* integrityFailure(
          snapshot,
          "step_mismatch",
          `Execution step "${step.name}" is llm but does not carry a provider/model attempt plan`,
          {
            pipelineName: snapshot.plan.pipeline.name,
            stepName: step.name
          }
        );
      }

      if (policyStep.execution === "llm" && (!policyStep.routingProfile || policyStep.fallbackOn.length === 0)) {
        return yield* integrityFailure(
          snapshot,
          "step_mismatch",
          `Execution step "${step.name}" is llm but does not carry routing-profile constraints`,
          {
            pipelineName: snapshot.plan.pipeline.name,
            stepName: step.name
          }
        );
      }

      if (policyStep.execution === "local" && policyStep.attempts.length > 0) {
        return yield* integrityFailure(
          snapshot,
          "step_mismatch",
          `Execution step "${step.name}" is local and must not carry provider/model attempts`,
          {
            pipelineName: snapshot.plan.pipeline.name,
            stepName: step.name
          }
        );
      }

      if (policyStep.execution === "local" && (policyStep.routingProfile || policyStep.fallbackOn.length > 0)) {
        return yield* integrityFailure(
          snapshot,
          "step_mismatch",
          `Execution step "${step.name}" is local and must not carry routing-profile metadata`,
          {
            pipelineName: snapshot.plan.pipeline.name,
            stepName: step.name
          }
        );
      }
    }
  });
}

function integrityFailure(
  snapshot: ResolvedExecutionSnapshot,
  reason: BackendExecutionIntegrityError["reason"],
  message: string,
  details: {
    readonly pipelineName?: string;
    readonly stepName?: string;
  } = {}
): Effect.Effect<never, BackendExecutionIntegrityError> {
  return Effect.fail(
    new BackendExecutionIntegrityError({
      policyVersion: snapshot.policyVersion,
      message,
      reason,
      pipelineName: details.pipelineName,
      stepName: details.stepName
    })
  );
}
