import type {
  ContentTypeCatalogItemView,
  GenerationPreviewRequest,
  QualityMode
} from "@my-ai-orchestrator/contracts";

const QUALITY_MODE_FALLBACK_ORDER: Readonly<Record<QualityMode, readonly QualityMode[]>> = {
  fast: ["fast", "balanced", "strict"],
  balanced: ["balanced", "fast", "strict"],
  strict: ["strict", "balanced", "fast"]
};

interface QualityModeAvailability {
  readonly id: QualityMode;
  readonly allowed: boolean;
}

interface BriefingAnalysis {
  readonly wordCount: number;
  readonly filledFieldCount: number;
  readonly arrayItemCount: number;
}

export interface GenerationPreviewQualityModeRecommendation {
  readonly qualityMode: QualityMode;
  readonly reasonCodes: readonly string[];
  readonly explanation: string;
}

export function recommendGenerationPreviewQualityMode(args: {
  readonly contentType: ContentTypeCatalogItemView;
  readonly briefing: GenerationPreviewRequest["briefing"];
  readonly hasVoiceProfile: boolean;
  readonly qualityModes: ReadonlyArray<QualityModeAvailability>;
}): GenerationPreviewQualityModeRecommendation | null {
  const allowedModes = args.qualityModes.filter((mode) => mode.allowed).map((mode) => mode.id);
  if (allowedModes.length === 0) {
    return null;
  }

  const briefing = analyzeBriefing(args.briefing);
  const preferredMode = selectPreferredQualityMode(args.contentType, briefing, args.hasVoiceProfile);
  const qualityMode = selectAllowedQualityMode(preferredMode, allowedModes);
  const reasonCodes = buildReasonCodes({
    contentType: args.contentType,
    briefing,
    hasVoiceProfile: args.hasVoiceProfile,
    preferredMode,
    recommendedMode: qualityMode
  });

  return {
    qualityMode,
    reasonCodes,
    explanation: buildExplanation(qualityMode, preferredMode, reasonCodes)
  };
}

function selectPreferredQualityMode(
  contentType: ContentTypeCatalogItemView,
  briefing: BriefingAnalysis,
  hasVoiceProfile: boolean
): QualityMode {
  const hasComplexContentType = contentType.steps.length >= 4 || countHighImpactFields(contentType) >= 3;
  const hasDetailedBriefing = briefing.wordCount >= 80 || briefing.filledFieldCount >= 4;
  const hasStructuredBriefing = briefing.arrayItemCount >= 3;
  const hasSimpleRequest =
    contentType.steps.length <= 2 &&
    countHighImpactFields(contentType) <= 2 &&
    briefing.wordCount > 0 &&
    briefing.wordCount <= 24 &&
    briefing.filledFieldCount <= 2 &&
    briefing.arrayItemCount === 0 &&
    !hasVoiceProfile;

  if (hasComplexContentType && (hasDetailedBriefing || hasStructuredBriefing || hasVoiceProfile)) {
    return "strict";
  }

  if (hasSimpleRequest) {
    return "fast";
  }

  return "balanced";
}

function selectAllowedQualityMode(
  preferredMode: QualityMode,
  allowedModes: ReadonlyArray<QualityMode>
): QualityMode {
  return QUALITY_MODE_FALLBACK_ORDER[preferredMode].find((mode) => allowedModes.includes(mode)) ?? allowedModes[0] ?? "balanced";
}

function buildReasonCodes(args: {
  readonly contentType: ContentTypeCatalogItemView;
  readonly briefing: BriefingAnalysis;
  readonly hasVoiceProfile: boolean;
  readonly preferredMode: QualityMode;
  readonly recommendedMode: QualityMode;
}): readonly string[] {
  const reasonCodes: string[] = [];
  const highImpactFields = countHighImpactFields(args.contentType);

  if (args.preferredMode === "strict") {
    if (args.contentType.steps.length >= 4 || highImpactFields >= 3) {
      reasonCodes.push("complex_content_type");
    }
    if (args.briefing.wordCount >= 80 || args.briefing.filledFieldCount >= 4) {
      reasonCodes.push("detailed_briefing");
    }
    if (args.briefing.arrayItemCount >= 3) {
      reasonCodes.push("structured_briefing");
    }
    if (args.hasVoiceProfile) {
      reasonCodes.push("voice_profile_available");
    }
  }

  if (args.preferredMode === "fast") {
    reasonCodes.push("simple_request");
  }

  if (args.preferredMode === "balanced") {
    if (args.briefing.filledFieldCount >= 3 || args.briefing.arrayItemCount >= 1) {
      reasonCodes.push("structured_briefing");
    }
    reasonCodes.push("balanced_default");
  }

  if (args.recommendedMode !== args.preferredMode) {
    reasonCodes.push("allowed_option_guard");
  }

  return reasonCodes.length > 0 ? unique(reasonCodes) : ["balanced_default"];
}

function buildExplanation(
  recommendedMode: QualityMode,
  preferredMode: QualityMode,
  reasonCodes: readonly string[]
): string {
  if (reasonCodes.includes("allowed_option_guard") && recommendedMode !== preferredMode) {
    return `${capitalize(recommendedMode)} is recommended because it best fits this request within your currently available options.`;
  }

  if (recommendedMode === "strict") {
    return "Strict is recommended for a more complex request with richer context to preserve.";
  }

  if (recommendedMode === "fast") {
    return "Fast is recommended for a shorter request with lower structural complexity.";
  }

  return "Balanced is recommended because this request benefits from structure without needing the highest-cost mode.";
}

function countHighImpactFields(contentType: ContentTypeCatalogItemView): number {
  return contentType.inputSchema.filter((field) => field.highImpact).length;
}

function analyzeBriefing(briefing: GenerationPreviewRequest["briefing"]): BriefingAnalysis {
  if (!briefing) {
    return {
      wordCount: 0,
      filledFieldCount: 0,
      arrayItemCount: 0
    };
  }

  if (typeof briefing === "string") {
    return {
      wordCount: countWords(briefing),
      filledFieldCount: briefing.trim().length > 0 ? 1 : 0,
      arrayItemCount: 0
    };
  }

  const values = Object.values(briefing);

  return {
    wordCount: values.reduce<number>((total, value) => total + countWordsFromUnknown(value), 0),
    filledFieldCount: values.filter(hasMeaningfulValue).length,
    arrayItemCount: values.reduce<number>((total, value) => total + countArrayItems(value), 0)
  };
}

function countWordsFromUnknown(value: unknown): number {
  if (typeof value === "string") {
    return countWords(value);
  }

  if (Array.isArray(value)) {
    return value.reduce<number>((total, item) => total + countWordsFromUnknown(item), 0);
  }

  if (value && typeof value === "object") {
    return Object.values(value).reduce<number>((total, item) => total + countWordsFromUnknown(item), 0);
  }

  return 0;
}

function countArrayItems(value: unknown): number {
  if (!Array.isArray(value)) {
    return 0;
  }

  return value.filter(hasMeaningfulValue).length;
}

function hasMeaningfulValue(value: unknown): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some(hasMeaningfulValue);
  }

  if (value && typeof value === "object") {
    return Object.values(value).some(hasMeaningfulValue);
  }

  return value !== null && value !== undefined;
}

function countWords(value: string): number {
  const normalized = value.trim();
  return normalized.length === 0 ? 0 : normalized.split(/\s+/u).length;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
