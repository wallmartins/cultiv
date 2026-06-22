// src/cli/rotate-voice-protection-key.ts
import { Effect as Effect4 } from "effect";
import { Kysely as Kysely2, PostgresDialect as PostgresDialect2 } from "kysely";

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
    compositorV1Enabled: envVars.COMPOSITOR_V1_ENABLED === "true",
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
  if (envVars.COMPOSITOR_V1_ENABLED && !backendBooleanLiterals.includes(envVars.COMPOSITOR_V1_ENABLED)) {
    issues.push('COMPOSITOR_V1_ENABLED must be either "true" or "false"');
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

// src/infra/postgres-bootstrap.ts
import { Effect } from "effect";
import { Kysely, PostgresDialect } from "kysely";
function createPostgresBootstrapError(message, cause) {
  return { _tag: "PostgresBootstrapError", message, cause };
}
function createPostgresPoolConfig(databaseUrl) {
  return {
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 3e4,
    connectionTimeoutMillis: 5e3
  };
}
function acquirePostgresPool(databaseUrl) {
  return Effect.gen(function* () {
    if (!databaseUrl || databaseUrl.trim().length === 0) {
      return yield* Effect.fail(
        createPostgresBootstrapError("DATABASE_URL is empty")
      );
    }
    const { Pool: PgPool } = yield* Effect.tryPromise({
      try: () => import("pg"),
      catch: (e) => createPostgresBootstrapError("Failed to import pg module", e)
    });
    const poolConfig = createPostgresPoolConfig(databaseUrl);
    const pool = new PgPool(poolConfig);
    yield* Effect.tryPromise({
      try: () => pool.query("SELECT 1"),
      catch: (e) => createPostgresBootstrapError(
        "Failed to connect to PostgreSQL",
        e
      )
    });
    return pool;
  });
}
function releasePostgresPool(pool) {
  return Effect.promise(() => pool.end());
}

// src/safety/voice-field-protection-rotation.ts
import { Effect as Effect3 } from "effect";

// src/safety/voice-field-protection.ts
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Effect as Effect2 } from "effect";

