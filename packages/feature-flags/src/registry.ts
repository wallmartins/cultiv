import { Effect } from "effect";
import { DEFAULT_FEATURE_FLAGS } from "./defaults.js";
import type { FeatureFlagDefinition, FeatureFlagError, FeatureFlagRegistry } from "./types.js";
import { validateFeatureFlag } from "./validation.js";

export function createFeatureFlagRegistry(
  initialFlags: readonly FeatureFlagDefinition[] = DEFAULT_FEATURE_FLAGS
): Effect.Effect<FeatureFlagRegistry, FeatureFlagError> {
  const flags = new Map<string, FeatureFlagDefinition>();

  return Effect.gen(function* () {
    for (const flag of initialFlags) {
      const validated = yield* validateFeatureFlag(flag);
      flags.set(validated.key, validated);
    }

    return {
      register(flag) {
        return Effect.map(validateFeatureFlag(flag), (validated) => {
          flags.set(validated.key, validated);
        });
      },
      resolve(key) {
        return flags.get(key);
      },
      list() {
        return Array.from(flags.values());
      },
      snapshot() {
        return Object.fromEntries(flags.entries());
      }
    };
  });
}

export function listFeatureFlagKeys(registry: FeatureFlagRegistry): string[] {
  return registry.list().map((flag) => flag.key);
}
