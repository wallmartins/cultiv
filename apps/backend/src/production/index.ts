import { Effect } from "effect";
import { sql } from "kysely";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { ReadinessResponse } from "@my-ai-orchestrator/contracts";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import { getPostgresDatabase } from "../infra/postgres-client.js";
import { resolveBackendAuthProfile, warmBackendAuthProfile } from "../auth/jwt-common.js";
import { assertTrafficAllowed, createRateLimiterState } from "./rate-limiter.js";
import {
  blockedCheck,
  createReadinessResponse,
  evaluateConfigReadiness,
  evaluateDependencyCheck,
  logReadinessTransition,
  toDetailMessage
} from "./readiness.js";
import { getCorsHeaders, getSecurityHeaders, isCorsOriginAllowed } from "./headers.js";
import { isProbeRoute } from "./probe.js";

import type { RateLimitStore } from "../runtime/redis-rate-limit-store.js";

export interface BackendHardeningOptions {
  readonly config: BackendConfig;
  readonly logger?: AppLogger;
  readonly now?: () => Date;
  readonly services: BackendProductServices;
  readonly durableRateLimitStore?: RateLimitStore;
  readonly dependencyChecks?: Partial<{
    readonly auth: () => Effect.Effect<void, string>;
    readonly database: () => Effect.Effect<void, string>;
  }>;
}

export interface BackendHardeningContract {
  readonly assertTrafficAllowed: (input: {
    readonly method: string;
    readonly path: string;
    readonly origin?: string;
    readonly clientKey: string;
  }) => Effect.Effect<void, import("../http/errors.js").BackendReadinessError | import("../http/errors.js").BackendRequestRateLimitError>;
  readonly evaluateReadiness: () => Effect.Effect<ReadinessResponse>;
  readonly getCorsHeaders: (origin: string | undefined) => Readonly<Record<string, string>>;
  readonly getSecurityHeaders: () => Readonly<Record<string, string>>;
  readonly isProbeRoute: (path: string) => boolean;
  readonly isProductionStrict: boolean;
  readonly shouldShortCircuitPreflight: (origin: string | undefined) => boolean;
}

export function createBackendHardening(options: BackendHardeningOptions): BackendHardeningContract {
  const now = options.now ?? (() => new Date());
  const rateLimiter = createRateLimiterState(
    options.config.rateLimitMaxRequests ?? 60,
    options.config.rateLimitWindowMs ?? 60_000
  );
  const isProductionStrict = options.config.environment === "production";
  const readinessCacheTtlMs = options.config.readinessCacheTtlMs ?? 5_000;
  let readinessCache:
    | {
        readonly expiresAt: number;
        readonly snapshot: ReadinessResponse;
      }
    | undefined;
  let lastLoggedReadinessKey: string | undefined;

  const evaluateReadiness: BackendHardeningContract["evaluateReadiness"] = () =>
    Effect.gen(function* () {
      if (!isProductionStrict) {
        return createReadinessResponse(now(), options.config, {
          config: { status: "ready" },
          auth: { status: "ready" },
          database: { status: "ready" }
        });
      }

      if (readinessCache && readinessCache.expiresAt > now().getTime()) {
        return readinessCache.snapshot;
      }

      const configCheck = evaluateConfigReadiness(options.config);
      const authCheck = configCheck.status === "blocked"
        ? blockedCheck("Auth readiness skipped until config is fixed")
        : yield* evaluateDependencyCheck(
            options.dependencyChecks?.auth ?? (() => defaultAuthCheck(options.config)),
            "Auth bootstrap failed"
          );
      const databaseCheck = configCheck.status === "blocked"
        ? blockedCheck("Database readiness skipped until config is fixed")
        : yield* evaluateDependencyCheck(
            options.dependencyChecks?.database ?? (() => defaultDatabaseCheck(options.config, options.services)),
            "Database dependency is unavailable"
          );

      const snapshot = createReadinessResponse(now(), options.config, {
        config: configCheck,
        auth: authCheck,
        database: databaseCheck
      });

      readinessCache = {
        expiresAt: now().getTime() + readinessCacheTtlMs,
        snapshot
      };

      logReadinessTransition(options.logger, snapshot, () => lastLoggedReadinessKey, (value) => {
        lastLoggedReadinessKey = value;
      });

      return snapshot;
    });

  return {
    isProductionStrict,
    isProbeRoute,
    shouldShortCircuitPreflight(origin) {
      return typeof origin === "string" && origin.trim().length > 0 && isCorsOriginAllowed(options.config, origin, isProductionStrict);
    },
    getSecurityHeaders() {
      return getSecurityHeaders(isProductionStrict);
    },
    getCorsHeaders(origin) {
      return getCorsHeaders(isProductionStrict, options.config, origin);
    },
    evaluateReadiness,
    assertTrafficAllowed: (input) =>
      assertTrafficAllowed(input, {
        isProductionStrict,
        evaluateReadiness,
        rateLimiter,
        durableRateLimitStore: options.durableRateLimitStore,
        now
      })
  };
}

function defaultAuthCheck(config: BackendConfig): Effect.Effect<void, string> {
  return Effect.try({
    try: () => resolveBackendAuthProfile(config),
    catch: (error) => toDetailMessage(error, "Auth profile is invalid")
  }).pipe(
    Effect.flatMap((profile) =>
      warmBackendAuthProfile(profile).pipe(
        Effect.mapError((error) => error.message)
      )
    )
  );
}

function defaultDatabaseCheck(config: BackendConfig, services: BackendProductServices): Effect.Effect<void, string> {
  const postgres = getPostgresDatabase(services.database);
  if (config.databaseUrl && !postgres) {
    return Effect.fail("Production database is configured but the active client is not PostgreSQL-backed");
  }

  if (!postgres) {
    return Effect.sync(() => {
      services.database.snapshot();
    }).pipe(
      Effect.asVoid,
      Effect.mapError((error) => toDetailMessage(error, "In-memory database check failed"))
    );
  }

  return Effect.tryPromise({
    try: async () => {
      await sql`select 1`.execute(postgres);
    },
    catch: (error) => toDetailMessage(error, "PostgreSQL ping failed")
  });
}
