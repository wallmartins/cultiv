import type { RuntimeConfig } from "@my-ai-orchestrator/core";
import type { BackendAuthConfig } from "./config-auth.js";

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
  readonly reasoningSignatureV1Enabled?: boolean;
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
  readonly groqApiKey?: string;
  readonly groqBaseUrl?: string;
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
