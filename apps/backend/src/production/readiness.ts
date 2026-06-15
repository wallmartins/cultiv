import { Effect } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { ReadinessCheck, ReadinessResponse } from "@my-ai-orchestrator/contracts";
import type { BackendConfig } from "../config/config.js";

export function createReadinessResponse(
  now: Date,
  config: BackendConfig,
  checks: Readonly<{
    config: ReadinessCheck;
    auth: ReadinessCheck;
    database: ReadinessCheck;
  }>
): ReadinessResponse {
  return {
    status: [checks.config, checks.auth, checks.database].every((check) => check.status === "ready")
      ? "ready"
      : "blocked",
    time: now.toISOString(),
    service: {
      environment: config.environment,
      version: config.version
    },
    checks
  };
}

export function evaluateConfigReadiness(config: BackendConfig): ReadinessCheck {
  const issues: string[] = [];

  if (!config.databaseUrl) {
    issues.push("DATABASE_URL is required in production");
  }

  if (!config.authIssuerUrl) {
    issues.push("AUTH_ISSUER_URL is required in production");
  }

  if (!config.authAudience) {
    issues.push("AUTH_AUDIENCE is required in production");
  }

  if (!config.authJwksUrl) {
    issues.push("AUTH_JWKS_URL is required in production");
  }

  if (issues.length > 0) {
    return blockedCheck(issues.join("; "));
  }

  return { status: "ready" };
}

export function blockedCheck(detail: string): ReadinessCheck {
  return {
    status: "blocked",
    detail
  };
}

export function evaluateDependencyCheck(
  check: () => Effect.Effect<void, string>,
  fallbackMessage: string
): Effect.Effect<ReadinessCheck> {
  return check().pipe(
    Effect.as<ReadinessCheck>({ status: "ready" }),
    Effect.catchAll((detail) => Effect.succeed(blockedCheck(detail || fallbackMessage)))
  );
}

export function resolveBlockedReason(checks: ReadinessResponse["checks"]): "config" | "auth" | "database" {
  if (checks.config.status === "blocked") {
    return "config";
  }

  if (checks.auth.status === "blocked") {
    return "auth";
  }

  return "database";
}

export function resolveBlockedReadinessMessage(checks: ReadinessResponse["checks"]): string {
  const blockedCheck = [checks.config, checks.auth, checks.database].find((check) => check.status === "blocked");
  return blockedCheck?.detail ?? "Service is not ready for traffic";
}

export function logReadinessTransition(
  logger: AppLogger | undefined,
  snapshot: ReadinessResponse,
  getLastKey: () => string | undefined,
  setLastKey: (value: string) => void
) {
  const nextKey = JSON.stringify(snapshot);
  if (!logger || getLastKey() === nextKey) {
    return;
  }

  setLastKey(nextKey);
  const log = snapshot.status === "ready" ? logger.info.bind(logger) : logger.warn.bind(logger);
  log("Backend readiness evaluated", {
    readinessStatus: snapshot.status,
    checks: snapshot.checks
  });
}

export function toDetailMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallback;
}
