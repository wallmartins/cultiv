import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import type {
  QuantitativeSignals,
  ReasonCode,
  ReasoningExtractionResult,
  VoiceProfileConfidence,
  ArgumentDevelopmentSignature
} from "@my-ai-orchestrator/contracts";
import {
  nextActionCodesForReason,
  type DerivedVoiceProfile,
  type VoiceCoverageItem,
  type VoiceProfileDiagnostics
} from "@my-ai-orchestrator/domain";
import {
  calculateDiversityScore,
  countBy,
  detectLanguageConflict,
  resolveAntiPatterns,
  resolveCadence,
  resolveLexicon,
  resolvePrimaryLanguage,
  resolveRules,
  resolveStyleMarkers,
  resolveTone,
  unique
} from "./voice-rebuild-derivation-resolvers.js";

export interface VoiceRebuildDerivation {
  readonly profile: DerivedVoiceProfile;
  readonly diagnostics: VoiceProfileDiagnostics;
}

export function deriveVoiceRebuildState(args: {
  readonly userId: string;
  readonly version: number;
  readonly timestamp: string;
  readonly allExamples: readonly VoiceExampleRecord[];
  readonly previousProfile?: DerivedVoiceProfile;
  readonly reasoning?: ReasoningExtractionResult;
  readonly development?: ArgumentDevelopmentSignature;
  readonly reasoningExtractionFailed?: boolean;
  readonly developmentExtractionFailed?: boolean;
  readonly reconciliationFailed?: boolean;
  readonly quantitativeSignals?: QuantitativeSignals;
  readonly signatureOpenings?: readonly string[];
  readonly signatureClosings?: readonly string[];
  readonly confidenceCap?: VoiceProfileConfidence;
}): VoiceRebuildDerivation {
  const activeExamples = args.allExamples.filter((example) => example.state === "active");
  const materialBase = buildVoiceMaterialBase(args.allExamples);
  const confidence = deriveConfidence(activeExamples, args.quantitativeSignals, args.confidenceCap);
  const reasonCodes = [...deriveReasonCodes(activeExamples)];
  if (args.reasoningExtractionFailed) {
    reasonCodes.push("reasoning_extraction_failed");
  }
  if (args.developmentExtractionFailed) {
    reasonCodes.push("development_extraction_failed");
  }
  if (args.reconciliationFailed) {
    reasonCodes.push("voice_signature_reconciliation_failed");
  }
  const nextActionCodes = unique(
    reasonCodes.flatMap((reasonCode) => nextActionCodesForReason(reasonCode))
  );
  const coverage = deriveCoverage(activeExamples);

  const profile: DerivedVoiceProfile = {
    id: `voice-profile:${args.userId}`,
    userId: args.userId,
    version: args.version,
    snapshotId: `voice-profile-snapshot:${args.userId}:v${args.version}`,
    confidence,
    adaptationMode: confidence === "low" ? "conservative" : "standard",
    primaryLanguage: resolvePrimaryLanguage(activeExamples),
    tone: resolveTone(activeExamples),
    cadence: resolveCadence(activeExamples),
    description: buildProfileDescription(activeExamples, confidence),
    lexicon: resolveLexicon(activeExamples),
    constraints: confidence === "low" ? ["avoid_voice_caricature"] : ["preserve_author_voice"],
    styleMarkers: resolveStyleMarkers(activeExamples),
    rules: resolveRules(activeExamples, confidence),
    antiPatterns: resolveAntiPatterns(activeExamples),
    coreReasoningSignature:
      args.reasoning?.core ?? args.previousProfile?.coreReasoningSignature,
    argumentDevelopmentSignature:
      args.development ?? args.previousProfile?.argumentDevelopmentSignature,
    quantitativeSignals: args.quantitativeSignals ?? args.previousProfile?.quantitativeSignals,
    signatureOpenings: args.signatureOpenings ?? args.previousProfile?.signatureOpenings,
    signatureClosings: args.signatureClosings ?? args.previousProfile?.signatureClosings,
    createdAt: args.timestamp,
    updatedAt: args.timestamp
  };

  const diagnostics: VoiceProfileDiagnostics = {
    id: `voice-diagnostics:${args.userId}`,
    userId: args.userId,
    activeVersion: args.version,
    updating: false,
    summary: buildDiagnosticsSummary(confidence, reasonCodes, coverage.bestCovered.length),
    reasonCodes,
    nextActionCodes,
    bestCoveredContentTypes: coverage.bestCovered,
    underrepresentedContentTypes: coverage.underrepresented,
    pendingRebuild:
      args.reasoningExtractionFailed
      || args.developmentExtractionFailed
      || args.reconciliationFailed
        ? {
            status: "failed",
            reasonCode: args.reconciliationFailed
              ? "voice_signature_reconciliation_failed"
              : args.developmentExtractionFailed
                ? "development_extraction_failed"
                : "reasoning_extraction_failed",
            nextActionCodes: nextActionCodesForReason(
              args.reconciliationFailed
                ? "voice_signature_reconciliation_failed"
                : args.developmentExtractionFailed
                  ? "development_extraction_failed"
                  : "reasoning_extraction_failed"
            )
          }
        : {
            status: "idle",
            nextActionCodes: []
          },
    materialBase,
    createdAt: args.timestamp,
    updatedAt: args.timestamp
  };

  return {
    profile,
    diagnostics
  };
}

