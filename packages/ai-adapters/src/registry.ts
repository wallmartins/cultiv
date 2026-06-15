import { Effect } from "effect";
import { AIAdapterProviderNotFoundError } from "./errors.js";
import type { AIAdapterRegistry, AIProviderAdapter, AIProviderName } from "./types.js";

export function createAIAdapterRegistry(initialAdapters: readonly AIProviderAdapter[] = []): AIAdapterRegistry {
  const adapters = new Map<AIProviderName, AIProviderAdapter>();

  for (const adapter of initialAdapters) {
    adapters.set(adapter.name, adapter);
  }

  return {
    register(adapter) {
      adapters.set(adapter.name, adapter);
    },
    resolve(provider) {
      return adapters.get(provider);
    },
    list() {
      return Array.from(adapters.keys());
    }
  };
}

export function resolveAdapter(
  registry: AIAdapterRegistry,
  provider: AIProviderName
): Effect.Effect<AIProviderAdapter, AIAdapterProviderNotFoundError> {
  const adapter = registry.resolve(provider);
  if (!adapter) {
    return Effect.fail(new AIAdapterProviderNotFoundError({ provider: String(provider) }));
  }

  return Effect.succeed(adapter);
}
