#!/usr/bin/env tsx

// scripts/export-calibration-jobs.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname as dirname2, resolve as resolve2 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
import pg from "pg";

// src/config/config-env.ts
import { config as loadDotEnv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// src/config/config-auth.ts
function readBackendAuthConfig(envVars) {
  return {
    authIssuerUrl: normalizeIssuerUrl(readOptionalString(envVars.AUTH_ISSUER_URL)),
    authAudience: readOptionalString(envVars.AUTH_AUDIENCE),
    authJwksUrl: readOptionalString(envVars.AUTH_JWKS_URL),
    authClockToleranceSeconds: readPositiveInteger(envVars.AUTH_CLOCK_TOLERANCE_SECONDS),
    authJwksCacheTtlMs: readPositiveInteger(envVars.AUTH_JWKS_CACHE_TTL_MS)
  };
}
function validateBackendAuthConfig(args) {
  const issues = [];
  if (args.envVars.AUTH_ISSUER_URL && !isValidUrl(args.envVars.AUTH_ISSUER_URL)) {
    issues.push("AUTH_ISSUER_URL must be a valid URL");
  }
  if (args.envVars.AUTH_JWKS_URL && !isValidUrl(args.envVars.AUTH_JWKS_URL)) {
    issues.push("AUTH_JWKS_URL must be a valid URL");
  }
  if (args.environment === "production") {
    if (!args.config.authIssuerUrl) {
      issues.push("AUTH_ISSUER_URL is required in production");
    }
    if (!args.config.authAudience) {
      issues.push("AUTH_AUDIENCE is required in production");
    }
    if (!args.config.authJwksUrl) {
      issues.push("AUTH_JWKS_URL is required in production");
    }
  }
  return issues;
}
function readOptionalString(value) {
  if (!value) {
    return void 0;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : void 0;
}
function readPositiveInteger(value) {
  if (!value) {
    return void 0;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : void 0;
}
function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
function normalizeIssuerUrl(value) {
  if (!value) {
    return void 0;
  }
  const withProtocol = value.includes("://") ? value : `https://${value}`;
  const parsed = new URL(withProtocol);
  return `${parsed.origin}/`;
}

// src/internal/utils.ts
function dedupeStrings(values) {
  return [...new Set(values)];
}

// src/config/config-env.ts
function readBackendConfig(envVars = process.env) {
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
    billingUserId: readOptionalString2(envVars.BILLING_USER_ID),
    billingPlanId: readOptionalString2(envVars.BILLING_PLAN_ID),
    aiPolicyManifestPath: readOptionalString2(envVars.AI_POLICY_MANIFEST_PATH),
    aiPolicyAttachedVersion: readOptionalString2(envVars.AI_POLICY_ATTACHED_VERSION),
    experimentalAIPolicyManifestPath: readOptionalString2(envVars.EXPERIMENTAL_AI_POLICY_MANIFEST_PATH),
    safetyPolicyManifestPath: readOptionalString2(envVars.SAFETY_POLICY_MANIFEST_PATH),
    experimentalDebugEnabled: envVars.EXPERIMENTAL_DEBUG_ENABLED === "true",
    reasoningSignatureV1Enabled: envVars.VOICE_REASONING_SIGNATURE_V1 === "true",
    aiPolicyReloadIntervalMs: readPositiveInteger2(envVars.AI_POLICY_RELOAD_INTERVAL_MS),
    readinessCacheTtlMs: readPositiveInteger2(envVars.READINESS_CACHE_TTL_MS),
    corsAllowedOrigins: readCsvList(envVars.CORS_ALLOWED_ORIGINS),
    rateLimitWindowMs: readPositiveInteger2(envVars.RATE_LIMIT_WINDOW_MS),
    rateLimitMaxRequests: readPositiveInteger2(envVars.RATE_LIMIT_MAX_REQUESTS),
    databaseUrl: readOptionalString2(envVars.DATABASE_URL),
    redisUrl: readOptionalString2(envVars.REDIS_URL),
    allowInMemoryRuntime: envVars.BACKEND_ALLOW_IN_MEMORY_RUNTIME === "true",
    trustProxy: readTrustProxy(envVars),
    executionWorkerConcurrency: readPositiveInteger2(envVars.EXECUTION_WORKER_CONCURRENCY),
    voiceDataProtectionKey: readOptionalString2(envVars.VOICE_DATA_PROTECTION_KEY),
    voiceDataProtectionPreviousKey: readOptionalString2(envVars.VOICE_DATA_PROTECTION_KEY_PREVIOUS),
    openAIApiKey: readOptionalString2(envVars.OPENAI_API_KEY),
    openAIBaseUrl: readOptionalString2(envVars.OPENAI_BASE_URL),
    anthropicApiKey: readOptionalString2(envVars.ANTHROPIC_API_KEY),
    anthropicBaseUrl: readOptionalString2(envVars.ANTHROPIC_BASE_URL),
    anthropicVersion: readOptionalString2(envVars.ANTHROPIC_VERSION),
    geminiApiKey: readOptionalString2(envVars.GEMINI_API_KEY),
    geminiBaseUrl: readOptionalString2(envVars.GEMINI_BASE_URL),
    deepSeekApiKey: readOptionalString2(envVars.DEEPSEEK_API_KEY),
    deepSeekBaseUrl: readOptionalString2(envVars.DEEPSEEK_BASE_URL),
    groqApiKey: readOptionalString2(envVars.GROQ_API_KEY),
    groqBaseUrl: readOptionalString2(envVars.GROQ_BASE_URL),
    ollamaBaseUrl: readOptionalString2(envVars.OLLAMA_BASE_URL),
    stripeSecretKey: readOptionalString2(envVars.STRIPE_SECRET_KEY),
    stripeWebhookSecret: readOptionalString2(envVars.STRIPE_WEBHOOK_SECRET),
    asaasApiKey: readOptionalString2(envVars.ASAAS_API_KEY),
    asaasWebhookToken: readOptionalString2(envVars.ASAAS_WEBHOOK_TOKEN),
    asaasBaseUrl: readOptionalString2(envVars.ASAAS_BASE_URL),
    billingCheckoutSuccessUrl: readOptionalString2(envVars.BILLING_CHECKOUT_SUCCESS_URL),
    billingCheckoutCancelUrl: readOptionalString2(envVars.BILLING_CHECKOUT_CANCEL_URL)
  };
}
function loadBackendEnvironment(options = {}) {
  const env = options.env ?? process.env;
  const mode = options.mode ?? inferBackendEnvLoadMode(env);
  if (mode === "production") {
    return env;
  }
  const envPaths = resolveBackendEnvPaths(options);
  if (envPaths.length > 0) {
    loadDotEnv({
      processEnv: env,
      path: [...envPaths],
      override: options.override
    });
  }
  return env;
}
function isPositiveInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0;
}
function readEnvironment(value) {
  if (value === "production" || value === "test") {
    return value;
  }
  return "development";
}
function readQualityMode(value) {
  if (value === "fast" || value === "balanced" || value === "strict") {
    return value;
  }
  return "balanced";
}
function readPort(value) {
  const parsed = Number.parseInt(value ?? "3000", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3e3;
}
function readPositiveInteger2(value) {
  if (!value) {
    return void 0;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : void 0;
}
function inferBackendEnvLoadMode(envVars) {
  return envVars.NODE_ENV === "production" ? "production" : "local";
}
function readTrustProxy(envVars) {
  if (envVars.BACKEND_TRUST_PROXY === "true") {
    return true;
  }
  if (envVars.BACKEND_TRUST_PROXY === "false") {
    return false;
  }
  return envVars.NODE_ENV === "production" ? true : void 0;
}
function readOptionalString2(value) {
  if (!value) {
    return void 0;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : void 0;
}
function readCsvList(value) {
  if (!value) {
    return void 0;
  }
  const items = value.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  return items.length > 0 ? dedupeStrings(items) : void 0;
}
function resolveBackendEnvPaths(options) {
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
var currentFilePath = fileURLToPath(import.meta.url);
var currentDirectory = dirname(currentFilePath);
var backendPackageRoot = resolve(currentDirectory, "../..");
var repositoryRoot = resolve(currentDirectory, "../../../..");

// src/config/config-schema.ts
var BackendConfigValidationError = class extends Error {
  issues;
  constructor(issues) {
    super(`Backend config validation failed: ${issues.join("; ")}`);
    this.name = "BackendConfigValidationError";
    this.issues = issues;
  }
};

// src/config/config-validate.ts
var backendBooleanLiterals = ["true", "false"];
var backendEnvironments = ["development", "production", "test"];
var backendExecutionModes = ["sync", "async"];
var backendQualityModes = ["fast", "balanced", "strict"];
function validateBackendConfig(envVars, config, requiredEnvVars = []) {
  const issues = [];
  if (!config.serviceName.trim()) {
    issues.push("SERVICE_NAME must not be empty");
  }
  if (!config.host.trim()) {
    issues.push("HOST must not be empty");
  }
  if (!config.version.trim()) {
    issues.push("APP_VERSION must not be empty");
  }
  if (envVars.NODE_ENV && !backendEnvironments.includes(envVars.NODE_ENV)) {
    issues.push(`NODE_ENV must be one of: ${backendEnvironments.join(", ")}`);
  }
  if (envVars.EXECUTION_MODE && !backendExecutionModes.includes(envVars.EXECUTION_MODE)) {
    issues.push(`EXECUTION_MODE must be one of: ${backendExecutionModes.join(", ")}`);
  }
  if (envVars.QUALITY_MODE && !backendQualityModes.includes(envVars.QUALITY_MODE)) {
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
  if (envVars.EXPERIMENTAL_DEBUG_ENABLED && !backendBooleanLiterals.includes(envVars.EXPERIMENTAL_DEBUG_ENABLED)) {
    issues.push('EXPERIMENTAL_DEBUG_ENABLED must be either "true" or "false"');
  }
  if (envVars.BACKEND_TRUST_PROXY && !backendBooleanLiterals.includes(envVars.BACKEND_TRUST_PROXY)) {
    issues.push('BACKEND_TRUST_PROXY must be either "true" or "false"');
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
    if (config.voiceDataProtectionPreviousKey && config.voiceDataProtectionKey && config.voiceDataProtectionPreviousKey === config.voiceDataProtectionKey) {
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

// src/config/config.ts
function bootstrapBackendConfig(options = {}) {
  return readValidatedBackendConfig(options);
}
function readValidatedBackendConfig(options = {}) {
  const envVars = options.envVars ?? options.env ?? process.env;
  const hydratedEnv = options.loadEnvFile === false ? envVars : loadBackendEnvironment({
    env: envVars,
    envFilePath: options.envFilePath,
    override: options.override,
    mode: options.mode
  });
  const config = readBackendConfig(hydratedEnv);
  validateBackendConfig(hydratedEnv, config, options.requiredEnvVars);
  return config;
}

// scripts/calibration/load-env.ts
function loadCalibrationEnvironment() {
  loadBackendEnvironment({ mode: "local" });
}

// scripts/export-calibration-jobs.ts
var { Client } = pg;
var repoRoot = resolve2(fileURLToPath2(new URL("../../..", import.meta.url)));
async function main() {
  loadCalibrationEnvironment();
  const config = bootstrapBackendConfig({ loadEnvFile: false });
  const databaseUrl = process.env.DATABASE_URL ?? config.databaseUrl;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required. Set it in the environment or .env file.");
    process.exit(1);
  }
  const outPath = resolve2(
    repoRoot,
    process.argv[2] ?? "tests/fixtures/billing/calibration-jobs-production.json"
  );
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const result = await client.query(
    `SELECT id, data FROM jobs WHERE data->>'status' = 'done' ORDER BY created_at ASC`
  );
  await client.end();
  const jobs = result.rows.map((row) => ({
    id: row.id,
    ...typeof row.data === "string" ? JSON.parse(row.data) : row.data
  }));
  mkdirSync(dirname2(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(jobs, null, 2)}
`);
  console.log(`Exported ${jobs.length} completed job(s) to ${outPath}`);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
//# sourceMappingURL=export-calibration-jobs.js.map
