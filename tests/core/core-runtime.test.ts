import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  ContextManagerService,
  ExecutionStrategyService,
  LoggerService,
  RuntimeConfigService,
  TraceRecorderService,
  createContextManagerLayer,
  TracerService,
  createTraceRecorderLayer,
  createCoreLayer,
  withCore
} from "../../packages/core/src/index.js";

describe('core package', () => {
  const config = {
    environment: 'test' as const,
    executionMode: 'sync' as const,
    qualityMode: 'balanced' as const,
    defaultLanguage: 'pt-BR',
    serviceName: 'my-ai-orchestrator'
  };

  it('provides runtime config and base services through layers', () => {
    const program = Effect.gen(function* () {
      const runtime = yield* RuntimeConfigService;
      const strategy = yield* ExecutionStrategyService;
      const logger = yield* LoggerService;
      const tracer = yield* TracerService;

      logger.info('core-test', { mode: runtime.executionMode });
      tracer.startSpan('test');

      return {
        environment: runtime.environment,
        mode: strategy.mode
      };
    });

    const result = Effect.runSync(program.pipe(Effect.provide(createCoreLayer(config))));

    expect(result.environment).toBe('test');
    expect(result.mode).toBe('sync');
  });

  it('wraps an effect with the core layer helper', () => {
    const result = Effect.runSync(
      withCore(
        Effect.gen(function* () {
          const runtime = yield* RuntimeConfigService;
          return runtime.defaultLanguage;
        }),
        config
      )
    );

    expect(result).toBe('pt-BR');
  });

  it('provides context and trace services through effect layers', () => {
    const pipeline = {
      name: 'demo-pipeline',
      steps: [
        { name: 'analyze', skill: 'analyze' },
        { name: 'draft', skill: 'draft' }
      ]
    };

    const program = Effect.gen(function* () {
      const context = yield* ContextManagerService;
      const trace = yield* TraceRecorderService;

      yield* context.set('topic', 'Effect');
      yield* context.mergeOutput({ output: 'analysis result', metadata: { confidence: 0.98 } });
      yield* trace.startStep(pipeline.steps[0], { topic: 'Effect' });
      yield* trace.recordInstruction('Analyze the topic');
      yield* trace.recordOutput('analysis result');

      return {
        topic: yield* context.get('topic'),
        confidence: yield* context.get('confidence'),
        trace: yield* trace.complete('completed')
      };
    });

    const result = Effect.runSync(
      program.pipe(
        Effect.provide(createCoreLayer(config)),
        Effect.provide(createContextManagerLayer({
          pipeline,
          inputs: { topic: 'Effect' }
        })),
        Effect.provide(createTraceRecorderLayer(pipeline, { topic: 'Effect' }, 'test-adapter'))
      )
    );

    expect(result.topic).toBe('Effect');
    expect(result.confidence).toBe(0.98);
    expect(result.trace.status).toBe('completed');
    expect(result.trace.steps).toHaveLength(1);
    expect(result.trace.steps[0]?.output).toBe('analysis result');
  });
});
