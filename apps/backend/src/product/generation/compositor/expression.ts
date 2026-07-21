import type {
  GenerationChannel,
  GenerationLengthTier,
  PlanSignature,
  RhetoricalMode
} from "@my-ai-orchestrator/contracts";

export interface ExpressionProfileInput {
  readonly rhetoricalMode: RhetoricalMode;
  readonly channel: GenerationChannel;
}

export interface PickBasePresetInput {
  readonly rhetoricalMode: RhetoricalMode;
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
    return `${input.rhetoricalMode}-default`;
  }
  return `${CHANNEL_EXPRESSION_PREFIX[input.channel]}-${input.rhetoricalMode}`;
}

function defaultPresetByModeTier(
  rhetoricalMode: RhetoricalMode,
  lengthTier: GenerationLengthTier
): PlanSignature {
  if (lengthTier === "long") {
    return "long-piece";
  }

  if (lengthTier === "medium") {
    if (rhetoricalMode === "narrate") {
      return "serial-piece";
    }
    if (rhetoricalMode === "promote") {
      return "short-piece";
    }
    return "edition-piece";
  }

  if (rhetoricalMode === "narrate" || rhetoricalMode === "argue") {
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

  return defaultPresetByModeTier(input.rhetoricalMode, input.lengthTier);
}
