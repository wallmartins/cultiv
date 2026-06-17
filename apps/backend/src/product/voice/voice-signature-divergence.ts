import type {
  ArgumentDevelopmentSignature,
  CoreReasoningSignature,
  DevelopmentTraitProfile,
  ReasoningExtractionResult,
  TraitKey
} from "@my-ai-orchestrator/contracts";

export interface VoiceSignatureDivergence {
  readonly hasConflict: boolean;
  readonly reasons: readonly string[];
}

export function evaluateVoiceSignatureDivergence(args: {
  readonly reasoning: ReasoningExtractionResult;
  readonly development: ArgumentDevelopmentSignature;
  readonly traitProfile?: DevelopmentTraitProfile;
}): VoiceSignatureDivergence {
  const reasons: string[] = [];
  const { core } = args.reasoning;
  const development = args.development;
  const traitProfile = args.traitProfile ?? development.traitProfile;

  if (
    development.epistemicPosture === "exploratory"
    && (core.certaintyLevel === "high" || core.conclusionPace === "fast" || core.judgmentFrequency === "high")
  ) {
    reasons.push("exploratory_posture_conflicts_with_core_certainty_or_pace");
  }

  if (
    development.epistemicPosture === "advocacy_mixed"
    && core.judgmentFrequency === "low"
    && (core.readerRelationship === "observer" || core.conclusionPace === "slow")
  ) {
    reasons.push("advocacy_mixed_conflicts_with_observational_core");
  }

  if (
    development.epistemicPosture === "investigative"
    && core.judgmentFrequency === "high"
    && hasDoubtOrExperimentMoves(development)
  ) {
    reasons.push("investigative_moves_conflict_with_high_judgment");
  }

  if (hasProseCollapse(core.narrativeProse, development.developmentProse)) {
    reasons.push("prose_collapse_between_core_and_development");
  }

  if (hasStructuralClash(core, development)) {
    reasons.push("structural_anti_pattern_conflicts_with_core_traits");
  }

  if (traitProfile) {
    const insightTiming = traitProfile.traits.insightTiming ?? traitProfile.records.insightTiming?.value;
    if (insightTiming === "late" && core.conclusionPace === "fast") {
      reasons.push("late_insight_timing_conflicts_with_fast_conclusion_pace");
    }

    const openingMode = traitProfile.traits.openingMode ?? traitProfile.records.openingMode?.value;
    if (
      openingMode === "thesis"
      && development.epistemicPosture === "exploratory"
      && hasDoubtOrExperimentMoves(development)
    ) {
      reasons.push("thesis_opening_conflicts_with_exploratory_doubt_moves");
    }

    const disputedTraits = countDisputedTraits(traitProfile);
    if (disputedTraits >= 2) {
      reasons.push("multiple_disputed_development_traits");
    }
  }

  return {
    hasConflict: reasons.length > 0,
    reasons
  };
}

function countDisputedTraits(traitProfile: DevelopmentTraitProfile): number {
  return (Object.keys(traitProfile.records) as TraitKey[]).filter(
    (key) => traitProfile.records[key]?.status === "disputed"
  ).length;
}

function hasDoubtOrExperimentMoves(development: ArgumentDevelopmentSignature): boolean {
  const labels = development.moveLabels.map((label) => label.toLowerCase());
  return labels.some((label) =>
    /doubt|duvida|experiment|experimenta|hesitat|incert/.test(label)
  );
}

function hasProseCollapse(coreProse: string, developmentProse: string): boolean {
  const coreTokens = tokenSet(coreProse);
  const developmentTokens = tokenSet(developmentProse);

  if (coreTokens.size === 0 || developmentTokens.size === 0) {
    return false;
  }

  const intersection = [...coreTokens].filter((token) => developmentTokens.has(token));
  const unionSize = new Set([...coreTokens, ...developmentTokens]).size;
  const jaccard = intersection.length / unionSize;

  return jaccard >= 0.72;
}

function hasStructuralClash(
  core: CoreReasoningSignature,
  development: ArgumentDevelopmentSignature
): boolean {
  const patterns = development.structuralAntiPatterns.map((pattern) => pattern.toLowerCase());

  const prematureThesis = patterns.some((pattern) =>
    /premature|tese_prematura|early_thesis|thesis_early/.test(pattern)
  );

  return prematureThesis && core.conclusionPace === "slow";
}

function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}0-9]+/u)
      .map((token) => token.trim())
      .filter((token) => token.length > 3)
  );
}
