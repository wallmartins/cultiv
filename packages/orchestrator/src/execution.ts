import { Cause, Effect, Option } from "effect";
import type {
  SkillContract,
  SkillDefinition,
  SkillExecutionContext,
  SkillExecutionResult
} from "@my-ai-orchestrator/skills";
import { resolveContextPath } from "@my-ai-orchestrator/skills";
import {
  type Context,
  type ContextManagerContract,
  type ExecutionAdapter,
  type Pipeline,
  type PipelineStep,
  type RetryPolicy,
  type StructuredPrompt,
  type Trace,
  type TraceEvent,
  type TraceRecorderContract,
  type TraceStep,
  type StepError,
  type StepExecutionOutcome,
  type StepOutput
} from "@my-ai-orchestrator/core";

type EffectLike<A> = A | Effect.Effect<A>;

export interface RunStepWithRetriesArgs {
  readonly step: PipelineStep;
  readonly stepIndex: number;
  readonly contextManager: ContextManagerContract;
  readonly traceRecorder: TraceRecorderContract;
  readonly skill: SkillDefinition;
  readonly retryPolicy: RetryPolicy;
  readonly adapter?: ExecutionAdapter;
  readonly emitStepError?: (attempt: number, error: StepError) => Effect.Effect<void, never>;
}

export function validateRequiredInputs(
  skillName: string,
  contract: SkillContract,
  context: SkillExecutionContext
): Effect.Effect<readonly string[], never> {
  return Effect.gen(function* () {
    const required = contract.input?.required ?? [];
    const missing: string[] = [];

    for (const path of required) {
      const value = yield* resolveContextPath(path, context);
      if (value === undefined || value === null) {
        missing.push(path);
      }
    }

    return missing;
  });
}

export function runStepWithRetries(args: RunStepWithRetriesArgs): Effect.Effect<StepExecutionOutcome, never> {
  return Effect.gen(function* () {
    let stepSuccess = false;
    let finalAttempt = 0;

    for (let attempt = 1; attempt <= args.retryPolicy.maxAttempts; attempt++) {
      if (attempt > 1) {
        yield* asEffect(args.traceRecorder.recordEvent({
          type: "step-retry",
          stepIndex: args.stepIndex,
          stepName: args.step.name,
          skill: args.step.skill,
          attempt
        }));
      }

      const attemptResult = yield* executeStepAttempt({
        ...args,
        attempt
      });

      finalAttempt = attempt;

      if (attemptResult.ok) {
        stepSuccess = true;
        break;
      }

      yield* asEffect(args.traceRecorder.recordError(attemptResult.error));

      if (args.emitStepError) {
        yield* args.emitStepError(attempt, attemptResult.error);
      }
    }

    return { success: stepSuccess, finalAttempt };
  });
}

function executeStepAttempt(
  args: RunStepWithRetriesArgs & { readonly attempt: number }
): Effect.Effect<
  { readonly ok: true } | { readonly ok: false; readonly error: StepError },
  never
