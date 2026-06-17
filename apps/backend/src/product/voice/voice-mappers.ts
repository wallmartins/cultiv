import type {
  AttentionLevel,
  AttentionReasonCode,
  ContributionCode,
  VoiceExampleBatchCommitResultView,
  VoiceExampleBatchView,
  VoiceExampleListItemView,
  VoiceExamplesPageView,
  VoiceProfileDiagnosticsView,
  VoiceProfileScreenView,
  VoiceProfileView,
  VoiceReasoningPresentationView
} from "@my-ai-orchestrator/contracts";
import type {
  DerivedVoiceProfile,
  VoiceExample,
  VoiceExampleBatch,
  VoiceProfileDiagnostics
} from "@my-ai-orchestrator/domain";

export function toVoiceProfileView(profile: DerivedVoiceProfile): VoiceProfileView {
  return {
    userId: profile.userId,
    snapshotId: profile.snapshotId,
    version: profile.version,
    confidence: profile.confidence,
    adaptationMode: profile.adaptationMode,
    primaryLanguage: profile.primaryLanguage,
    tone: profile.tone,
    cadence: profile.cadence,
    description: profile.description,
    lexicon: [...profile.lexicon],
    constraints: [...profile.constraints],
    styleMarkers: [...profile.styleMarkers],
    rules: [...profile.rules],
    antiPatterns: [...profile.antiPatterns]
  };
}

export function toVoiceProfileDiagnosticsView(
  diagnostics: VoiceProfileDiagnostics
): VoiceProfileDiagnosticsView {
  return {
    updating: diagnostics.updating,
    activeVersion: diagnostics.activeVersion,
    pendingVersion: diagnostics.pendingVersion,
    summary: diagnostics.summary,
    reasonCodes: [...diagnostics.reasonCodes],
    nextActionCodes: [...diagnostics.nextActionCodes],
    bestCoveredContentTypes: diagnostics.bestCoveredContentTypes.map((item) => ({
      contentType: item.contentType,
      coverage: item.coverage,
      reasonCodes: [...item.reasonCodes]
    })),
    underrepresentedContentTypes: diagnostics.underrepresentedContentTypes.map((item) => ({
      contentType: item.contentType,
      coverage: item.coverage,
      reasonCodes: [...item.reasonCodes]
    })),
    pendingRebuild: {
      status: diagnostics.pendingRebuild.status,
      reasonCode: diagnostics.pendingRebuild.reasonCode,
      nextActionCodes: [...diagnostics.pendingRebuild.nextActionCodes]
    }
  };
}

export function toVoiceProfileScreenView(
  profile: DerivedVoiceProfile,
  diagnostics: VoiceProfileDiagnostics,
  options?: { readonly includeReasoning?: boolean }
): VoiceProfileScreenView {
  return {
    profile: toVoiceProfileView(profile),
    diagnostics: toVoiceProfileDiagnosticsView(diagnostics),
    materialBase: {
      ...diagnostics.materialBase,
      byClassification: { ...diagnostics.materialBase.byClassification },
      byContentType: { ...diagnostics.materialBase.byContentType },
      byLanguage: { ...diagnostics.materialBase.byLanguage }
    },
    ...(options?.includeReasoning && profile.coreReasoningSignature
      ? {
          reasoning: toVoiceReasoningPresentationView(profile, {
            activeExamples: diagnostics.materialBase.activeExamples
          })
        }
      : {})
  };
}

export function toVoiceReasoningPresentationView(
  profile: DerivedVoiceProfile,
  options?: { readonly activeExamples?: number }
): VoiceReasoningPresentationView | undefined {
  if (!profile.coreReasoningSignature) {
    return undefined;
  }

  const formatExpressions = Object.values(profile.formatExpressionProfiles ?? {}).map(
    (expression) => ({ ...expression })
  );

  return {
    core: { ...profile.coreReasoningSignature, derivedAntiPatterns: [...profile.coreReasoningSignature.derivedAntiPatterns] },
    formatExpressions,
    reasoningVersion: profile.version,
    ...(profile.argumentDevelopmentSignature
      ? {
          development: {
            ...profile.argumentDevelopmentSignature,
            moveLabels: [...profile.argumentDevelopmentSignature.moveLabels],
            structuralAntiPatterns: [...profile.argumentDevelopmentSignature.structuralAntiPatterns],
            transitionTendencies: profile.argumentDevelopmentSignature.transitionTendencies.map((tendency) => ({
              ...tendency
            }))
          },
          developmentImmature:
            typeof options?.activeExamples === "number"
            && options.activeExamples >= 2
            && options.activeExamples < 3
        }
      : {})
  };
}

