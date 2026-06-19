import { Effect } from "effect";
import type { GenerationIntent, GenerationScope } from "@my-ai-orchestrator/contracts";
import { BackendValidationError } from "../../http/errors.js";
import { resolveGenerationIntent, type ResolvedGenerationIntent } from "./intent-resolver.js";

export interface ResolvedGenerationTarget {
  readonly contentTypeId: string;
  readonly resolvedIntent?: ResolvedGenerationIntent;
}

export function resolveGenerationTarget(request: {
  readonly intent?: GenerationIntent;
  readonly scope?: GenerationScope;
  readonly contentType?: string;
}): Effect.Effect<ResolvedGenerationTarget, BackendValidationError> {
  if (request.intent && request.scope) {
    const resolved = resolveGenerationIntent({ intent: request.intent, scope: request.scope });
    return Effect.succeed({
      contentTypeId: resolved.legacyContentTypeId,
      resolvedIntent: resolved
    });
  }

  if (request.contentType) {
    return Effect.succeed({ contentTypeId: request.contentType });
  }

  return Effect.fail(
    new BackendValidationError({
      message: "Either intent and scope or contentType must be provided"
    })
  );
}