> {
  return Effect.gen(function* () {
    const pipeline = yield* asEffect(args.contextManager.getPipeline());
    const currentState = yield* asEffect(args.contextManager.getState());
    const currentInputs = yield* asEffect(args.contextManager.getInputs());
    const currentStep = pipeline.steps[args.stepIndex];
    const skillContext: SkillExecutionContext = {
      pipeline,
      stepIndex: args.stepIndex,
      state: currentState,
      inputs: currentInputs
    };

    yield* asEffect(args.traceRecorder.startStep(currentStep, currentState, args.attempt));
    yield* asEffect(args.traceRecorder.recordEvent({
      type: "step-start",
      stepIndex: args.stepIndex,
      stepName: currentStep.name,
      skill: currentStep.skill,
      attempt: args.attempt
    }));

    if (args.skill.contract) {
      yield* asEffect(args.traceRecorder.recordContract(args.skill.contract));
      const missingInputs = yield* validateRequiredInputs(args.skill.name, args.skill.contract, skillContext);
      const contractPassed = missingInputs.length === 0;
      yield* asEffect(args.traceRecorder.recordContractValidation({
        passed: contractPassed,
        missingInputs: contractPassed ? undefined : missingInputs
      }));
      yield* asEffect(args.traceRecorder.recordEvent({
        type: "contract-validation",
        stepIndex: args.stepIndex,
        stepName: currentStep.name,
        skill: currentStep.skill,
        attempt: args.attempt,
        payload: {
          passed: contractPassed,
          missingInputs
        }
      }));

      if (!contractPassed) {
        return {
          ok: false as const,
          error: createStepError(
            args.step.name,
            `Missing required inputs for skill "${args.skill.name}": ${missingInputs.join(", ")}`
          )
        };
      }
    }

    const skillResult = yield* Effect.catchAll(
      Effect.map(args.skill.execute(skillContext), (value) => ({
        ok: true as const,
        value
      })),
      (cause) =>
        Effect.succeed({
          ok: false as const,
          error: createStepError(
            args.step.name,
            `Skill "${args.skill.name}" failed during execution`,
            cause
          )
        })
    ).pipe(
      Effect.catchAllCause((cause) =>
        Effect.succeed({
          ok: false as const,
          error: createStepError(
            args.step.name,
            `Skill "${args.skill.name}" failed during execution`,
            resolveEffectCause(cause)
          )
        })
      )
    );

    if (!skillResult.ok) {
      return skillResult;
    }

    const successfulSkillResult: SkillExecutionResult = skillResult.value;
    let finalOutput = successfulSkillResult.output;

    const isPromptLike = (value: unknown): value is string | StructuredPrompt =>
      typeof value === "string" ||
      (typeof value === "object" &&
        value !== null &&
        "system" in value &&
        "user" in value &&
        typeof (value as Record<string, unknown>).system === "string" &&
        typeof (value as Record<string, unknown>).user === "string");

    if (args.adapter && isPromptLike(finalOutput)) {
      yield* asEffect(args.traceRecorder.recordInstruction(
        typeof finalOutput === "string" ? finalOutput : finalOutput.user
      ));
      const adapter = args.adapter;
      const adapterContext = skillContext as unknown as Context;
      const adapterResult = yield* Effect.catchAll(
        Effect.map(adapter.execute(finalOutput, adapterContext), (value) => ({
          ok: true as const,
          value
        })),
        (cause) =>
          Effect.succeed({
            ok: false as const,
            error: createStepError(
              args.step.name,
              `Adapter "${adapter.name}" failed during execution`,
              cause
            )
          })
      ).pipe(
        Effect.catchAllCause((cause) =>
          Effect.succeed({
            ok: false as const,
            error: createStepError(
              args.step.name,
              `Adapter "${adapter.name}" failed during execution`,
              resolveEffectCause(cause)
            )
          })
        )
      );

      if (!adapterResult.ok) {
        return adapterResult;
      }

      finalOutput = adapterResult.value;
    }

    const outputForState =
      typeof finalOutput === "string"
        ? finalOutput
        : (finalOutput as StructuredPrompt).user;

    const stepOutput: StepOutput = {
      output: outputForState,
      metadata: {
        ...successfulSkillResult.metadata,
        ...(typeof finalOutput !== "string"
          ? { structuredPrompt: true }
          : {})
      }
    };

    yield* asEffect(args.traceRecorder.recordOutput(outputForState));
    yield* asEffect(args.contextManager.mergeOutput(stepOutput));
    yield* asEffect(args.traceRecorder.recordEvent({
      type: "step-complete",
      stepIndex: args.stepIndex,
      stepName: currentStep.name,
      skill: currentStep.skill,
      attempt: args.attempt,
      status: "completed"
    }));

    return { ok: true as const };
  }).pipe(
    Effect.catchAllCause((cause) =>
      Effect.succeed({
        ok: false as const,
        error: createStepError(
          args.step.name,
          `Unexpected failure while running step "${args.step.name}"`,
          resolveEffectCause(cause)
        )
      })
    )
  );
}

function createStepError(stepName: string, message: string, cause?: unknown): StepError {
  return {
    stepName,
    message,
    type: "StepExecutionError",
    stack: cause instanceof Error ? cause.stack : undefined,
    cause
  };
}

function asEffect<A>(value: EffectLike<A>): Effect.Effect<A> {
  return Effect.isEffect(value) ? value : Effect.succeed(value);
}

function resolveEffectCause(cause: Cause.Cause<unknown>): unknown {
  const failure = Cause.failureOption(cause);
  if (Option.isSome(failure)) {
    return failure.value;
  }

  const defect = Cause.dieOption(cause);
  if (Option.isSome(defect)) {
    return defect.value;
  }

  return Cause.squash(cause);
}
