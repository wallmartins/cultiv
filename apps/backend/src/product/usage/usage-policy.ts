import { Effect } from "effect";
import type { BackendConfig } from "../../config/config.js";
import type { FeatureFlagRegistry } from "@my-ai-orchestrator/feature-flags";
import type { BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { BackendUsageAuthorization, BackendUsagePolicy } from "../core/types.js";
import { BackendUsageAuthorizationError } from "../../http/errors.js";
import { enforceUsagePolicyGuards } from "./usage-policy-guards.js";
import { resolveUsagePolicyContext } from "./usage-policy-context.js";
import { resolveTrafficLimit } from "./usage-policy-traffic.js";

export function createBackendUsagePolicy(options: {
  readonly billing: BillingServiceContract;
  readonly featureFlagRegistry: FeatureFlagRegistry;
  readonly config: BackendConfig;
  readonly now: () => Date;
  readonly incrementTraffic?: (key: string) => Effect.Effect<number, never>;
}): BackendUsagePolicy {
  const trafficCounters = new Map<string, number>();

  return {
    authorize(args) {
      return Effect.gen(function* () {
        const {
          billingIdentity,
          entitlement,
          executionMode,
          refinementEnabled,
          betaEnabled
        } = resolveUsagePolicyContext({
          billing: options.billing,
          featureFlagRegistry: options.featureFlagRegistry,
          config: options.config,
          request: args
        });
        const trafficWindow = `${billingIdentity.userId}:${billingIdentity.planId}:${options.now().toISOString().slice(0, 10)}`;
        const trafficLimit = resolveTrafficLimit(entitlement?.tier ?? "free", betaEnabled);
        let trafficUsed: number;

        if (options.incrementTraffic) {
          const nextCount = yield* options.incrementTraffic(trafficWindow);
          if (trafficLimit !== null && nextCount > trafficLimit) {
            return yield* Effect.fail(
              new BackendUsageAuthorizationError({
                userId: billingIdentity.userId,
                planId: billingIdentity.planId,
                reason: "traffic_limit",
                message: `Traffic limit reached for plan "${billingIdentity.planId}"`
              })
            );
          }
          trafficUsed = nextCount - 1;
        } else {
          trafficUsed = trafficCounters.get(trafficWindow) ?? 0;
        }
        const modelAllowed =
          entitlement === null || entitlement.allowedModels.length === 0 || entitlement.allowedModels.includes(args.model);

        yield* enforceUsagePolicyGuards({
          userId: billingIdentity.userId,
          planId: billingIdentity.planId,
          requestedExecutionMode: args.executionMode,
          resolvedExecutionMode: executionMode,
          entitlement,
          model: args.model,
          allowedModel: modelAllowed
        });

        if (trafficLimit !== null && trafficUsed >= trafficLimit) {
          return yield* Effect.fail(
            new BackendUsageAuthorizationError({
              userId: billingIdentity.userId,
              planId: billingIdentity.planId,
              reason: "traffic_limit",
              message: `Traffic limit reached for plan "${billingIdentity.planId}"`
            })
          );
        }

        if (!options.incrementTraffic) {
          trafficCounters.set(trafficWindow, trafficUsed + 1);
        }

        return {
          userId: billingIdentity.userId,
          planId: billingIdentity.planId,
          executionMode: args.executionMode,
          qualityMode: args.qualityMode,
          trafficWindow,
          trafficLimit,
          trafficUsed: trafficUsed + 1,
          modelAllowed,
          refinementEnabled,
          betaEnabled,
          entitlement
        } satisfies BackendUsageAuthorization;
      });
    }
  };
}