export function buildVoiceMaterialBase(examples: readonly VoiceExampleRecord[]) {
  const activeExamples = examples.filter((example) => example.state === "active");
  const byClassification = countBy(
    examples.flatMap((example) => example.classificationLabels.length > 0 ? example.classificationLabels : ["unclassified"])
  );
  const byContentType = countBy(
    activeExamples.flatMap((example) =>
      example.explicitContentType
        ? [example.explicitContentType]
        : example.effectiveContentTypeHints.length > 0
          ? [...example.effectiveContentTypeHints]
          : ["general"]
    )
  );
  const byLanguage = countBy(examples.map((example) => example.language));

  return {
    totalExamples: examples.length,
    activeExamples: activeExamples.length,
    excludedExamples: examples.filter((example) => example.state === "excluded").length,
    pinnedExamples: activeExamples.filter((example) => example.pinned).length,
    byClassification,
    byContentType,
    byLanguage
  };
}

export function resolveNextProfileVersion(
  currentProfile?: { readonly profileVersion: number },
  currentDiagnostics?: { readonly activeVersion: number; readonly pendingVersion?: number }
): number {
  const activeVersion = currentProfile?.profileVersion ?? currentDiagnostics?.activeVersion ?? 0;
  return Math.max(activeVersion + 1, currentDiagnostics?.pendingVersion ?? 0);
}

const CONFIDENCE_ORDER: readonly VoiceProfileConfidence[] = ["low", "medium", "high"];

function upgradeConfidence(level: VoiceProfileConfidence): VoiceProfileConfidence {
  const index = CONFIDENCE_ORDER.indexOf(level);
  return CONFIDENCE_ORDER[Math.min(index + 1, CONFIDENCE_ORDER.length - 1)]!;
}

function downgradeConfidence(level: VoiceProfileConfidence): VoiceProfileConfidence {
  const index = CONFIDENCE_ORDER.indexOf(level);
  return CONFIDENCE_ORDER[Math.max(index - 1, 0)]!;
}

function minConfidence(
  level: VoiceProfileConfidence,
  cap: VoiceProfileConfidence
): VoiceProfileConfidence {
  return CONFIDENCE_ORDER.indexOf(level) <= CONFIDENCE_ORDER.indexOf(cap) ? level : cap;
}

function deriveLegacyConfidence(activeExamples: readonly VoiceExampleRecord[]): VoiceProfileConfidence {
  if (activeExamples.length < 5) {
    return "low";
  }

  const diversityScore = calculateDiversityScore(activeExamples);
  if (diversityScore < 4) {
    return "medium";
  }

  return "high";
}

function deriveCompositeConfidence(
  activeExamples: readonly VoiceExampleRecord[],
  signals: QuantitativeSignals,
  cap: VoiceProfileConfidence
): VoiceProfileConfidence {
  let base: VoiceProfileConfidence =
    activeExamples.length >= 5 ? "high" : activeExamples.length >= 3 ? "medium" : "low";

  if (signals.consistencyScore > 0.7) {
    base = upgradeConfidence(base);
  }

  if (signals.topicIndependenceScore > 0.6) {
    base = upgradeConfidence(base);
  }

  if (
    signals.extractionQuality.reasoningExtracted
    && signals.extractionQuality.developmentExtracted
  ) {
    base = upgradeConfidence(base);
  }

  if (signals.consistencyScore > 0.95) {
    base = downgradeConfidence(base);
  }

  return minConfidence(base, cap);
}

