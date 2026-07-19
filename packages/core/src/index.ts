import { Context, Effect, Layer } from "effect";
import type { ExecutionMode, QualityMode } from "@my-ai-orchestrator/contracts";
export * from "./errors.js";
export * from "./runtime.js";
export * from "./context.js";
export * from "./trace.js";
export * from "./template-service.js";
export * from "./context-manager.js";

export interface RuntimeConfig {
  readonly environment: "development" | "test" | "production";
  readonly executionMode: ExecutionMode;
  readonly qualityMode: QualityMode;
  readonly defaultLanguage: string;
  readonly serviceName: string;
}

export interface AppLogger {
  readonly info: (message: string, meta?: Record<string, unknown>) => void;
  readonly warn: (message: string, meta?: Record<string, unknown>) => void;
  readonly error: (message: string, meta?: Record<string, unknown>) => void;
  readonly debug: (message: string, meta?: Record<string, unknown>) => void;
}

export interface Tracer {
  readonly startSpan: (name: string, meta?: Record<string, unknown>) => void;
  readonly endSpan: (name: string, meta?: Record<string, unknown>) => void;
}

export interface ExecutionStrategy {
  readonly mode: ExecutionMode;
}

export class RuntimeConfigService extends Context.Tag("RuntimeConfigService")<
  RuntimeConfigService,
  RuntimeConfig
>() {}

export class LoggerService extends Context.Tag("LoggerService")<LoggerService, AppLogger>() {}

export class TracerService extends Context.Tag("TracerService")<TracerService, Tracer>() {}

export class ExecutionStrategyService extends Context.Tag("ExecutionStrategyService")<
  ExecutionStrategyService,
  ExecutionStrategy
>() {}

export function createRuntimeConfig(config: RuntimeConfig): RuntimeConfig {
  return config;
}

export function createConsoleLogger(prefix = "core"): AppLogger {
  const format = (message: string, meta?: Record<string, unknown>) =>
    meta ? `[${prefix}] ${message} ${JSON.stringify(meta)}` : `[${prefix}] ${message}`;

  return {
    info: (message, meta) => console.info(format(message, meta)),
    warn: (message, meta) => console.warn(format(message, meta)),
    error: (message, meta) => console.error(format(message, meta)),
    debug: (message, meta) => console.debug(format(message, meta))
  };
}

export function createNoopTracer(): Tracer {
  return {
    startSpan: () => undefined,
    endSpan: () => undefined
  };
}

export function createExecutionStrategy(mode: ExecutionMode): ExecutionStrategy {
  return { mode };
}

export const createRuntimeConfigLayer = (config: RuntimeConfig) =>
  Layer.succeed(RuntimeConfigService, createRuntimeConfig(config));

export const createLoggerLayer = (logger: AppLogger) => Layer.succeed(LoggerService, logger);

export const createTracerLayer = (tracer: Tracer) => Layer.succeed(TracerService, tracer);

export const createExecutionStrategyLayer = (strategy: ExecutionStrategy) =>
  Layer.succeed(ExecutionStrategyService, strategy);

export function createCoreLayer(config: RuntimeConfig) {
  const runtimeLayer = createRuntimeConfigLayer(config);
  const loggerLayer = createLoggerLayer(createConsoleLogger(config.serviceName));
  const tracerLayer = createTracerLayer(createNoopTracer());
  const strategyLayer = createExecutionStrategyLayer(createExecutionStrategy(config.executionMode));

  return runtimeLayer.pipe(
    Layer.provideMerge(loggerLayer),
    Layer.provideMerge(tracerLayer),
    Layer.provideMerge(strategyLayer)
  );
}

export function withCore<T>(effect: Effect.Effect<T>, config: RuntimeConfig) {
  return effect.pipe(Effect.provide(createCoreLayer(config)));
}
