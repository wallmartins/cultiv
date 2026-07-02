import type { GenerationChannel, GenerationLengthTier } from "@my-ai-orchestrator/contracts";

export interface OutputWordTarget {
  readonly minWords: number;
  readonly maxWords: number;
  readonly idealWords: number;
}

export interface IntentWordTarget {
  readonly min: number;
  readonly max: number;
}

export interface EffectiveWordTargetInput {
  readonly contentType: string;
  readonly lengthTier: GenerationLengthTier;
  readonly channel?: GenerationChannel;
}

const DEFAULT_TARGET: OutputWordTarget = {
  minWords: 250,
  maxWords: 900,
  idealWords: 500
};

const CONTENT_TYPE_TARGETS: ReadonlyArray<{
  readonly match: (formatName: string) => boolean;
  readonly target: OutputWordTarget;
}> = [
  {
    match: (name) => name.includes("linkedin"),
    target: { minWords: 130, maxWords: 300, idealWords: 200 }
  },
  {
    match: (name) => name.includes("newsletter"),
    target: { minWords: 400, maxWords: 800, idealWords: 550 }
  },
  {
    match: (name) => name.includes("architecture"),
    target: { minWords: 800, maxWords: 2000, idealWords: 1400 }
  },
  {
    match: (name) => name.includes("blog"),
    target: { minWords: 1200, maxWords: 2500, idealWords: 1800 }
  },
  {
    match: (name) => name.includes("thread") || name.includes("twitter"),
    target: { minWords: 180, maxWords: 420, idealWords: 280 }
  },
  {
    match: (name) => name.includes("validation"),
    target: { minWords: 200, maxWords: 600, idealWords: 380 }
  },
  {
    match: (name) => name.includes("post"),
    target: { minWords: 130, maxWords: 350, idealWords: 220 }
  }
];

const TIER_SLICE: Record<GenerationLengthTier, { readonly low: number; readonly high: number }> = {
  short: { low: 0, high: 0.42 },
  medium: { low: 0.28, high: 0.72 },
  long: { low: 0.58, high: 1 }
};

const CHANNEL_HARD_CAPS: Partial<
  Record<GenerationChannel, { readonly maxWords: number; readonly idealWords: number }>
> = {
  "professional-network": { maxWords: 300, idealWords: 210 },
  social: { maxWords: 220, idealWords: 150 },
  email: { maxWords: 850, idealWords: 600 }
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sliceFormatTarget(format: OutputWordTarget, lengthTier: GenerationLengthTier): OutputWordTarget {
  const span = Math.max(1, format.maxWords - format.minWords);
  const { low, high } = TIER_SLICE[lengthTier];
  const minWords = Math.round(format.minWords + span * low);
  const maxWords = Math.round(format.minWords + span * high);
  const idealWords = Math.round((minWords + maxWords) / 2);

  return {
    minWords: clamp(minWords, format.minWords, format.maxWords),
    maxWords: clamp(maxWords, minWords, format.maxWords),
    idealWords: clamp(idealWords, minWords, maxWords)
  };
}

function applyChannelHardCaps(
  target: OutputWordTarget,
  channel?: GenerationChannel,
  contentType?: string
): OutputWordTarget {
  const normalized = contentType?.toLowerCase() ?? "";
  const isFeedFormat = normalized.includes("linkedin") || normalized.includes("thread") || normalized.includes("twitter");

  if (channel && CHANNEL_HARD_CAPS[channel]) {
    const cap = CHANNEL_HARD_CAPS[channel]!;
    return {
      minWords: target.minWords,
      maxWords: Math.min(target.maxWords, cap.maxWords),
      idealWords: Math.min(target.idealWords, cap.idealWords)
    };
  }

  if (isFeedFormat) {
    return {
      minWords: target.minWords,
      maxWords: Math.min(target.maxWords, 300),
      idealWords: Math.min(target.idealWords, 220)
    };
  }

  return target;
}

export function resolveOutputWordTargetForFormatName(formatName: string): OutputWordTarget {
  const normalized = formatName.toLowerCase();
  const match = CONTENT_TYPE_TARGETS.find((entry) => entry.match(normalized));
  return match?.target ?? DEFAULT_TARGET;
}

export function resolveEffectiveWordTarget(input: EffectiveWordTargetInput): OutputWordTarget {
  const formatTarget = resolveOutputWordTargetForFormatName(input.contentType);
  const sliced = sliceFormatTarget(formatTarget, input.lengthTier);
  return applyChannelHardCaps(sliced, input.channel, input.contentType);
}

export function toIntentWordTarget(target: OutputWordTarget): IntentWordTarget {
  return {
    min: target.minWords,
    max: target.maxWords
  };
}

export function fromIntentWordTarget(target: IntentWordTarget): OutputWordTarget {
  const idealWords = Math.round((target.min + target.max) / 2);
  return {
    minWords: target.min,
    maxWords: target.max,
    idealWords
  };
}

export function describeOutputWordTarget(target: OutputWordTarget): string {
  return `${target.minWords}-${target.maxWords} words, ideally around ${target.idealWords} words`;
}

export function formatIntentWordTargetLine(wordTarget: IntentWordTarget): string {
  return `Target length: between ${wordTarget.min} and ${wordTarget.max} words.`;
}
