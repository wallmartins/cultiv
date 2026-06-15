import { Effect, Layer } from "effect";
import { resolveAdapter } from "./registry.js";
import { validateAIModelRequest } from "./request-validation.js";
import type {
  AIAdapterRegistry,
  AIAdapterRouter,
  AIAdapterServiceContract
} from "./types.js";
import {
  AIAdapterRegistryService,
  AIAdapterRouterService,
  AIAdapterService
} from "./types.js";
import { createAIAdapterRegistry } from "./registry.js";

export function createAIAdapterRouter(registry: AIAdapterRegistry = createAIAdapterRegistry()): AIAdapterRouter {
  return {
    buildRequest(request) {
      return Effect.gen(function* () {
        yield* validateAIModelRequest(request);
        const adapter = yield* resolveAdapter(registry, request.provider);
        return yield* adapter.buildRequest(request);
      });
    },
    normalizeResponse(provider, response, request) {
      return Effect.gen(function* () {
        const adapter = yield* resolveAdapter(registry, provider);
        return yield* adapter.normalizeResponse(response, request);
      });
    }
  };
}

export function createAIAdapterService(registry: AIAdapterRegistry = createAIAdapterRegistry()): AIAdapterServiceContract {
  const router = createAIAdapterRouter(registry);

  return {
    complete: (call) =>
      Effect.gen(function* () {
        const providerRequest = yield* router.buildRequest(call.request);
        const providerResponse = yield* call.transport(providerRequest);
        const response = yield* router.normalizeResponse(call.request.provider, providerResponse, call.request);

        return {
          request: call.request,
          providerRequest,
          response
        };
      })
  };
}

export function createAIAdapterRegistryLayer(registry: AIAdapterRegistry = createAIAdapterRegistry()) {
  return Layer.succeed(AIAdapterRegistryService, registry);
}

export function createAIAdapterRouterLayer(registry: AIAdapterRegistry = createAIAdapterRegistry()) {
  return Layer.succeed(AIAdapterRouterService, createAIAdapterRouter(registry));
}

export function createAIAdapterServiceLayer(registry: AIAdapterRegistry = createAIAdapterRegistry()) {
  return Layer.succeed(AIAdapterService, createAIAdapterService(registry));
}

export function withAIAdapters<T, E, R>(
  effect: Effect.Effect<T, E, R>,
  registry: AIAdapterRegistry = createAIAdapterRegistry()
): Effect.Effect<T, E, R> {
  return effect.pipe(Effect.provide(createAIAdapterServiceLayer(registry)));
}
