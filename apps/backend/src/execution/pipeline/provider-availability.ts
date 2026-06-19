import type { BackendConfig } from "../../config/config.js";

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

export function filterConfiguredProviderAttempts<T extends ProviderModelAttempt>(
  config: Pick<
    BackendConfig,
    | "openAIApiKey"
    | "anthropicApiKey"
    | "geminiApiKey"
    | "deepSeekApiKey"
    | "groqApiKey"
    | "ollamaBaseUrl"
  >,
  attempts: readonly T[]
): readonly T[] {
  return attempts.filter((attempt) => isProviderConfigured(config, attempt.provider));
}
