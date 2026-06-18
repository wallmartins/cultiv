import { Effect } from "effect";
import type { DatabaseClient, VoiceExampleRecord } from "@my-ai-orchestrator/database";
import {
  nextActionCodesForReason,
  type VoiceProfileDiagnostics
} from "@my-ai-orchestrator/domain";
import type {
  ArgumentDevelopmentExtractionResult,
  ArgumentDevelopmentSignature
} from "@my-ai-orchestrator/contracts";
import {
  buildVoiceMaterialBase,
  resolveNextProfileVersion
} from "./voice-rebuild-derivation.js";
import { applyTraitConfidencePass, capTraitConfidenceForImmature } from "./trait-confidence-pass.js";

export function markRebuildQueued(
  database: DatabaseClient,
  userId: string,
  now: () => Date
) {
  return Effect.gen(function* () {
    const timestamp = now().toISOString();
    const profile = yield* database.voiceProfiles.getByUser(userId);
    const currentDiagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);
    const nextVersion = resolveNextProfileVersion(profile, currentDiagnostics);

    const diagnostics: VoiceProfileDiagnostics = {
      id: currentDiagnostics?.id ?? `voice-diagnostics:${userId}`,
      userId,
      activeVersion: currentDiagnostics?.activeVersion ?? profile?.profileVersion ?? 0,
      pendingVersion: nextVersion,
      updating: true,
      summary: currentDiagnostics?.summary ?? "Atualizando o profile de voz com os exemplos mais recentes.",
      reasonCodes: currentDiagnostics?.reasonCodes ?? [],
      nextActionCodes: currentDiagnostics?.nextActionCodes ?? [],
      bestCoveredContentTypes: currentDiagnostics?.bestCoveredContentTypes ?? [],
      underrepresentedContentTypes: currentDiagnostics?.underrepresentedContentTypes ?? [],
      pendingRebuild: {
        status: "in_progress",
        reasonCode: "rebuild_in_progress",
        nextActionCodes: nextActionCodesForReason("rebuild_in_progress")
      },
      materialBase:
        currentDiagnostics?.materialBase ??
        buildVoiceMaterialBase(yield* database.voiceExamples.listByUser(userId)),
      createdAt: currentDiagnostics?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    yield* database.voiceProfileDiagnostics.put(diagnostics).pipe(Effect.orDie);
  });
}

export function markRebuildFailure(
  database: DatabaseClient,
  userId: string,
  now: () => Date,
  _cause: unknown
) {
  return Effect.gen(function* () {
    const timestamp = now().toISOString();
    const profile = yield* database.voiceProfiles.getByUser(userId);
    const currentDiagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);
    const examples = yield* database.voiceExamples.listByUser(userId);
    const materialBase = buildVoiceMaterialBase(examples);

    const diagnostics: VoiceProfileDiagnostics = {
      id: currentDiagnostics?.id ?? `voice-diagnostics:${userId}`,
      userId,
      activeVersion: currentDiagnostics?.activeVersion ?? profile?.profileVersion ?? 0,
      updating: false,
      summary: "Não foi possível atualizar o profile agora. O último profile válido continua ativo.",
      reasonCodes: currentDiagnostics?.reasonCodes ?? ["processing_failed"],
      nextActionCodes:
        currentDiagnostics?.nextActionCodes ?? nextActionCodesForReason("processing_failed"),
      bestCoveredContentTypes: currentDiagnostics?.bestCoveredContentTypes ?? [],
      underrepresentedContentTypes: currentDiagnostics?.underrepresentedContentTypes ?? [],
      pendingRebuild: {
        status: "failed",
        reasonCode: "processing_failed",
        nextActionCodes: nextActionCodesForReason("processing_failed")
      },
      materialBase,
      createdAt: currentDiagnostics?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    yield* database.voiceProfileDiagnostics.put(diagnostics).pipe(Effect.orDie);
  });
}

export function clearProfileImpactFlags(
  database: DatabaseClient,
  examples: readonly VoiceExampleRecord[],
  activeVersion: number,
  timestamp: string
) {
  return Effect.forEach(
    examples.filter(
      (example) =>
        example.pendingProfileImpact &&
        (example.targetProfileVersion === undefined || example.targetProfileVersion <= activeVersion)
    ),
    (example) =>
      database.voiceExamples.save({
        ...example,
        pendingProfileImpact: false,
        targetProfileVersion: activeVersion,
        updatedAt: timestamp
      }).pipe(Effect.orDie),
    { concurrency: 1, discard: true }
  );
}

export function attachTraitProfileToDevelopment(args: {
  readonly extraction: ArgumentDevelopmentExtractionResult;
  readonly activeExamples: readonly VoiceExampleRecord[];
  readonly previousDevelopment?: ArgumentDevelopmentSignature;
}): {
  readonly development: ArgumentDevelopmentSignature;
  readonly confidenceMetrics?: {
    readonly countsByConfidence: Readonly<Record<string, number>>;
    readonly countsByStatus: Readonly<Record<string, number>>;
  };
} {
  const { traits, traitEvidence, development } = args.extraction;
  const confidenceResult = applyTraitConfidencePass({
    traits,
    traitEvidence,
    development,
    activeExamples: args.activeExamples
  });

  if (!confidenceResult) {
    return {
      development: {
        ...development,
        ...(args.previousDevelopment?.traitProfile
          ? { traitProfile: args.previousDevelopment.traitProfile }
          : {})
      }
    };
  }

  const traitProfile = capTraitConfidenceForImmature(
    confidenceResult.profile,
    args.activeExamples.length
  );

  return {
    development: {
      ...development,
      traitProfile
    },
    confidenceMetrics: {
      countsByConfidence: confidenceResult.countsByConfidence,
      countsByStatus: confidenceResult.countsByStatus
    }
  };
}
