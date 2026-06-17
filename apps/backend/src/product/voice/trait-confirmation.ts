import { Effect } from "effect";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import { toVoiceProfileDomain } from "@my-ai-orchestrator/database";
import type {
  NextActionCode,
  TraitConfirmationInput,
  TraitKey,
  VoiceProfileDiagnosticsView
} from "@my-ai-orchestrator/contracts";
import { nextActionCodesForReason, type VoiceProfileDiagnostics } from "@my-ai-orchestrator/domain";
import type { BackendObservabilityService } from "../core/observability-types.js";
import { toVoiceProfileDiagnosticsView } from "./voice-mappers.js";

export function recordTraitConfirmation(
  database: DatabaseClient,
  userId: string,
  input: TraitConfirmationInput,
  now: () => Date,
  observability: BackendObservabilityService
): Effect.Effect<VoiceProfileDiagnosticsView | undefined> {
  return Effect.gen(function* () {
    const diagnosticsRecord = yield* database.voiceProfileDiagnostics.getByUser(userId);
    if (!diagnosticsRecord) {
      return undefined;
    }

    const timestamp = now().toISOString();
    const existingConfirmations = diagnosticsRecord.traitConfirmations ?? {};
    const nextActionCodes = new Set(diagnosticsRecord.nextActionCodes);

    if (input.response === "rejected") {
      for (const code of nextActionCodesForTraitGap(input.traitKey)) {
        nextActionCodes.add(code);
      }
    }

    const diagnostics: VoiceProfileDiagnostics = {
      ...diagnosticsRecord,
      traitConfirmations: {
        ...existingConfirmations,
        [input.traitKey]: {
          response: input.response,
          recordedAt: timestamp
        }
      },
      nextActionCodes:
        input.response === "rejected" ? [...nextActionCodes] : [...diagnosticsRecord.nextActionCodes],
      updatedAt: timestamp
    };

    yield* database.voiceProfileDiagnostics.put(diagnostics).pipe(Effect.orDie);

    const profile = yield* database.voiceProfiles.getByUser(userId);
    if (profile) {
      yield* observability.recordTraitConfirmationRecorded({
        userId,
        traitKey: input.traitKey,
        response: input.response,
        profileVersion: profile.profileVersion
      });
    }

    return toVoiceProfileDiagnosticsView(diagnostics);
  });
}

export function nextActionCodesForTraitGap(traitKey: TraitKey): readonly NextActionCode[] {
  switch (traitKey) {
    case "closingMode":
    case "openingMode":
      return ["review_conflicting_examples"];
    case "usesAnalogies":
      return ["add_examples_from_other_content_types"];
    case "perspectiveShiftDensity":
    case "usesCounterexamples":
    case "selfQuestioning":
    case "insightTiming":
      return ["add_more_examples"];
    default:
      return ["add_more_examples"];
  }
}

export function selectTraitForConfirmation(
  traitProfile: NonNullable<
    ReturnType<typeof toVoiceProfileDomain>["argumentDevelopmentSignature"]
  >["traitProfile"],
  confirmations?: VoiceProfileDiagnostics["traitConfirmations"]
): TraitKey | undefined {
  if (!traitProfile) {
    return undefined;
  }

  const candidates = (Object.keys(traitProfile.records) as TraitKey[])
    .filter((key) => {
      const record = traitProfile.records[key];
      if (!record) {
        return false;
      }
      if (confirmations?.[key]) {
        return false;
      }
      return record.status === "disputed" || record.confidence === "low" || record.confidence === "medium";
    })
    .sort((left, right) => {
      const leftRecord = traitProfile.records[left]!;
      const rightRecord = traitProfile.records[right]!;
      const leftRank = leftRecord.status === "disputed" ? 0 : leftRecord.confidence === "low" ? 1 : 2;
      const rightRank = rightRecord.status === "disputed" ? 0 : rightRecord.confidence === "low" ? 1 : 2;
      return leftRank - rightRank;
    });

  return candidates[0];
}
