import { Effect } from "effect";
import {
  BackendReadinessError,
  BackendRequestRateLimitError
} from "../http/errors.js";
import type { ReadinessResponse } from "@my-ai-orchestrator/contracts";
import { isProbeRoute, normalizeRateLimitPath } from "./probe.js";
import { resolveBlockedReason, resolveBlockedReadinessMessage } from "./readiness.js";
import type { RateLimitStore } from "../runtime/redis-rate-limit-store.js";

export interface RateLimiterState {
  readonly limit: number;
  readonly windowMs: number;
  readonly state: Map<string, { count: number; resetAt: number }>;
}

export function createRateLimiterState(limit: number, windowMs: number): RateLimiterState {
  return { limit, windowMs, state: new Map() };
}

export function assertTrafficAllowed(
  input: {
    readonly method: string;
    readonly path: string;
    readonly origin?: string;
    readonly clientKey: string;
  },
  options: {
    readonly isProductionStrict: boolean;
    readonly evaluateReadiness: () => Effect.Effect<ReadinessResponse>;
    readonly rateLimiter: RateLimiterState;
    readonly durableRateLimitStore?: RateLimitStore;
    readonly now: () => Date;
  }
): Effect.Effect<void, BackendReadinessError | BackendRequestRateLimitError> {
  return Effect.gen(function* () {
    if (!options.isProductionStrict || isProbeRoute(input.path)) {
      return;
    }

    const readiness = yield* options.evaluateReadiness();
    if (readiness.status === "blocked") {
      return yield* Effect.fail(
        new BackendReadinessError({
          reason: resolveBlockedReason(readiness.checks),
          message: resolveBlockedReadinessMessage(readiness.checks),
          checks: readiness.checks
        })
      );
    }

    const nowMs = options.now().getTime();
    const key = `${input.clientKey}:${normalizeRateLimitPath(input.path)}`;

    if (options.durableRateLimitStore) {
      const activeWindow = yield* options.durableRateLimitStore.increment(
        key,
        options.rateLimiter.windowMs,
        nowMs
      );

      if (activeWindow.count > options.rateLimiter.limit) {
        return yield* Effect.fail(
          new BackendRequestRateLimitError({
            key,
            limit: options.rateLimiter.limit,
            windowMs: options.rateLimiter.windowMs,
            message: "HTTP request rate limit exceeded"
          })
        );
      }

      return;
    }

    const current = options.rateLimiter.state.get(key);
    const activeWindow = current && current.resetAt > nowMs
      ? current
      : { count: 0, resetAt: nowMs + options.rateLimiter.windowMs };

    if (activeWindow.count >= options.rateLimiter.limit) {
      return yield* Effect.fail(
        new BackendRequestRateLimitError({
          key,
          limit: options.rateLimiter.limit,
          windowMs: options.rateLimiter.windowMs,
          message: "HTTP request rate limit exceeded"
        })
      );
    }

    options.rateLimiter.state.set(key, {
      count: activeWindow.count + 1,
      resetAt: activeWindow.resetAt
    });
  });
}
