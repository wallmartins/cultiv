import type { CompositorMetadata } from "../generation-compositor.js";
import type {
  GenerationChannel,
  GenerationIntent,
  GenerationLengthTier
} from "../generation-intent.js";
import { mapLegacyContentTypeToPhase1Intent } from "../generation-intent-legacy-map.js";
import type { PipelineRequest } from "./request.js";

export type ExecutionPresentation = {
  readonly generationIntent?: GenerationIntent;
  readonly briefingTopic?: string;
  readonly lengthTier?: GenerationLengthTier;
  readonly channel?: GenerationChannel;
};

const GENERATION_INTENTS = new Set<GenerationIntent>([
  "share-idea",
  "explain-deeply",
  "engage-audience",
  "tell-story",
  "update-subscribers",
  "document-decision"
]);

const GENERATION_LENGTH_TIERS = new Set<GenerationLengthTier>(["short", "medium", "long"]);

const GENERATION_CHANNELS = new Set<GenerationChannel>([
  "unspecified",
  "professional-network",
  "blog",
  "email",
  "social"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asGenerationIntent(value: unknown): GenerationIntent | undefined {
  return typeof value === "string" && GENERATION_INTENTS.has(value as GenerationIntent)
    ? (value as GenerationIntent)
    : undefined;
}

function asGenerationLengthTier(value: unknown): GenerationLengthTier | undefined {
  return typeof value === "string" && GENERATION_LENGTH_TIERS.has(value as GenerationLengthTier)
    ? (value as GenerationLengthTier)
    : undefined;
}

function asGenerationChannel(value: unknown): GenerationChannel | undefined {
  return typeof value === "string" && GENERATION_CHANNELS.has(value as GenerationChannel)
    ? (value as GenerationChannel)
    : undefined;
}

function pickTopicFromRecord(record: Record<string, unknown>): string | undefined {
  const topic = record.topic;
  if (typeof topic === "string" && topic.trim().length > 0) {
    return topic.trim();
  }

  return undefined;
}

function summarizeBriefingText(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  return trimmed.length > 80 ? `${trimmed.slice(0, 80).trim()}…` : trimmed;
}

function readCompositorMetadata(context: Record<string, unknown> | undefined): CompositorMetadata | undefined {
  if (!context) {
    return undefined;
  }

  const compositor = context.compositor;
  if (!isRecord(compositor)) {
    return undefined;
  }

  const lengthTier = asGenerationLengthTier(compositor.lengthTier);
  const planSignature = compositor.planSignature;
  const planId = compositor.planId;
  const expressionProfile = compositor.expressionProfile;
  const wordTarget = compositor.wordTarget;

  if (
    !lengthTier ||
    typeof planSignature !== "string" ||
    typeof planId !== "string" ||
    typeof expressionProfile !== "string" ||
    !isRecord(wordTarget) ||
    typeof wordTarget.min !== "number" ||
    typeof wordTarget.max !== "number"
  ) {
    return undefined;
  }

  return {
    planId,
    planSignature: planSignature as CompositorMetadata["planSignature"],
    expressionProfile,
    lengthTier,
    wordTarget: { min: wordTarget.min, max: wordTarget.max }
  };
}

function resolveBriefingTopic(request: PipelineRequest | undefined): string | undefined {
  if (!request) {
    return undefined;
  }

  if ("pipeline" in request) {
    if (!isRecord(request.inputs)) {
      return undefined;
    }

    return (
      pickTopicFromRecord(request.inputs) ??
      (typeof request.inputs.briefing === "string"
        ? summarizeBriefingText(request.inputs.briefing)
        : undefined)
    );
  }

  const briefing = request.briefing;
  if (isRecord(briefing)) {
    return pickTopicFromRecord(briefing);
  }

  if (typeof briefing === "string") {
    return summarizeBriefingText(briefing);
  }

  return undefined;
}

export function resolveExecutionPresentation(
  request: PipelineRequest | undefined,
  contentType: string
): ExecutionPresentation {
  let generationIntent: GenerationIntent | undefined;
  let lengthTier: GenerationLengthTier | undefined;
  let channel: GenerationChannel | undefined;

  if (request && "pipeline" in request) {
    const context = isRecord(request.context) ? request.context : undefined;
    generationIntent = asGenerationIntent(context?.generationIntent);
    channel = asGenerationChannel(context?.generationChannel);
    lengthTier = readCompositorMetadata(context)?.lengthTier;
  }

  const briefingTopic = resolveBriefingTopic(request);

  if (!generationIntent || !lengthTier) {
    const legacy = mapLegacyContentTypeToPhase1Intent(contentType);
    if (legacy) {
      generationIntent = generationIntent ?? legacy.intent;
      lengthTier = lengthTier ?? legacy.scope.lengthTier;
      channel = channel ?? legacy.scope.channel;
    }
  }

  return {
    ...(generationIntent ? { generationIntent } : {}),
    ...(briefingTopic ? { briefingTopic } : {}),
    ...(lengthTier ? { lengthTier } : {}),
    ...(channel ? { channel } : {})
  };
}
