import type { BackendConfig } from "../../config/config.js";
import { dedupeStrings } from "../../internal/utils.js";

export interface ProviderModelAttempt {
  readonly provider: string;
  readonly model: string;
  readonly timeoutMs?: number;
}

export function isProviderConfigured(
  config: Pick<
    BackendConfig,
    | "openAIApiKey"
    | "anthropicApiKey"
    | "geminiApiKey"
    | "deepSeekApiKey"
    | "groqApiKey"
    | "ollamaBaseUrl"
  >,
  provider: string
): boolean {
  switch (provider) {
    case "openai":
      return Boolean(config.openAIApiKey);
    case "anthropic":
      return Boolean(config.anthropicApiKey);
    case "gemini":
      return Boolean(config.geminiApiKey);
    case "deepseek":
      return Boolean(config.deepSeekApiKey);
    case "groq":
      return Boolean(config.groqApiKey);
    case "ollama":
      return Boolean(config.ollamaBaseUrl);
    default:
      return false;
  }
}

const providerCredentialEnvVar: Readonly<Record<string, string>> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  groq: "GROQ_API_KEY",
  ollama: "OLLAMA_BASE_URL"
};

export function findMissingProviderCredentials(
  config: Pick<
    BackendConfig,
    | "openAIApiKey"
    | "anthropicApiKey"
    | "geminiApiKey"
    | "deepSeekApiKey"
    | "groqApiKey"
    | "ollamaBaseUrl"
  >,
  attempts: readonly ProviderModelAttempt[]
): readonly string[] {
  const providers = dedupeStrings(attempts.map((attempt) => attempt.provider));
  return providers
    .filter((provider) => !isProviderConfigured(config, provider))
    .map((provider) => providerCredentialEnvVar[provider] ?? provider);
}

export function filterConfiguredProviderAttempts<T extends ProviderModelAttempt>(
  config: Pick<
    BackendConfig,
    | "environment"
    | "openAIApiKey"
    | "anthropicApiKey"
    | "geminiApiKey"
    | "deepSeekApiKey"
    | "groqApiKey"
    | "ollamaBaseUrl"
  >,
  attempts: readonly T[]
): readonly T[] {
  if (config.environment === "test") {
    return attempts;
  }

  return attempts.filter((attempt) => isProviderConfigured(config, attempt.provider));
}