// src/http/errors.ts
import { Data } from "effect";
var BackendRequestBodyParseError = class extends Data.TaggedError("BackendRequestBodyParseError") {
};
var BackendValidationError = class extends Data.TaggedError("BackendValidationError") {
};
var BackendReadinessError = class extends Data.TaggedError("BackendReadinessError") {
};
var BackendRequestRateLimitError = class extends Data.TaggedError("BackendRequestRateLimitError") {
};
var BackendAuthenticationError = class extends Data.TaggedError("BackendAuthenticationError") {
};
var BackendAuthorizationError = class extends Data.TaggedError("BackendAuthorizationError") {
};
var BackendJobNotFoundError = class extends Data.TaggedError("BackendJobNotFoundError") {
};
var BackendVoiceProfileNotFoundError = class extends Data.TaggedError("BackendVoiceProfileNotFoundError") {
};
var BackendVoiceExampleNotFoundError = class extends Data.TaggedError("BackendVoiceExampleNotFoundError") {
};
var BackendExecutionNotFoundError = class extends Data.TaggedError("BackendExecutionNotFoundError") {
};
var BackendResponseValidationError = class extends Data.TaggedError("BackendResponseValidationError") {
};
var BackendExecutionConflictError = class extends Data.TaggedError("BackendExecutionConflictError") {
};
var BackendExecutionFailedError = class extends Data.TaggedError("BackendExecutionFailedError") {
};
var BackendExecutionIntegrityError = class extends Data.TaggedError("BackendExecutionIntegrityError") {
};
var BackendUsageAuthorizationError = class extends Data.TaggedError("BackendUsageAuthorizationError") {
};
var BackendExperimentalAccessError = class extends Data.TaggedError("BackendExperimentalAccessError") {
};
var BackendAIPolicyLoadError = class extends Data.TaggedError("BackendAIPolicyLoadError") {
};
var BackendAIPolicyValidationError = class extends Data.TaggedError("BackendAIPolicyValidationError") {
};
var BackendAIPolicyCatalogError = class extends Data.TaggedError("BackendAIPolicyCatalogError") {
};
var BackendAIPolicyPricingError = class extends Data.TaggedError("BackendAIPolicyPricingError") {
};
var BackendSafetyPolicyLoadError = class extends Data.TaggedError("BackendSafetyPolicyLoadError") {
};
var BackendSafetyPolicyValidationError = class extends Data.TaggedError("BackendSafetyPolicyValidationError") {
};
var BackendSafetyPolicyDefinitionError = class extends Data.TaggedError("BackendSafetyPolicyDefinitionError") {
};
var BackendInputSafetyGatewayFailureError = class extends Data.TaggedError("BackendInputSafetyGatewayFailureError") {
};
var BackendInputSafetyPolicyError = class extends Data.TaggedError("BackendInputSafetyPolicyError") {
};
var BackendInstructionOverrideDetectorFailureError = class extends Data.TaggedError("BackendInstructionOverrideDetectorFailureError") {
};
var BackendStepScopeViolationError = class extends Data.TaggedError("BackendStepScopeViolationError") {
};
var BackendUserSuspendedError = class extends Data.TaggedError("BackendUserSuspendedError") {
};
var BackendVoiceTrainingConsentRequiredError = class extends Data.TaggedError("BackendVoiceTrainingConsentRequiredError") {
};
var BackendVoiceTrainingConsentFailureError = class extends Data.TaggedError("BackendVoiceTrainingConsentFailureError") {
};
var BackendGenerationQuoteMismatchError = class extends Data.TaggedError("BackendGenerationQuoteMismatchError") {
};
var BackendOutputReleaseGateFailureError = class extends Data.TaggedError("BackendOutputReleaseGateFailureError") {
};
var BackendOutputReleasePolicyError = class extends Data.TaggedError("BackendOutputReleasePolicyError") {
};
var BackendOperationalOverrideStateError = class extends Data.TaggedError("BackendOperationalOverrideStateError") {
};
var BackendBillingNotConfiguredError = class extends Data.TaggedError("BackendBillingNotConfiguredError") {
};

