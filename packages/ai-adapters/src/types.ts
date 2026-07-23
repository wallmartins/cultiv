import { Context } from "effect";
import type {
  AIAdapterInvalidRequestError,
  AIAdapterInvalidResponseError,
  AIAdapterProviderNotFoundError,
  AIAdapterTransportError
} from "./errors.js";

export type AIProviderName = "openai" | "anthropic" | "gemini" | "deepseek" | "ollama" | (string & {});
export type AIMessageRole = "system" | "user" | "assistant" | "tool";

export interface AIMessage {
  readonly role: AIMessageRole;
  readonly content: string;
  readonly name?: string;
}

export interface AIGroundingRequest {
  // Ask the provider to ground the completion in a native web search. Providers that expose a
  // grounding surface (Gemini's google_search tool) honor it; those without one (OpenAI-compatible /
  // Groq / Ollama) ignore it, so a routing chain can degrade to an ungrounded fallback silently.
  readonly webSearch: boolean;
}

export interface AIUsage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
}

export interface AIModelRequest {
  readonly provider: AIProviderName;
  readonly model: string;
  readonly messages: readonly AIMessage[];
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly topP?: number;
  readonly stop?: readonly string[];
  readonly stream?: boolean;
  readonly grounding?: AIGroundingRequest;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AIProviderRequest {
  readonly provider: AIProviderName;
  readonly model: string;
  readonly body: Readonly<Record<string, unknown>>;
  readonly headers: Readonly<Record<string, string>>;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface AIModelResponse {
  readonly provider: AIProviderName;
  readonly model: string;
  readonly text: string;
  readonly usage?: AIUsage;
  readonly raw?: unknown;
  readonly finishReason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AIProviderAdapter {
  readonly name: AIProviderName;
  readonly supportsModel: (model: string) => boolean;
  readonly buildRequest: (request: AIModelRequest) => import("effect").Effect.Effect<AIProviderRequest, AIAdapterInvalidRequestError>;
  readonly normalizeResponse: (
    response: unknown,
    request: AIModelRequest
  ) => import("effect").Effect.Effect<AIModelResponse, AIAdapterInvalidResponseError>;
}

export interface AIAdapterRegistry {
  readonly register: (adapter: AIProviderAdapter) => void;
  readonly resolve: (provider: AIProviderName) => AIProviderAdapter | undefined;
  readonly list: () => readonly AIProviderName[];
}

export interface AIAdapterRouter {
  readonly buildRequest: (
    request: AIModelRequest
  ) => import("effect").Effect.Effect<AIProviderRequest, AIAdapterProviderNotFoundError | AIAdapterInvalidRequestError>;
  readonly normalizeResponse: (
    provider: AIProviderName,
    response: unknown,
    request: AIModelRequest
  ) => import("effect").Effect.Effect<AIModelResponse, AIAdapterProviderNotFoundError | AIAdapterInvalidResponseError>;
}

export interface AIAdapterCall {
  readonly request: AIModelRequest;
  readonly transport: (providerRequest: AIProviderRequest) => import("effect").Effect.Effect<unknown, AIAdapterTransportError>;
}

export interface AIAdapterResult {
  readonly request: AIModelRequest;
  readonly providerRequest: AIProviderRequest;
  readonly response: AIModelResponse;
}

export type AIAdapterError =
  | AIAdapterProviderNotFoundError
  | AIAdapterInvalidRequestError
  | AIAdapterInvalidResponseError
  | AIAdapterTransportError;

export interface AIAdapterServiceContract {
  readonly complete: (call: AIAdapterCall) => import("effect").Effect.Effect<AIAdapterResult, AIAdapterError>;
}

export interface AIAdapterOptions {
  readonly registry?: AIAdapterRegistry;
}

export class AIAdapterRegistryService extends Context.Tag("AIAdapterRegistryService")<
  AIAdapterRegistryService,
  AIAdapterRegistry
>() {}

export class AIAdapterRouterService extends Context.Tag("AIAdapterRouterService")<
  AIAdapterRouterService,
  AIAdapterRouter
>() {}

export class AIAdapterService extends Context.Tag("AIAdapterService")<
  AIAdapterService,
  AIAdapterServiceContract
>() {}
