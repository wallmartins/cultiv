import { config as loadDotEnv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { RuntimeConfig } from "@my-ai-orchestrator/core";
import type { BackendAuthConfig } from "./config-auth.js";
import { readBackendAuthConfig, validateBackendAuthConfig } from "./config-auth.js";
import { dedupeStrings } from "../internal/utils.js";

declare const process: {
  readonly env: NodeJS.ProcessEnv;
  readonly cwd: () => string;
};

const backendBooleanLiterals = ["true", "false"] as const;
const backendEnvironments = ["development", "production", "test"] as const;
const backendExecutionModes = ["sync", "async"] as const;
const backendQualityModes = ["fast", "balanced", "strict"] as const;
const backendRequiredEnvVars = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "DEEPSEEK_API_KEY",
  "OLLAMA_BASE_URL"
] as const;

export type BackendRequiredEnvVar = (typeof backendRequiredEnvVars)[number];

export class BackendConfigValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Backend config validation failed: ${issues.join("; ")}`);
    this.name = "BackendConfigValidationError";
    this.issues = issues;
  }
}

export interface BackendConfig extends RuntimeConfig, BackendAuthConfig {
  readonly host: string;
  readonly port: number;
  readonly version: string;
  readonly billingUserId?: string;
  /** Dev-only bootstrap: seeds billing for `billingUserId` at startup. Runtime entitlements always come from the DB. */
  readonly billingPlanId?: string;
  readonly aiPolicyManifestPath?: string;
  readonly aiPolicyAttachedVersion?: string;
  readonly experimentalAIPolicyManifestPath?: string;
  readonly safetyPolicyManifestPath?: string;
  readonly experimentalDebugEnabled?: boolean;
  readonly aiPolicyReloadIntervalMs?: number;
  readonly readinessCacheTtlMs?: number;
  readonly corsAllowedOrigins?: readonly string[];
  readonly rateLimitWindowMs?: number;
  readonly rateLimitMaxRequests?: number;
  readonly databaseUrl?: string;
  readonly redisUrl?: string;
  readonly allowInMemoryRuntime?: boolean;
  readonly trustProxy?: boolean;
  readonly executionWorkerConcurrency?: number;
  readonly voiceDataProtectionKey?: string;
  readonly voiceDataProtectionPreviousKey?: string;
  readonly openAIApiKey?: string;
  readonly openAIBaseUrl?: string;
  readonly anthropicApiKey?: string;
  readonly anthropicBaseUrl?: string;
  readonly anthropicVersion?: string;
  readonly geminiApiKey?: string;
  readonly geminiBaseUrl?: string;
  readonly deepSeekApiKey?: string;
  readonly deepSeekBaseUrl?: string;
  readonly ollamaBaseUrl?: string;
}

export interface LoadBackendEnvironmentOptions {
  readonly env?: NodeJS.ProcessEnv;
  readonly envFilePath?: string;
  readonly override?: boolean;
  readonly mode?: "local" | "production";
  readonly cwd?: string;
}

export interface ReadValidatedBackendConfigOptions extends LoadBackendEnvironmentOptions {
  readonly envVars?: NodeJS.ProcessEnv;
  readonly loadEnvFile?: boolean;
  readonly requiredEnvVars?: readonly BackendRequiredEnvVar[];
}

export function bootstrapBackendConfig(
  options: ReadValidatedBackendConfigOptions = {}
): BackendConfig {
  return readValidatedBackendConfig(options);
}

export function readBackendConfig(envVars: NodeJS.ProcessEnv = process.env): BackendConfig {
  return {
    environment: readEnvironment(envVars.NODE_ENV),
    executionMode: envVars.EXECUTION_MODE === "async" ? "async" : "sync",
    qualityMode: readQualityMode(envVars.QUALITY_MODE),
    defaultLanguage: envVars.DEFAULT_LANGUAGE ?? "pt-BR",
    serviceName: envVars.SERVICE_NAME ?? "backend",
    host: envVars.HOST ?? "0.0.0.0",
    port: readPort(envVars.PORT),
    version: envVars.APP_VERSION ?? "0.1.0",
    ...readBackendAuthConfig(envVars),
    billingUserId: readOptionalString(envVars.BILLING_USER_ID),
    billingPlanId: readOptionalString(envVars.BILLING_PLAN_ID),
    aiPolicyManifestPath: readOptionalString(envVars.AI_POLICY_MANIFEST_PATH),
    aiPolicyAttachedVersion: readOptionalString(envVars.AI_POLICY_ATTACHED_VERSION),
    experimentalAIPolicyManifestPath: readOptionalString(envVars.EXPERIMENTAL_AI_POLICY_MANIFEST_PATH),
    safetyPolicyManifestPath: readOptionalString(envVars.SAFETY_POLICY_MANIFEST_PATH),
    experimentalDebugEnabled: envVars.EXPERIMENTAL_DEBUG_ENABLED === "true",
    aiPolicyReloadIntervalMs: readPositiveInteger(envVars.AI_POLICY_RELOAD_INTERVAL_MS),
    readinessCacheTtlMs: readPositiveInteger(envVars.READINESS_CACHE_TTL_MS),
    corsAllowedOrigins: readCsvList(envVars.CORS_ALLOWED_ORIGINS),
    rateLimitWindowMs: readPositiveInteger(envVars.RATE_LIMIT_WINDOW_MS),
    rateLimitMaxRequests: readPositiveInteger(envVars.RATE_LIMIT_MAX_REQUESTS),
    databaseUrl: readOptionalString(envVars.DATABASE_URL),
    redisUrl: readOptionalString(envVars.REDIS_URL),
    allowInMemoryRuntime: envVars.BACKEND_ALLOW_IN_MEMORY_RUNTIME === "true",
    trustProxy: readTrustProxy(envVars),
    executionWorkerConcurrency: readPositiveInteger(envVars.EXECUTION_WORKER_CONCURRENCY),
    voiceDataProtectionKey: readOptionalString(envVars.VOICE_DATA_PROTECTION_KEY),
    voiceDataProtectionPreviousKey: readOptionalString(envVars.VOICE_DATA_PROTECTION_KEY_PREVIOUS),
    openAIApiKey: readOptionalString(envVars.OPENAI_API_KEY),
    openAIBaseUrl: readOptionalString(envVars.OPENAI_BASE_URL),
    anthropicApiKey: readOptionalString(envVars.ANTHROPIC_API_KEY),
    anthropicBaseUrl: readOptionalString(envVars.ANTHROPIC_BASE_URL),
    anthropicVersion: readOptionalString(envVars.ANTHROPIC_VERSION),
    geminiApiKey: readOptionalString(envVars.GEMINI_API_KEY),
    geminiBaseUrl: readOptionalString(envVars.GEMINI_BASE_URL),
    deepSeekApiKey: readOptionalString(envVars.DEEPSEEK_API_KEY),
    deepSeekBaseUrl: readOptionalString(envVars.DEEPSEEK_BASE_URL),
    ollamaBaseUrl: readOptionalString(envVars.OLLAMA_BASE_URL)
  };
}

export function loadBackendEnvironment(options: LoadBackendEnvironmentOptions = {}): NodeJS.ProcessEnv {
  const env = options.env ?? process.env;
  const mode = options.mode ?? inferBackendEnvLoadMode(env);

  if (mode === "production") {
    return env;
  }

  const envPaths = resolveBackendEnvPaths(options);

  if (envPaths.length > 0) {
    loadDotEnv({
      processEnv: env,
      path: [...envPaths] as string[],
      override: options.override
    });
  }

  return env;
}

export function readValidatedBackendConfig(
  options: ReadValidatedBackendConfigOptions = {}
): BackendConfig {
  const envVars = options.envVars ?? options.env ?? process.env;

  const hydratedEnv = options.loadEnvFile === false
    ? envVars
    : loadBackendEnvironment({
        env: envVars,
        envFilePath: options.envFilePath,
        override: options.override,
        mode: options.mode
      });

  const config = readBackendConfig(hydratedEnv);
  validateBackendConfig(hydratedEnv, config, options.requiredEnvVars);
  return config;
}

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

function readEnvironment(value: string | undefined): BackendConfig["environment"] {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

function readQualityMode(value: string | undefined): BackendConfig["qualityMode"] {
  if (value === "fast" || value === "balanced" || value === "strict") {
    return value;
  }

  return "balanced";
}

function readPort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "3000", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3000;
}

function readPositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function isPositiveInteger(value: string): boolean {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0;
}

function inferBackendEnvLoadMode(envVars: NodeJS.ProcessEnv): "local" | "production" {
  return envVars.NODE_ENV === "production" ? "production" : "local";
}

function readTrustProxy(envVars: NodeJS.ProcessEnv): boolean | undefined {
  if (envVars.BACKEND_TRUST_PROXY === "true") {
    return true;
  }

  if (envVars.BACKEND_TRUST_PROXY === "false") {
    return false;
  }

  return envVars.NODE_ENV === "production" ? true : undefined;
}

function readOptionalString(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readCsvList(value: string | undefined): readonly string[] | undefined {
  if (!value) {
    return undefined;
  }

  const items = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return items.length > 0 ? dedupeStrings(items) : undefined;
}

function resolveBackendEnvPaths(options: LoadBackendEnvironmentOptions): readonly string[] {
  if (options.envFilePath) {
    return [options.envFilePath];
  }

  const cwd = options.cwd ?? process.cwd();
  const candidates = [
    resolve(cwd, ".env.local"),
    resolve(cwd, ".env"),
    resolve(backendPackageRoot, ".env.local"),
    resolve(backendPackageRoot, ".env"),
    resolve(repositoryRoot, ".env.local"),
    resolve(repositoryRoot, ".env")
  ];

  return dedupeStrings(candidates.filter((candidate) => existsSync(candidate)));
}

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);
const backendPackageRoot = resolve(currentDirectory, "../..");
const repositoryRoot = resolve(currentDirectory, "../../../..");
