import type { AIAdapterRegistry } from "../types.js";
import { createAnthropicAdapter } from "./anthropic.js";
import { createDeepSeekAdapter } from "./deepseek.js";
import { createGeminiAdapter } from "./gemini.js";
import { createGroqAdapter } from "./groq.js";
import { createOllamaAdapter } from "./ollama.js";
import { createOpenAIAdapter } from "./openai.js";

export {
  createAnthropicAdapter,
  createDeepSeekAdapter,
  createGeminiAdapter,
  createGroqAdapter,
  createOllamaAdapter,
  createOpenAIAdapter
};

export function registerDefaultAIProviders(registry: AIAdapterRegistry): AIAdapterRegistry {
  registry.register(createOpenAIAdapter());
  registry.register(createAnthropicAdapter());
  registry.register(createGeminiAdapter());
  registry.register(createGroqAdapter());
  registry.register(createDeepSeekAdapter());
  registry.register(createOllamaAdapter());
  return registry;
}
