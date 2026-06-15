import { Effect } from "effect";
import {
  ContextManagerService,
  TraceRecorderService,
  type ExecutionAdapter,
  type Pipeline,
  type RetryPolicy
} from "@my-ai-orchestrator/core";
import { SkillRegistryService } from "@my-ai-orchestrator/skills";
import { runStepWithRetries } from "./execution.js";
import { OrchestrationSkillNotFoundError } from "./orchestration-errors.js";
import type { OrchestrationLoopProgressReporter } from "./orchestration-loop-progress.js";

export interface OrchestrationStepRuntimeArgs {
  readonly pipeline: Pipeline;
  readonly stepIndex: number;
  readonly adapter?: ExecutionAdapter;
  readonly continueOnError: boolean;
  readonly progressReporter: OrchestrationLoopProgressReporter;
}

export interface OrchestrationStepRuntimeResult {
  readonly completedStepsDelta: 0 | 1;
  readonly hasErrors: boolean;
  readonly shouldContinue: boolean;
}

export function runOrchestrationStep(
  args: OrchestrationStepRuntimeArgs
): Effect.Effect<
  OrchestrationStepRuntimeResult,
  OrchestrationSkillNotFoundError,
  ContextManagerService | TraceRecorderService | SkillRegistryService
> {
  return Effect.gen(function* () {
    const ctx = yield* ContextManagerService;
    const traceRecorder = yield* TraceRecorderService;
    const registry = yield* SkillRegistryService;
    const step = args.pipeline.steps[args.stepIndex];
    const stepStartTime = Date.now();
    const skillName = step.skill;
    const skill = registry.resolve(skillName);

    if (!skill) {
      return yield* Effect.fail(
        new OrchestrationSkillNotFoundError({
          skillName,
          availableSkills: registry.list()
        })
      );
    }

    yield* args.progressReporter.emitStepStart(step.name, args.stepIndex, skillName);

    const retryPolicy: RetryPolicy = step.retry ?? args.pipeline.config?.retry ?? { maxAttempts: 1 };
    const stepResult = yield* runStepWithRetries({
      step,
      stepIndex: args.stepIndex,
      contextManager: ctx,
      traceRecorder,
      skill,
      retryPolicy,
      adapter: args.adapter,
      emitStepError: (_attempt, error) =>
        args.progressReporter.emitStepError(step.name, args.stepIndex, skillName, error)
    });

    const stepDuration = Date.now() - stepStartTime;

    if (!stepResult.success) {
      yield* args.progressReporter.emitStepComplete(step.name, args.stepIndex, skillName, stepDuration, "failed");

      return {
        completedStepsDelta: 0,
        hasErrors: true,
        shouldContinue: step.continueOnError ?? args.continueOnError
      };
    }

    yield* args.progressReporter.emitStepComplete(step.name, args.stepIndex, skillName, stepDuration, "done");

    return {
      completedStepsDelta: 1,
      hasErrors: false,
      shouldContinue: true
    };
  });
}
