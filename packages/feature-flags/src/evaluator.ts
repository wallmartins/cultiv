import type {
  FeatureFlagDefinition,
  FeatureFlagEvaluationContext,
  FeatureFlagEvaluator,
  FeatureFlagRegistry,
  FeatureFlagTargetRule,
  ResolvedFeatureFlag
} from "./types.js";

export function createFeatureFlagEvaluator(registry: FeatureFlagRegistry): FeatureFlagEvaluator {
  return {
    resolve(key, context = {}) {
      const definition = registry.resolve(key);
      if (!definition) {
        return createMissingFlagResolution(key, context);
      }

      if (!definition.enabled) {
        return {
          key,
          scope: definition.scope,
          enabled: false,
          variant: null,
          reason: "disabled",
          target: context
        };
      }

      const targetMatch = matchTargetRule(definition, context);
      if (targetMatch) {
        return {
          key,
          scope: definition.scope,
          enabled: targetMatch.enabled ?? true,
          variant: targetMatch.variant ?? definition.defaultVariant ?? null,
          reason: "target",
          target: context
        };
      }

      const rolloutMatch = matchRollout(definition, context);
      if (rolloutMatch) {
        return {
          key,
          scope: definition.scope,
          enabled: true,
          variant: rolloutMatch,
          reason: "rollout",
          target: context
        };
      }

      return {
        key,
        scope: definition.scope,
        enabled: true,
        variant: definition.defaultVariant ?? null,
        reason: "default",
        target: context
      };
    },
    isEnabled(key, context) {
      return this.resolve(key, context).enabled;
    },
    getVariant(key, context) {
      return this.resolve(key, context).variant;
    }
  };
}

function createMissingFlagResolution(key: string, context: FeatureFlagEvaluationContext): ResolvedFeatureFlag {
  return {
    key,
    scope: "rollout",
    enabled: false,
    variant: null,
    reason: "disabled",
    target: context
  };
}

function matchTargetRule(
  definition: FeatureFlagDefinition,
  context: FeatureFlagEvaluationContext
): FeatureFlagTargetRule | undefined {
  return definition.targets?.find((rule) => {
    if (rule.environment && rule.environment !== context.environment) {
      return false;
    }
    if (rule.locale && rule.locale !== context.locale) {
      return false;
    }
    if (rule.userId && rule.userId !== context.userId) {
      return false;
    }
    if (rule.pipelineType && rule.pipelineType !== context.pipelineType) {
      return false;
    }
    if (rule.contentType && rule.contentType !== context.contentType) {
      return false;
    }
    if (rule.tags && rule.tags.length > 0) {
      const currentTags = new Set(context.tags ?? []);
      if (!rule.tags.every((tag) => currentTags.has(tag))) {
        return false;
      }
    }
    return true;
  });
}

function matchRollout(definition: FeatureFlagDefinition, context: FeatureFlagEvaluationContext): string | undefined {
  const rollout = definition.rollout;
  if (!rollout || rollout.percentage === undefined || rollout.percentage <= 0) {
    return undefined;
  }

  const basis =
    rollout.stickyBy && context[rollout.stickyBy]
      ? String(context[rollout.stickyBy])
      : JSON.stringify({
          key: definition.key,
          userId: context.userId,
          pipelineType: context.pipelineType,
          contentType: context.contentType,
          locale: context.locale
        });

  const hash = hashString(basis);
  const bucket = hash % 100;
  if (bucket < rollout.percentage) {
    return rollout.allowedVariants?.[1] ?? definition.variants?.[1] ?? definition.defaultVariant ?? "beta";
  }

  return rollout.allowedVariants?.[0] ?? definition.variants?.[0] ?? definition.defaultVariant ?? "control";
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
