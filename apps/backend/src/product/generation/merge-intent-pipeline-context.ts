import type { ResolvedGenerationIntent } from "./intent-resolver.js";

export function mergeIntentPipelineContext(
  requestContext: Record<string, unknown> | undefined,
  resolvedIntent: ResolvedGenerationIntent | undefined
): Record<string, unknown> | undefined {
  if (!resolvedIntent) {
    return requestContext;
  }

  return {
    ...requestContext,
    wordTarget: resolvedIntent.wordTarget,
    generationIntent: resolvedIntent.intent,
    generationChannel: resolvedIntent.channelHint
  };
}
