import type {
  GenerationChannel,
  GenerationIntent,
  GenerationLengthTier,
  PlanSignature
} from "@my-ai-orchestrator/contracts";

export interface ExpressionProfileInput {
  readonly intent: GenerationIntent;
  readonly channel: GenerationChannel;
}

export interface PickBasePresetInput {
  readonly intent: GenerationIntent;
  readonly lengthTier: GenerationLengthTier;
  readonly channel?: GenerationChannel;
}

const CHANNEL_EXPRESSION_PREFIX: Record<Exclude<GenerationChannel, "unspecified">, string> = {
  email: "email",
  "professional-network": "professional",
  blog: "blog",
  social: "social"
};

export function resolveExpressionProfile(input: ExpressionProfileInput): string {
  if (input.channel === "unspecified") {
    return `${input.intent}-default`;
  }
  return `${CHANNEL_EXPRESSION_PREFIX[input.channel]}-${input.intent}`;
}

function defaultPresetByIntentTier(
  intent: GenerationIntent,
  lengthTier: GenerationLengthTier
): PlanSignature {
  if (intent === "tell-story") {
    return lengthTier === "long" ? "long-piece" : "serial-piece";
  }

  if (lengthTier === "long") {
    return "long-piece";
  }

  if (lengthTier === "medium") {
    if (intent === "update-subscribers" || intent === "explain-deeply" || intent === "document-decision") {
      return "edition-piece";
    }
    return "short-piece";
  }

  if (intent === "engage-audience" || intent === "document-decision") {
    return "serial-piece";
  }

  return "short-piece";
}

export function pickBasePreset(input: PickBasePresetInput): PlanSignature {
  const channel = input.channel ?? "unspecified";

  if (channel === "email") {
    return "edition-piece";
  }
  if (channel === "professional-network" || channel === "social") {
    return "short-piece";
  }
  if (channel === "blog" && input.lengthTier === "long") {
    return "long-piece";
  }

  return defaultPresetByIntentTier(input.intent, input.lengthTier);
}
