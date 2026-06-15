import { Context, Effect, Layer, Ref } from "effect";
import type { Pipeline, StepError, Trace, TraceEvent, TraceStep, TraceStatus } from "./runtime.js";

export interface TraceRecorderContract {
  readonly startStep: (step: Pipeline["steps"][number], input: unknown, attempt?: number) => Effect.Effect<TraceStep>;
  readonly recordInstruction: (instruction: string) => Effect.Effect<void>;
  readonly recordOutput: (output: unknown) => Effect.Effect<void>;
  readonly recordError: (error: StepError) => Effect.Effect<void>;
  readonly recordResolvedInputs: (resolvedInputs: Record<string, unknown>) => Effect.Effect<void>;
  readonly recordContract: (contract: unknown) => Effect.Effect<void>;
  readonly recordParsedOutput: (parsedOutput: unknown) => Effect.Effect<void>;
  readonly recordContractValidation: (validation: { readonly passed: boolean; readonly missingInputs?: readonly string[] }) => Effect.Effect<void>;
  readonly recordLanguageGateResult: (result: {
    readonly passed: boolean;
    readonly errors: Array<{ readonly type: string; readonly details?: Record<string, unknown> }>;
    readonly warnings: Array<{ readonly type: string; readonly details?: Record<string, unknown> }>;
  }) => Effect.Effect<void>;
  readonly incrementAttempt: () => Effect.Effect<void>;
  readonly recordWarnings: (warnings: string[]) => Effect.Effect<void>;
  readonly recordEvent: (event: Omit<TraceEvent, "occurredAt">) => Effect.Effect<void>;
  readonly complete: (status?: TraceStatus) => Effect.Effect<Trace>;
  readonly getTrace: () => Effect.Effect<Trace>;
}

export class TraceRecorderService extends Context.Tag("TraceRecorderService")<TraceRecorderService, {
  readonly startStep: (step: Pipeline["steps"][number], input: unknown, attempt?: number) => Effect.Effect<TraceStep>;
  readonly recordInstruction: (instruction: string) => Effect.Effect<void>;
  readonly recordOutput: (output: unknown) => Effect.Effect<void>;
  readonly recordError: (error: StepError) => Effect.Effect<void>;
  readonly recordResolvedInputs: (resolvedInputs: Record<string, unknown>) => Effect.Effect<void>;
  readonly recordContract: (contract: unknown) => Effect.Effect<void>;
  readonly recordParsedOutput: (parsedOutput: unknown) => Effect.Effect<void>;
  readonly recordContractValidation: (validation: { readonly passed: boolean; readonly missingInputs?: readonly string[] }) => Effect.Effect<void>;
  readonly recordLanguageGateResult: (result: {
    readonly passed: boolean;
    readonly errors: Array<{ readonly type: string; readonly details?: Record<string, unknown> }>;
    readonly warnings: Array<{ readonly type: string; readonly details?: Record<string, unknown> }>;
  }) => Effect.Effect<void>;
  readonly incrementAttempt: () => Effect.Effect<void>;
  readonly recordWarnings: (warnings: string[]) => Effect.Effect<void>;
  readonly recordEvent: (event: Omit<TraceEvent, "occurredAt">) => Effect.Effect<void>;
  readonly complete: (status?: TraceStatus) => Effect.Effect<Trace>;
  readonly getTrace: () => Effect.Effect<Trace>;
}>() {}

