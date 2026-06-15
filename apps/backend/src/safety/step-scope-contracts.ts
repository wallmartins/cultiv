import { Effect } from "effect";
import type { Pipeline as RuntimePipeline } from "@my-ai-orchestrator/core";
import { BackendStepScopeViolationError } from "../http/errors.js";
import type {
  BackendScopedRuntimeStep,
  BackendStepScopeContract
} from "./step-scope-types.js";

const commonStateKeys = [
  "contentType",
  "pipelineName",
  "topic",
  "adapter",
  "model",
  "qualityMode",
  "__score",
  "voiceProfile",
  "generationContext"
] as const;

export function attachResolvedStepScopeContracts(
  pipeline: RuntimePipeline,
  runtimeInputs: Readonly<Record<string, unknown>>
): RuntimePipeline {
  const inputKeys = Object.keys(runtimeInputs);

  return {
    ...pipeline,
    steps: pipeline.steps.map((step, stepIndex, steps) => {
      const previousStepName = steps[stepIndex - 1]?.name;
      const scope = resolveStepScopeContract(step.name, inputKeys, previousStepName);

      return {
        ...step,
        config: {
          ...(step.config ?? {}),
          stepScope: scope
        }
      };
    })
  };
}

export function requireStepScopeContract(
  step: BackendScopedRuntimeStep | undefined
): Effect.Effect<BackendStepScopeContract, BackendStepScopeViolationError> {
  const contract = step?.config?.stepScope;
  if (contract) {
    return Effect.succeed(contract);
  }

  return Effect.fail(
    new BackendStepScopeViolationError({
      stepName: step?.name ?? "unknown-step",
      boundary: "read",
      reason: "missing_contract",
      message: `Step "${step?.name ?? "unknown-step"}" is missing a runtime step-scope contract`
    })
  );
}

function resolveStepScopeContract(
  stepName: string,
  inputKeys: readonly string[],
  previousStepName: string | undefined
): BackendStepScopeContract {
  const stateKeys = dedupeStrings([
    ...commonStateKeys,
    ...(previousStepName ? [previousStepName] : [])
  ]);

  return {
    stepName,
    reads: {
      inputKeys: dedupeStrings(inputKeys),
      stateKeys
    },
    writes: {
      outputKey: stepName,
      metadataKeys: ["structuredPrompt"]
    },
    handoff: {
      outputKind: "text",
      requireNonEmpty: true
    }
  };
}

function dedupeStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
