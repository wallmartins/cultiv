import { config as loadDotEnv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readBackendAuthConfig } from "./config-auth.js";
import type { BackendConfig, LoadBackendEnvironmentOptions } from "./config-schema.js";
import { dedupeStrings } from "../internal/utils.js";

declare const process: {
  readonly env: NodeJS.ProcessEnv;
  readonly cwd: () => string;
};

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
    reasoningSignatureV1Enabled: envVars.VOICE_REASONING_SIGNATURE_V1 === "true",
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
    groqApiKey: readOptionalString(envVars.GROQ_API_KEY),
    groqBaseUrl: readOptionalString(envVars.GROQ_BASE_URL),
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

export function isPositiveInteger(value: string): boolean {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0;
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