function createTraceId(): string {
  return `trace_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function summarizeTraceItems(
  items: Array<{ readonly type: string; readonly details?: Record<string, unknown> }>,
  limit = 5
): Array<{ readonly type: string; readonly token?: string; readonly language?: string; readonly position?: number; readonly context?: string }> {
  return items.slice(0, limit).map((item) => {
    const details = item.details ?? {};
    const token = typeof details.word === "string"
      ? details.word
      : typeof details.char === "string"
        ? details.char
        : undefined;
    return {
      type: item.type,
      token,
      language: typeof details.language === "string" ? details.language : undefined,
      position: typeof details.position === "number" ? details.position : undefined,
      context: typeof details.context === "string" ? details.context : undefined
    };
  });
}

interface TraceRecorderState {
  readonly trace: Trace;
}

export function createTraceRecorderService(
  pipeline: Pipeline,
  initialInputs: Record<string, unknown>,
  adapter?: string
): Effect.Effect<TraceRecorderContract, never> {
  return Effect.gen(function* () {
    const traceRef = yield* Ref.make<TraceRecorderState>({
      trace: {
        id: createTraceId(),
        pipeline,
        initialInputs: { ...initialInputs },
        steps: [],
        startedAt: new Date().toISOString(),
        adapter,
        status: "running"
      }
    });

    const getCurrentStepIndex = (trace: Trace): number => trace.steps.length - 1;

    const updateCurrentStep = (updater: (step: TraceStep) => TraceStep) =>
      Ref.update(traceRef, (state) => {
        const currentIndex = getCurrentStepIndex(state.trace);
        if (currentIndex < 0) {
          return state;
        }

        const steps = [...state.trace.steps];
        steps[currentIndex] = updater(steps[currentIndex] as TraceStep);
        return {
          trace: {
            ...state.trace,
            steps
          }
        };
      });

    return {
      startStep: (step, input, attempt = 1) =>
        Effect.gen(function* () {
          const traceStep: TraceStep = {
            step,
            input,
            startedAt: new Date().toISOString(),
            attempt
          };

          yield* Ref.update(traceRef, (state) => ({
            trace: {
              ...state.trace,
              steps: [...state.trace.steps, traceStep]
            }
          }));

          return traceStep;
        }),
      recordInstruction: (instruction) =>
        updateCurrentStep((currentStep) => ({
          ...currentStep,
          instruction
        })),
      recordOutput: (output) =>
        updateCurrentStep((currentStep) => ({
          ...currentStep,
          output,
          completedAt: new Date().toISOString()
        })),
      recordError: (error) =>
        updateCurrentStep((currentStep) => ({
          ...currentStep,
          error,
          completedAt: new Date().toISOString()
        })),
      recordResolvedInputs: (resolvedInputs) =>
        updateCurrentStep((currentStep) => ({
          ...currentStep,
          resolvedInputs
        })),
      recordContract: (contract) =>
        updateCurrentStep((currentStep) => ({
          ...currentStep,
          contract
        })),
      recordParsedOutput: (parsedOutput) =>
        updateCurrentStep((currentStep) => ({
          ...currentStep,
          parsedOutput
        })),
      recordContractValidation: (validation) =>
        updateCurrentStep((currentStep) => ({
          ...currentStep,
          contractValidation: validation
        })),
      recordLanguageGateResult: (result) =>
        updateCurrentStep((currentStep) => ({
          ...currentStep,
          languageGateResult: {
            passed: result.passed,
            errorCount: result.errors.length,
            warningCount: result.warnings.length,
            errorsSample: summarizeTraceItems(result.errors),
            warningsSample: summarizeTraceItems(result.warnings)
          }
        })),
      incrementAttempt: () =>
        updateCurrentStep((currentStep) => ({
          ...currentStep,
          attempt: currentStep.attempt + 1,
          completedAt: undefined,
          output: undefined,
          error: undefined,
          parsedOutput: undefined
        })),
      recordWarnings: (warnings) =>
        Ref.update(traceRef, (state) => ({
          trace: {
            ...state.trace,
            warnings: warnings.length > 0 ? [...(state.trace.warnings ?? []), ...warnings] : state.trace.warnings
          }
        })),
      recordEvent: (event) =>
        Ref.update(traceRef, (state) => ({
          trace: {
            ...state.trace,
            events: [
              ...(state.trace.events ?? []),
              {
                ...event,
                occurredAt: new Date().toISOString()
              }
            ]
          }
        })),
      complete: (status = "completed") =>
        Ref.updateAndGet(traceRef, (state) => ({
          trace: {
            ...state.trace,
            status,
            completedAt: new Date().toISOString()
          }
        })).pipe(Effect.map((state) => state.trace)),
      getTrace: () => Ref.get(traceRef).pipe(Effect.map((state) => state.trace))
    };
  });
}

export function createTraceRecorderLayer(
  pipeline: Pipeline,
  initialInputs: Record<string, unknown>,
  adapter?: string
) {
  return Layer.effect(TraceRecorderService, createTraceRecorderService(pipeline, initialInputs, adapter));
}
