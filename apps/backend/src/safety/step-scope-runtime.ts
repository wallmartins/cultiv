import { Effect } from "effect";
import type {
  ContextManagerContract,
  Pipeline as RuntimePipeline
} from "@my-ai-orchestrator/core";
import type { BackendPolicyEvidenceService } from "./policy-evidence-types.js";
import type { BackendScopedRuntimeStep } from "./step-scope-types.js";
import { requireStepScopeContract } from "./step-scope-contracts.js";
import { validateHandoffArtifact, validateMetadataWrites } from "./step-scope-handoff.js";
import { createScopedRecord, readScopedValue } from "./step-scope-read-boundary.js";

export function createScopedContextManager(args: {
  readonly contextManager: ContextManagerContract;
  readonly pipeline: RuntimePipeline;
  readonly stepIndex: number;
  readonly policyEvidence?: BackendPolicyEvidenceService;
}): ContextManagerContract {
  const step = args.pipeline.steps[args.stepIndex] as BackendScopedRuntimeStep | undefined;

  return {
    get: (key) =>
      Effect.gen(function* () {
        const scope = yield* requireStepScopeContract(step).pipe(Effect.orDie);
        const [state, inputs] = yield* Effect.all([
          args.contextManager.getState(),
          args.contextManager.getInputs()
        ]);
        return yield* readScopedValue({
          key,
          allowedStateKeys: scope.reads.stateKeys,
          allowedInputKeys: scope.reads.inputKeys,
          state,
          inputs,
          stepName: scope.stepName,
          policyEvidence: args.policyEvidence
        });
      }),
    set: args.contextManager.set,
    getState: () =>
      Effect.gen(function* () {
        const scope = yield* requireStepScopeContract(step).pipe(Effect.orDie);
        const state = yield* args.contextManager.getState();
        return createScopedRecord({
          source: state,
          allowedKeys: scope.reads.stateKeys,
          stepName: scope.stepName,
          unauthorizedReason: "unauthorized_state_read",
          fieldLabel: "state",
          policyEvidence: args.policyEvidence
        });
      }),
    getInputs: () =>
      Effect.gen(function* () {
        const scope = yield* requireStepScopeContract(step).pipe(Effect.orDie);
        const inputs = yield* args.contextManager.getInputs();
        return createScopedRecord({
          source: inputs,
          allowedKeys: scope.reads.inputKeys,
          stepName: scope.stepName,
          unauthorizedReason: "unauthorized_input_read",
          fieldLabel: "input",
          policyEvidence: args.policyEvidence
        });
      }),
    getPipeline: args.contextManager.getPipeline,
    getStepIndex: args.contextManager.getStepIndex,
    advanceStep: args.contextManager.advanceStep,
    mergeOutput: (output) =>
      Effect.gen(function* () {
        const scope = yield* requireStepScopeContract(step).pipe(Effect.orDie);
        yield* validateMetadataWrites({
          scope,
          output,
          policyEvidence: args.policyEvidence
        });
        const outputValue = yield* validateHandoffArtifact({
          scope,
          output,
          policyEvidence: args.policyEvidence
        });
        yield* args.contextManager.set(scope.writes.outputKey, outputValue);

        for (const key of scope.writes.metadataKeys) {
          if (output.metadata && Object.prototype.hasOwnProperty.call(output.metadata, key)) {
            yield* args.contextManager.set(key, output.metadata[key]);
          }
        }
      })
  };
}
