import { Context, Effect, Layer, Ref } from "effect";
import type { Pipeline, StepOutput } from "./runtime.js";

export interface ContextManagerContract {
  readonly get: (key: string) => Effect.Effect<unknown>;
  readonly set: (key: string, value: unknown) => Effect.Effect<void>;
  readonly getState: () => Effect.Effect<Readonly<Record<string, unknown>>>;
  readonly getInputs: () => Effect.Effect<Readonly<Record<string, unknown>>>;
  readonly getPipeline: () => Effect.Effect<Pipeline>;
  readonly getStepIndex: () => Effect.Effect<number>;
  readonly advanceStep: () => Effect.Effect<void>;
  readonly mergeOutput: (output: StepOutput) => Effect.Effect<void>;
}

export class ContextManagerService extends Context.Tag("ContextManagerService")<ContextManagerService, {
  readonly get: (key: string) => Effect.Effect<unknown>;
  readonly set: (key: string, value: unknown) => Effect.Effect<void>;
  readonly getState: () => Effect.Effect<Readonly<Record<string, unknown>>>;
  readonly getInputs: () => Effect.Effect<Readonly<Record<string, unknown>>>;
  readonly getPipeline: () => Effect.Effect<Pipeline>;
  readonly getStepIndex: () => Effect.Effect<number>;
  readonly advanceStep: () => Effect.Effect<void>;
  readonly mergeOutput: (output: StepOutput) => Effect.Effect<void>;
}>() {}

interface InternalContext {
  pipeline: Pipeline;
  stepIndex: number;
  state: Record<string, unknown>;
  inputs: Record<string, unknown>;
}

function createInternalContext(
  pipeline: Pipeline,
  inputs: Record<string, unknown>,
  initialState?: Record<string, unknown>
): InternalContext {
  return {
    pipeline,
    stepIndex: 0,
    state: initialState ? { ...initialState } : {},
    inputs: { ...inputs }
  };
}

export interface CreateContextManagerOptions {
  readonly pipeline: Pipeline;
  readonly inputs: Record<string, unknown>;
  readonly initialState?: Record<string, unknown>;
}

export function createContextManagerService(
  options: CreateContextManagerOptions
): Effect.Effect<ContextManagerContract, never> {
  return Effect.gen(function* () {
    const ctxRef = yield* Ref.make(createInternalContext(options.pipeline, options.inputs, options.initialState));

    return {
      get: (key: string) =>
        Ref.get(ctxRef).pipe(
          Effect.map((ctx) =>
            Object.prototype.hasOwnProperty.call(ctx.state, key) ? ctx.state[key] : ctx.inputs[key]
          )
        ),

      set: (key: string, value: unknown) =>
        Ref.update(ctxRef, (ctx) => ({
          ...ctx,
          state: {
            ...ctx.state,
            [key]: value
          }
        })),

      getState: () =>
        Ref.get(ctxRef).pipe(
          Effect.map((ctx) => ({
            ...ctx.state
          }))
        ),

      getInputs: () =>
        Ref.get(ctxRef).pipe(
          Effect.map((ctx) => ({
            ...ctx.inputs
          }))
        ),

      getPipeline: () => Ref.get(ctxRef).pipe(Effect.map((ctx) => ctx.pipeline)),

      getStepIndex: () => Ref.get(ctxRef).pipe(Effect.map((ctx) => ctx.stepIndex)),

      advanceStep: () =>
        Ref.update(ctxRef, (ctx) => ({
          ...ctx,
          stepIndex: ctx.stepIndex + 1
        })),

      mergeOutput: (output: StepOutput) =>
        Ref.update(ctxRef, (ctx) => {
          const nextState = { ...ctx.state };
          const stepName = ctx.pipeline.steps[ctx.stepIndex]?.name;

          if (stepName && output.output !== undefined) {
            nextState[stepName] = output.output;
          }

          if (output.metadata) {
            for (const [key, value] of Object.entries(output.metadata)) {
              nextState[key] = value;
            }
          }

          return {
            ...ctx,
            state: nextState
          };
        })
    };
  });
}

export function createContextManagerLayer(options: CreateContextManagerOptions) {
  return Layer.effect(ContextManagerService, createContextManagerService(options));
}

export function withContextManager<T>(
  effect: Effect.Effect<T>,
  options: CreateContextManagerOptions
): Effect.Effect<T> {
  return effect.pipe(Effect.provide(createContextManagerLayer(options)));
}
