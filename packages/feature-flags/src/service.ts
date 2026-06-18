import { Effect, Layer } from "effect";
import { createFeatureFlagEvaluator } from "./evaluator.js";
import { createFeatureFlagRegistry } from "./registry.js";
import {
  FeatureFlagEvaluatorService,
  FeatureFlagRegistryService,
  FeatureFlagService,
  type FeatureFlagDefinition,
  type FeatureFlagError,
  type FeatureFlagProvider,
  type FeatureFlagRegistry,
  type FeatureFlagServiceContract,
  type FeatureFlagsOptions
} from "./types.js";

export function createFeatureFlagService(
  options: FeatureFlagsOptions = {}
): Effect.Effect<FeatureFlagServiceContract, FeatureFlagError> {
  return Effect.gen(function* () {
    const registry = options.registry ? options.registry : yield* createFeatureFlagRegistry();
    const evaluator = createFeatureFlagEvaluator(registry);

    return {
      resolve: evaluator.resolve,
      isEnabled: evaluator.isEnabled,
      getVariant: evaluator.getVariant,
      refresh: () =>
        Effect.gen(function* () {
          if (!options.provider) {
            return;
          }

          const loaded = yield* options.provider.load();
          for (const flag of loaded) {
            yield* registry.register(flag);
          }
        })
    };
  });
}

export function createFeatureFlagRegistryLayer(registry: FeatureFlagRegistry) {
  return Layer.succeed(FeatureFlagRegistryService, registry);
}

export function createFeatureFlagEvaluatorLayer(registry: FeatureFlagRegistry) {
  return Layer.succeed(FeatureFlagEvaluatorService, createFeatureFlagEvaluator(registry));
}

export function createFeatureFlagServiceLayer(options: FeatureFlagsOptions = {}) {
  return Layer.effect(FeatureFlagService, createFeatureFlagService(options));
}

export function withFeatureFlags<T>(effect: Effect.Effect<T>, options: FeatureFlagsOptions = {}) {
  return effect.pipe(Effect.provide(createFeatureFlagServiceLayer(options)));
}

export function createFeatureFlagProvider(flags: readonly FeatureFlagDefinition[]): FeatureFlagProvider {
  return {
    load: () => Effect.succeed(flags)
  };
}