export function toVoiceExampleListItemView(
  example: VoiceExample,
  version: number
): VoiceExampleListItemView {
  return {
    exampleId: example.id,
    version,
    state: example.state,
    text: example.text,
    previewText: buildPreviewText(example.text),
    language: example.language,
    channel: example.channel,
    format: example.format,
    explicitContentType: example.explicitContentType,
    effectiveContentTypeHints: [...example.effectiveContentTypeHints],
    classificationLabels: [...example.classificationLabels],
    pinned: example.pinned,
    pendingProfileImpact: example.pendingProfileImpact,
    targetProfileVersion: example.targetProfileVersion,
    evaluation: {
      systemWeight: example.evaluation.systemWeight,
      attentionLevel: example.evaluation.attentionLevel,
      attentionReasonCodes: deriveAttentionReasonCodes(example),
      contributionCode: example.evaluation.contributionCode,
      contributionPreview: example.evaluation.contributionPreview,
      userPinned: example.evaluation.userPinned
    },
    createdAt: example.createdAt,
    updatedAt: example.updatedAt
  };
}

export function sortVoiceExamples(
  items: readonly VoiceExampleListItemView[]
): readonly VoiceExampleListItemView[] {
  return [...items].sort((left, right) => {
    const attention = attentionRank(right.evaluation.attentionLevel) - attentionRank(left.evaluation.attentionLevel);
    if (attention !== 0) {
      return attention;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function paginateVoiceExamples(
  items: readonly VoiceExampleListItemView[],
  limit: number,
  offset: number
): VoiceExamplesPageView {
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    limit,
    offset
  };
}

export function toVoiceExampleBatchView(batch: VoiceExampleBatch): VoiceExampleBatchView {
  return {
    batchId: batch.id,
    status: batch.status,
    expiresAt: batch.expiresAt,
    acceptedItems: batch.acceptedItems,
    rejectedItems: batch.rejectedItems,
    itemResults: batch.items.map((item) => ({
      clientItemId: item.clientItemId,
      accepted: item.accepted,
      exampleId: item.exampleId,
      reasonCode: item.reasonCode,
      message: item.message
    }))
  };
}

export function toVoiceExampleBatchCommitResultView(batch: VoiceExampleBatch): VoiceExampleBatchCommitResultView {
  return {
    batchId: batch.id,
    committedAt: batch.committedAt ?? batch.updatedAt,
    acceptedItems: batch.acceptedItems,
    rejectedItems: batch.rejectedItems,
    targetProfileVersion: batch.targetProfileVersion
  };
}

export function resolveContributionCode(example: {
  readonly explicitContentType?: string;
  readonly channel?: string;
  readonly text: string;
}): ContributionCode {
  if (example.explicitContentType === "linkedin-post" || example.channel === "linkedin") {
    return "useful_for_linkedin";
  }

  if (example.explicitContentType === "newsletter" || example.channel === "newsletter") {
    return "useful_for_newsletter";
  }

  if (example.explicitContentType === "long-form-blog" || example.channel === "blog") {
    return "useful_for_blog";
  }

  if (/\b(eu|minha|minhas|meu|meus)\b/i.test(example.text)) {
    return "supports_first_person_voice";
  }

  return "reinforces_informal_tone";
}

export function resolveContributionPreview(code: ContributionCode): string {
  switch (code) {
    case "useful_for_linkedin":
      return "Útil para LinkedIn.";
    case "useful_for_newsletter":
      return "Útil para newsletter.";
    case "useful_for_blog":
      return "Útil para blog.";
    case "supports_first_person_voice":
      return "Sustenta escrita em primeira pessoa.";
    case "reinforces_formal_tone":
      return "Reforça um tom mais formal.";
    case "redundant_with_recent_examples":
      return "Redundante em relação a exemplos recentes.";
    case "signals_negative_pattern":
      return "Sinaliza um padrão a evitar.";
    default:
      return "Reforça um tom mais informal.";
  }
}

function buildPreviewText(text: string): string {
  const normalized = text.trim();
  if (normalized.length <= 160) {
    return normalized;
  }

  return `${normalized.slice(0, 157)}...`;
}

function attentionRank(level: AttentionLevel): number {
  switch (level) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function deriveAttentionReasonCodes(example: VoiceExample): readonly AttentionReasonCode[] {
  const reasons: AttentionReasonCode[] = [];

  if (example.text.trim().length < 80) {
    reasons.push("too_short");
  }

  if (example.state === "excluded") {
    reasons.push("excluded_from_profile");
  }

  return reasons;
}