export function deriveConfidence(
  activeExamples: readonly VoiceExampleRecord[],
  signals?: QuantitativeSignals,
  cap?: VoiceProfileConfidence
): VoiceProfileConfidence {
  if (!signals) {
    return deriveLegacyConfidence(activeExamples);
  }

  return deriveCompositeConfidence(activeExamples, signals, cap ?? "high");
}

function deriveReasonCodes(activeExamples: readonly VoiceExampleRecord[]): readonly ReasonCode[] {
  const reasonCodes: ReasonCode[] = [];
  const diversityScore = calculateDiversityScore(activeExamples);

  if (activeExamples.length < 5) {
    reasonCodes.push("insufficient_examples");
  }

  if (activeExamples.length >= 5 && diversityScore < 4) {
    reasonCodes.push("insufficient_diversity");
  }

  if (detectLanguageConflict(activeExamples)) {
    reasonCodes.push("language_conflict");
  }

  return reasonCodes;
}

function deriveCoverage(activeExamples: readonly VoiceExampleRecord[]) {
  const counts = countBy(
    activeExamples.flatMap((example) =>
      example.explicitContentType
        ? [example.explicitContentType]
        : example.effectiveContentTypeHints.length > 0
          ? [...example.effectiveContentTypeHints]
          : ["general"]
    )
  );

  const items = Object.entries(counts).map(([contentType, total]) => {
    const coverage = total >= 3 ? "high" : total >= 2 ? "medium" : "low";
    const reasonCodes: ReasonCode[] = [];

    if (total < 2) {
      reasonCodes.push("insufficient_examples");
    }

    if (coverage === "low") {
      reasonCodes.push("insufficient_diversity");
    }

    return {
      contentType,
      coverage,
      reasonCodes: unique(reasonCodes)
    } satisfies VoiceCoverageItem;
  });

  return {
    bestCovered: items.filter((item) => item.coverage !== "low"),
    underrepresented: items.filter((item) => item.coverage === "low")
  };
}

function buildDiagnosticsSummary(
  confidence: VoiceProfileConfidence,
  reasonCodes: readonly ReasonCode[],
  wellCoveredContentTypes: number
): string {
  if (reasonCodes.includes("voice_signature_reconciliation_failed")) {
    return "Não foi possível harmonizar o perfil inferido agora. O último snapshot válido continua ativo.";
  }

  if (reasonCodes.includes("development_extraction_failed")) {
    return "Não foi possível atualizar como você desenvolve textos agora. O último snapshot válido continua ativo.";
  }

  if (reasonCodes.includes("reasoning_extraction_failed")) {
    return "Não foi possível atualizar o raciocínio inferido agora. O último snapshot válido continua ativo.";
  }

  if (reasonCodes.includes("insufficient_examples")) {
    return "Ainda faltam exemplos suficientes para consolidar uma voz forte e previsível.";
  }

  if (reasonCodes.includes("language_conflict")) {
    return "A voz já tem base razoável, mas os exemplos misturam idiomas e isso reduz a consistência.";
  }

  if (reasonCodes.includes("insufficient_diversity")) {
    return "Já existe base suficiente, mas ainda falta diversidade de formatos e contextos para estabilizar a voz.";
  }

  if (confidence === "high" && wellCoveredContentTypes > 1) {
    return "A voz do autor está bem representada e cobre bem mais de um tipo de conteúdo.";
  }

  if (confidence === "high") {
    return "A voz do autor está bem representada e pronta para adaptações mais firmes.";
  }

  return "O profile atual já está utilizável, mas ainda pode ficar mais representativo.";
}

function buildProfileDescription(
  activeExamples: readonly VoiceExampleRecord[],
  confidence: VoiceProfileConfidence
): string {
  const tone = resolveTone(activeExamples);
  const cadence = resolveCadence(activeExamples);

  if (confidence === "low") {
    return `Voz ${tone} com cadência ${cadence}, ainda em consolidação.`;
  }

  return `Voz ${tone} com cadência ${cadence} e sinais consistentes entre os exemplos.`;
}
