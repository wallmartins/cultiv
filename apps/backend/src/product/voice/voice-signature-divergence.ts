import type {
  ArgumentDevelopmentSignature,
  CoreReasoningSignature,
  DevelopmentTraitProfile,
  EpistemicPosture,
  ReasoningExtractionResult,
  TraitKey
} from "@my-ai-orchestrator/contracts";

export interface VoiceSignatureDivergence {
  readonly hasConflict: boolean;
  readonly reasons: readonly string[];
}

interface PostureDivergenceGuard {
  readonly matches: (core: CoreReasoningSignature, development: ArgumentDevelopmentSignature) => boolean;
  readonly reason: string;
}

// Keyed by development.epistemicPosture. A posture without an entry raises zero reasons (neutral,
// same as today's unhandled postures) — add a posture by adding a row here, nothing else.
const POSTURE_DIVERGENCE_GUARDS: Partial<Record<EpistemicPosture, readonly PostureDivergenceGuard[]>> = {
  exploratory: [
    {
      matches: (core) =>
        core.certaintyLevel === "high" || core.conclusionPace === "fast" || core.judgmentFrequency === "high",
      reason: "exploratory_posture_conflicts_with_core_certainty_or_pace"
    }
  ],
  advocacy: [
    {
      matches: (core) =>
        core.judgmentFrequency === "low" && (core.readerRelationship === "observer" || core.conclusionPace === "slow"),
      reason: "advocacy_conflicts_with_observational_core"
    }
  ],
  investigative: [
    {
      matches: (core, development) => core.judgmentFrequency === "high" && hasDoubtOrExperimentMoves(development),
      reason: "investigative_moves_conflict_with_high_judgment"
    }
  ]
};

export function evaluateVoiceSignatureDivergence(args: {
  readonly reasoning: ReasoningExtractionResult;
  readonly development: ArgumentDevelopmentSignature;
  readonly traitProfile?: DevelopmentTraitProfile;
}): VoiceSignatureDivergence {
  const reasons: string[] = [];
  const { core } = args.reasoning;
  const development = args.development;
  const traitProfile = args.traitProfile ?? development.traitProfile;

  for (const guard of POSTURE_DIVERGENCE_GUARDS[development.epistemicPosture] ?? []) {
    if (guard.matches(core, development)) {
      reasons.push(guard.reason);
    }
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
    // ponytail: this compound check stays outside POSTURE_DIVERGENCE_GUARDS (F6-3) — it keys on a
    // posture but also needs traitProfile (a third input the table's (core, development) guards lack).
    // It's a single-posture conjunction, not a growing per-posture chain, so it doesn't reintroduce
    // the antipattern; widen the guard signature only if more traitProfile+posture rules appear.
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
