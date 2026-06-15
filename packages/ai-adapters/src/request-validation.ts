import { Effect } from "effect";
import { AIAdapterInvalidRequestError } from "./errors.js";
import type { AIModelRequest } from "./types.js";

export function validateAIModelRequest(
  request: AIModelRequest
): Effect.Effect<void, AIAdapterInvalidRequestError> {
  if (!request || typeof request !== "object") {
    return Effect.fail(
      new AIAdapterInvalidRequestError({
        message: "AI model request is required",
        request
      })
    );
  }

  if (typeof request.provider !== "string" || request.provider.trim().length === 0) {
    return Effect.fail(
      new AIAdapterInvalidRequestError({
        message: "AI model request must have a provider",
        request
      })
    );
  }

  if (typeof request.model !== "string" || request.model.trim().length === 0) {
    return Effect.fail(
      new AIAdapterInvalidRequestError({
        message: "AI model request must have a non-empty model",
        request
      })
    );
  }

  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    return Effect.fail(
      new AIAdapterInvalidRequestError({
        message: "AI model request must include at least one message",
        request
      })
    );
  }

  return Effect.void;
}
