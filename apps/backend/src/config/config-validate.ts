import { validateBackendAuthConfig } from "./config-auth.js";
import { isPositiveInteger } from "./config-env.js";
import type { BackendConfig, BackendRequiredEnvVar } from "./config-schema.js";
import { BackendConfigValidationError } from "./config-schema.js";

const backendBooleanLiterals = ["true", "false"] as const;
const backendEnvironments = ["development", "production", "test"] as const;
const backendExecutionModes = ["sync", "async"] as const;
const backendQualityModes = ["fast", "balanced", "strict"] as const;

export function validateBackendConfig(
  envVars: NodeJS.ProcessEnv,
  config: BackendConfig,
  requiredEnvVars: readonly BackendRequiredEnvVar[] = []
): void {
  const issues: string[] = [];

  if (!config.serviceName.trim()) {
    issues.push("SERVICE_NAME must not be empty");
  }

  if (!config.host.trim()) {
    issues.push("HOST must not be empty");
  }

  if (!config.version.trim()) {
    issues.push("APP_VERSION must not be empty");
  }

  if (envVars.NODE_ENV && !backendEnvironments.includes(envVars.NODE_ENV as (typeof backendEnvironments)[number])) {
    issues.push(`NODE_ENV must be one of: ${backendEnvironments.join(", ")}`);
  }

  if (
    envVars.EXECUTION_MODE &&
    !backendExecutionModes.includes(envVars.EXECUTION_MODE as (typeof backendExecutionModes)[number])
  ) {
    issues.push(`EXECUTION_MODE must be one of: ${backendExecutionModes.join(", ")}`);
  }

  if (envVars.QUALITY_MODE && !backendQualityModes.includes(envVars.QUALITY_MODE as (typeof backendQualityModes)[number])) {
    issues.push(`QUALITY_MODE must be one of: ${backendQualityModes.join(", ")}`);
  }

  if (envVars.PORT && !isPositiveInteger(envVars.PORT)) {
    issues.push("PORT must be a positive integer");
  }

  if (envVars.AI_POLICY_RELOAD_INTERVAL_MS && !isPositiveInteger(envVars.AI_POLICY_RELOAD_INTERVAL_MS)) {
    issues.push("AI_POLICY_RELOAD_INTERVAL_MS must be a positive integer");
  }

  if (envVars.READINESS_CACHE_TTL_MS && !isPositiveInteger(envVars.READINESS_CACHE_TTL_MS)) {
    issues.push("READINESS_CACHE_TTL_MS must be a positive integer");
  }

  if (envVars.RATE_LIMIT_WINDOW_MS && !isPositiveInteger(envVars.RATE_LIMIT_WINDOW_MS)) {
    issues.push("RATE_LIMIT_WINDOW_MS must be a positive integer");
  }

  if (envVars.RATE_LIMIT_MAX_REQUESTS && !isPositiveInteger(envVars.RATE_LIMIT_MAX_REQUESTS)) {
    issues.push("RATE_LIMIT_MAX_REQUESTS must be a positive integer");
  }

  if (
    envVars.EXPERIMENTAL_DEBUG_ENABLED &&
    !backendBooleanLiterals.includes(envVars.EXPERIMENTAL_DEBUG_ENABLED as (typeof backendBooleanLiterals)[number])
  ) {
    issues.push("EXPERIMENTAL_DEBUG_ENABLED must be either \"true\" or \"false\"");
  }

  if (
    envVars.COMPOSITOR_V1_ENABLED &&
    !backendBooleanLiterals.includes(envVars.COMPOSITOR_V1_ENABLED as (typeof backendBooleanLiterals)[number])
  ) {
    issues.push("COMPOSITOR_V1_ENABLED must be either \"true\" or \"false\"");
  }

  if (
    envVars.BACKEND_TRUST_PROXY &&
    !backendBooleanLiterals.includes(envVars.BACKEND_TRUST_PROXY as (typeof backendBooleanLiterals)[number])
  ) {
    issues.push("BACKEND_TRUST_PROXY must be either \"true\" or \"false\"");
  }

  for (const envVar of requiredEnvVars) {
    if (!envVars[envVar] || envVars[envVar]?.trim().length === 0) {
      issues.push(`${envVar} is required`);
    }
  }

  if (config.environment === "production" && !config.databaseUrl) {
    issues.push("DATABASE_URL is required in production");
  }

  if (config.environment === "production" && !config.redisUrl) {
    issues.push("REDIS_URL is required in production");
  }

  if (config.environment === "production") {
    if (config.allowInMemoryRuntime) {
      issues.push("BACKEND_ALLOW_IN_MEMORY_RUNTIME must not be true in production");
    }

    if (config.executionMode !== "async") {
      issues.push("EXECUTION_MODE must be async in production");
    }

    if (!config.corsAllowedOrigins || config.corsAllowedOrigins.length === 0) {
      issues.push("CORS_ALLOWED_ORIGINS is required in production");
    }

    if (!config.voiceDataProtectionKey) {
      issues.push("VOICE_DATA_PROTECTION_KEY is required in production");
    } else if (config.voiceDataProtectionKey.length < 32) {
      issues.push("VOICE_DATA_PROTECTION_KEY must be at least 32 characters in production");
    }

    if (config.voiceDataProtectionPreviousKey && config.voiceDataProtectionPreviousKey.length < 32) {
      issues.push("VOICE_DATA_PROTECTION_KEY_PREVIOUS must be at least 32 characters when set");
    }

    if (
      config.voiceDataProtectionPreviousKey &&
      config.voiceDataProtectionKey &&
      config.voiceDataProtectionPreviousKey === config.voiceDataProtectionKey
    ) {
      issues.push("VOICE_DATA_PROTECTION_KEY_PREVIOUS must differ from VOICE_DATA_PROTECTION_KEY");
    }
  }

  if (config.environment === "development" && !config.allowInMemoryRuntime) {
    if (!config.databaseUrl) {
      issues.push("DATABASE_URL is required in development unless BACKEND_ALLOW_IN_MEMORY_RUNTIME=true");
    }
    if (!config.redisUrl) {
      issues.push("REDIS_URL is required in development unless BACKEND_ALLOW_IN_MEMORY_RUNTIME=true");
    }
  }

  issues.push(...validateBackendAuthConfig({
    config,
    environment: config.environment,
    envVars
  }));

  if (issues.length > 0) {
    throw new BackendConfigValidationError(issues);
  }
}
