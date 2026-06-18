import { Effect } from "effect";
import { FeatureFlagDefinitionError, FeatureFlagRolloutError, FeatureFlagVariantError } from "./errors.js";
import type { FeatureFlagDefinition, FeatureFlagError } from "./types.js";

export function defineFeatureFlag(flag: FeatureFlagDefinition): Effect.Effect<FeatureFlagDefinition, FeatureFlagError> {
  return validateFeatureFlag(flag);
}

export function validateFeatureFlag(flag: FeatureFlagDefinition): Effect.Effect<FeatureFlagDefinition, FeatureFlagError> {
  if (!flag || typeof flag !== "object") {
    return Effect.fail(
      new FeatureFlagDefinitionError({
        message: "Feature flag definition is required"
      })
    );
  }

  if (typeof flag.key !== "string" || flag.key.trim().length === 0) {
    return Effect.fail(
      new FeatureFlagDefinitionError({
        message: "Feature flag must have a non-empty key"
      })
    );
  }

  if (flag.variants) {
    const normalized = new Set<string>();
    for (const variant of flag.variants) {
      if (typeof variant !== "string" || variant.trim().length === 0) {
        return Effect.fail(
          new FeatureFlagVariantError({
            key: flag.key,
            message: `Feature flag "${flag.key}" has an invalid variant`
          })
        );
      }
      normalized.add(variant);
    }
    if (flag.defaultVariant && !normalized.has(flag.defaultVariant)) {
      return Effect.fail(
        new FeatureFlagVariantError({
          key: flag.key,
          message: `Feature flag "${flag.key}" defaultVariant must be included in variants`
        })
      );
    }
    if (flag.rollout?.allowedVariants) {
      for (const variant of flag.rollout.allowedVariants) {
        if (!normalized.has(variant)) {
          return Effect.fail(
            new FeatureFlagRolloutError({
              key: flag.key,
              message: `Feature flag "${flag.key}" rollout allowedVariants must be included in variants`
            })
          );
        }
      }
    }
  }

  if (flag.rollout?.percentage !== undefined && (flag.rollout.percentage < 0 || flag.rollout.percentage > 100)) {
    return Effect.fail(
      new FeatureFlagRolloutError({
        key: flag.key,
        message: `Feature flag "${flag.key}" rollout.percentage must be between 0 and 100`
      })
    );
  }

  return Effect.succeed(flag);
}