// src/safety/voice-field-protection.ts
var protectedVoiceFieldPrefix = "voiceprot:v1:";
var cipherAlgorithm = "aes-256-gcm";
var ivLength = 12;
var authTagLength = 16;
function isProtectedVoiceField(value) {
  return typeof value === "string" && value.startsWith(protectedVoiceFieldPrefix);
}
function createBackendVoiceFieldProtectionService(options) {
  const key = deriveProtectionKey(options.keyMaterial);
  const previousKey = options.previousKeyMaterial ? deriveProtectionKey(options.previousKeyMaterial) : void 0;
  return {
    protectVoiceExample: (record) => Effect2.gen(function* () {
      const text = yield* protectStringField(record.userId, "voice_example.text", record.text, key);
      const context = yield* protectOptionalStringField(record.userId, "voice_example.context", record.context, key);
      return {
        ...record,
        text,
        context
      };
    }),
    unprotectVoiceExample: (record) => Effect2.gen(function* () {
      const text = yield* unprotectStringFieldWithFallback(
        record.userId,
        "voice_example.text",
        record.text,
        key,
        previousKey
      );
      const context = yield* unprotectOptionalStringFieldWithFallback(
        record.userId,
        "voice_example.context",
        record.context,
        key,
        previousKey
      );
      return {
        ...record,
        text,
        context
      };
    }),
    protectVoiceExampleBatch: (record) => Effect2.gen(function* () {
      const items = yield* Effect2.forEach(record.items, (item) => {
        if (!item.stagedInput) {
          return Effect2.succeed(item);
        }
        return Effect2.gen(function* () {
          const stagedInput = item.stagedInput;
          const protectedText = yield* protectStringField(
            record.userId,
            "voice_example_batch.staged_input.text",
            stagedInput.text,
            key
          );
          const protectedContext = yield* protectOptionalStringField(
            record.userId,
            "voice_example_batch.staged_input.context",
            stagedInput.context,
            key
          );
          return {
            ...item,
            stagedInput: {
              ...stagedInput,
              text: protectedText,
              context: protectedContext
            }
          };
        });
      }, { concurrency: 1 });
      return {
        ...record,
        items
      };
    }),
    unprotectVoiceExampleBatch: (record) => Effect2.gen(function* () {
      const items = yield* Effect2.forEach(record.items, (item) => {
        if (!item.stagedInput) {
          return Effect2.succeed(item);
        }
        return Effect2.gen(function* () {
          const stagedInput = item.stagedInput;
          const text = yield* unprotectStringFieldWithFallback(
            record.userId,
            "voice_example_batch.staged_input.text",
            stagedInput.text,
            key,
            previousKey
          );
          const context = yield* unprotectOptionalStringFieldWithFallback(
            record.userId,
            "voice_example_batch.staged_input.context",
            stagedInput.context,
            key,
            previousKey
          );
          return {
            ...item,
            stagedInput: {
              ...stagedInput,
              text,
              context
            }
          };
        });
      }, { concurrency: 1 });
      return {
        ...record,
        items
      };
    })
  };
}
function deriveProtectionKey(keyMaterial) {
  return createHash("sha256").update(keyMaterial).digest();
}
function protectOptionalStringField(userId, fieldName, value, key) {
  if (value === void 0) {
    return Effect2.succeed(void 0);
  }
  return protectStringField(userId, fieldName, value, key);
}
function unprotectOptionalStringFieldWithFallback(userId, fieldName, value, key, previousKey) {
  if (value === void 0) {
    return Effect2.succeed(void 0);
  }
  return unprotectStringFieldWithFallback(userId, fieldName, value, key, previousKey);
}
function protectStringField(userId, fieldName, value, key) {
  return Effect2.try({
    try: () => {
      const iv = randomBytes(ivLength);
      const cipher = createCipheriv(cipherAlgorithm, key, iv);
      const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return `${protectedVoiceFieldPrefix}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
    },
    catch: (cause) => new BackendVoiceTrainingConsentFailureError({
      userId,
      reason: "protection_failed",
      message: `Failed to protect persisted voice field "${fieldName}": ${cause instanceof Error ? cause.message : String(cause)}`
    })
  });
}
function unprotectStringFieldWithFallback(userId, fieldName, value, key, previousKey) {
  if (!isProtectedVoiceField(value)) {
    return Effect2.succeed(value);
  }
  return decryptProtectedString(userId, fieldName, value, key).pipe(
    Effect2.catchAll((currentError) => {
      if (!previousKey) {
        return Effect2.fail(currentError);
      }
      return decryptProtectedString(userId, fieldName, value, previousKey);
    })
  );
}
function decryptProtectedString(userId, fieldName, value, key) {
  return Effect2.try({
    try: () => {
      const payload = value.slice(protectedVoiceFieldPrefix.length);
      const [ivEncoded, authTagEncoded, encryptedEncoded] = payload.split(":");
      if (!ivEncoded || !authTagEncoded || !encryptedEncoded) {
        return failMalformedProtectedPayload();
      }
      const iv = Buffer.from(ivEncoded, "base64");
      const authTag = Buffer.from(authTagEncoded, "base64");
      const encrypted = Buffer.from(encryptedEncoded, "base64");
      if (iv.length !== ivLength || authTag.length !== authTagLength) {
        return failMalformedProtectedPayload();
      }
      const decipher = createDecipheriv(cipherAlgorithm, key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString("utf8");
    },
    catch: (cause) => new BackendVoiceTrainingConsentFailureError({
      userId,
      reason: "protection_failed",
      message: `Failed to unprotect persisted voice field "${fieldName}": ${cause instanceof Error ? cause.message : String(cause)}`
    })
  });
}
function failMalformedProtectedPayload() {
  throw new Error("Malformed protected payload");
}

// src/safety/voice-field-protection-rotation.ts
function createVoiceFieldProtectionRotationError(message, entityType, entityId, cause) {
  return { _tag: "VoiceFieldProtectionRotationError", message, entityType, entityId, cause };
}
function rotateVoiceFieldProtectionInDatabase(args) {
  const dryRun = args.dryRun ?? false;
  const encryptPlaintext = args.encryptPlaintext ?? false;
  const readProtection = createBackendVoiceFieldProtectionService(args.keys);
  const writeProtection = createBackendVoiceFieldProtectionService({
    keyMaterial: args.keys.keyMaterial
  });
  return Effect3.gen(function* () {
    let voiceExamplesRotated = 0;
    let voiceExampleBatchesRotated = 0;
    const exampleRows = yield* Effect3.tryPromise({
      try: () => args.db.selectFrom("voice_examples").selectAll().execute(),
      catch: (cause) => createVoiceFieldProtectionRotationError("Failed to list voice examples", "voice_example", "*", cause)
    });
    for (const row of exampleRows) {
      const record = parseVoiceExampleRow(row);
      if (!voiceExampleQualifiesForProtectionRotation(record, encryptPlaintext)) {
        continue;
      }
      const rotated = yield* rotateVoiceExampleRecord(record, readProtection, writeProtection).pipe(
        Effect3.mapError(
          (error) => createVoiceFieldProtectionRotationError(
            error.message,
            "voice_example",
            record.id,
            error
          )
        )
      );
      if (!dryRun) {
        yield* persistVoiceExampleRow(args.db, rotated);
      }
      voiceExamplesRotated += 1;
    }
    const batchRows = yield* Effect3.tryPromise({
      try: () => args.db.selectFrom("voice_example_batches").selectAll().execute(),
      catch: (cause) => createVoiceFieldProtectionRotationError("Failed to list voice example batches", "voice_example_batch", "*", cause)
    });
    for (const row of batchRows) {
      const record = parseVoiceExampleBatchRow(row);
      if (!voiceExampleBatchQualifiesForProtectionRotation(record, encryptPlaintext)) {
        continue;
      }
      const rotated = yield* rotateVoiceExampleBatchRecord(record, readProtection, writeProtection).pipe(
        Effect3.mapError(
          (error) => createVoiceFieldProtectionRotationError(
            error.message,
            "voice_example_batch",
            record.id,
            error
          )
        )
      );
      if (!dryRun) {
        yield* persistVoiceExampleBatchRow(args.db, rotated);
      }
      voiceExampleBatchesRotated += 1;
    }
    return {
      dryRun,
      encryptPlaintext,
      voiceExamplesScanned: exampleRows.length,
      voiceExamplesRotated,
      voiceExampleBatchesScanned: batchRows.length,
      voiceExampleBatchesRotated
    };
  });
}
function rotateVoiceExampleRecord(record, readProtection, writeProtection) {
  return Effect3.gen(function* () {
    const plaintext = yield* readProtection.unprotectVoiceExample(record);
    const reprotected = yield* writeProtection.protectVoiceExample(plaintext);
    return {
      ...reprotected,
      version: record.version + 1
    };
  });
}
function rotateVoiceExampleBatchRecord(record, readProtection, writeProtection) {
  return Effect3.gen(function* () {
    const plaintext = yield* readProtection.unprotectVoiceExampleBatch(record);
    const reprotected = yield* writeProtection.protectVoiceExampleBatch(plaintext);
    return {
      ...reprotected,
      version: record.version + 1
    };
  });
}
function voiceExampleQualifiesForProtectionRotation(record, encryptPlaintext) {
  if (isProtectedVoiceField(record.text) || isProtectedVoiceField(record.context)) {
    return true;
  }
  if (!encryptPlaintext) {
    return false;
  }
  return hasPlaintextVoiceField(record.text) || hasPlaintextVoiceField(record.context);
}
function voiceExampleBatchQualifiesForProtectionRotation(record, encryptPlaintext) {
  return record.items.some(
    (item) => voiceExampleBatchItemQualifiesForProtectionRotation(item.stagedInput, encryptPlaintext)
  );
}
function voiceExampleBatchItemQualifiesForProtectionRotation(stagedInput, encryptPlaintext) {
  if (!stagedInput) {
    return false;
  }
  if (isProtectedVoiceField(stagedInput.text) || isProtectedVoiceField(stagedInput.context)) {
    return true;
  }
  if (!encryptPlaintext) {
    return false;
  }
  return hasPlaintextVoiceField(stagedInput.text) || hasPlaintextVoiceField(stagedInput.context);
}
function hasPlaintextVoiceField(value) {
  return value !== void 0 && value.trim().length > 0 && !isProtectedVoiceField(value);
}
function parseVoiceExampleRow(row) {
  return {
    ...typeof row.data === "string" ? JSON.parse(row.data) : row.data,
    version: row.version,
    createdAt: row.created_at
  };
}
function parseVoiceExampleBatchRow(row) {
  return {
    ...typeof row.data === "string" ? JSON.parse(row.data) : row.data,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function persistVoiceExampleRow(db, record) {
  return Effect3.tryPromise({
    try: () => db.updateTable("voice_examples").set({
      data: JSON.stringify(record),
      version: record.version
    }).where("id", "=", record.id).execute(),
    catch: (cause) => createVoiceFieldProtectionRotationError("Failed to persist rotated voice example", "voice_example", record.id, cause)
  });
}
function persistVoiceExampleBatchRow(db, record) {
  return Effect3.tryPromise({
    try: () => db.updateTable("voice_example_batches").set({
      data: JSON.stringify(record),
      version: record.version,
      updated_at: record.updatedAt
    }).where("id", "=", record.id).execute(),
    catch: (cause) => createVoiceFieldProtectionRotationError("Failed to persist rotated voice example batch", "voice_example_batch", record.id, cause)
  });
}

// src/cli/rotate-voice-protection-key.ts
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const encryptPlaintext = process.argv.includes("--encrypt-plaintext");
  const config = bootstrapBackendConfig();
  if (!config.databaseUrl) {
    console.error("DATABASE_URL is required to rotate voice protection keys");
    process.exit(1);
  }
  if (!config.voiceDataProtectionKey) {
    console.error("VOICE_DATA_PROTECTION_KEY is required to rotate voice protection keys");
    process.exit(1);
  }
  if (config.voiceDataProtectionPreviousKey && config.voiceDataProtectionPreviousKey === config.voiceDataProtectionKey) {
    console.error("VOICE_DATA_PROTECTION_KEY_PREVIOUS must differ from VOICE_DATA_PROTECTION_KEY");
    process.exit(1);
  }
  const pool = await Effect4.runPromise(acquirePostgresPool(config.databaseUrl));
  try {
    const db = new Kysely2({ dialect: new PostgresDialect2({ pool }) });
    const result = await Effect4.runPromise(
      rotateVoiceFieldProtectionInDatabase({
        db,
        dryRun,
        encryptPlaintext,
        keys: {
          keyMaterial: config.voiceDataProtectionKey,
          previousKeyMaterial: config.voiceDataProtectionPreviousKey
        }
      })
    );
    console.info(dryRun ? "Voice protection key rotation dry-run completed:" : "Voice protection key rotation completed:", result);
    if (result.voiceExamplesRotated === 0 && result.voiceExampleBatchesRotated === 0) {
      console.info(
        encryptPlaintext ? "No voice fields required rotation or plaintext encryption." : "No protected voice fields required rotation. Pass --encrypt-plaintext to encrypt legacy plaintext rows."
      );
    } else if (!dryRun && config.voiceDataProtectionPreviousKey) {
      console.info("Remove VOICE_DATA_PROTECTION_KEY_PREVIOUS from the environment after verifying reads in production.");
    }
  } catch (error) {
    console.error("Voice protection key rotation failed:", error);
    process.exit(1);
  } finally {
    await Effect4.runPromise(releasePostgresPool(pool));
  }
}
main();
//# sourceMappingURL=rotate-voice-protection-key.js.map
