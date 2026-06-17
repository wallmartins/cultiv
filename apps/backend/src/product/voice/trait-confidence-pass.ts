import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import {
  TRAIT_KEYS,
  type ArgumentDevelopmentSignature,
  type DevelopmentTraitProfile,
  type DevelopmentTraits,
  type TraitConfidence,
  type TraitEvidenceDraft,
  type TraitKey,
  type TraitRecord,
  type TraitStatus,
  type TraitValue
} from "@my-ai-orchestrator/contracts";

export interface TraitConfidencePassResult {
  readonly profile: DevelopmentTraitProfile;
  readonly countsByConfidence: Readonly<Record<TraitConfidence, number>>;
  readonly countsByStatus: Readonly<Record<TraitStatus, number>>;
}

export function applyTraitConfidencePass(args: {
  readonly traits?: DevelopmentTraits;
  readonly traitEvidence?: TraitEvidenceDraft;
  readonly development: ArgumentDevelopmentSignature;
  readonly activeExamples: readonly VoiceExampleRecord[];
}): TraitConfidencePassResult | undefined {
  const activeExampleIds = new Set(args.activeExamples.map((example) => example.id));
  const immature = args.activeExamples.length < 3;
  const traits: DevelopmentTraits = { ...(args.traits ?? {}) };
  const records: Partial<Record<TraitKey, TraitRecord>> = {};
  const countsByConfidence: Record<TraitConfidence, number> = { low: 0, medium: 0, high: 0 };
  const countsByStatus: Record<TraitStatus, number> = {
    inferred: 0,
    confirmed: 0,
    disputed: 0,
    unknown: 0
  };

  let hasAnySignal = false;

  for (const traitKey of TRAIT_KEYS) {
    const proposedValue = traits[traitKey];
    const evidenceIds = normalizeEvidenceIds({
      traitKey,
      traitEvidence: args.traitEvidence,
      activeExamples: args.activeExamples,
      activeExampleIds
    });

    if (proposedValue === undefined && evidenceIds.length === 0) {
      records[traitKey] = {
        confidence: "low",
        status: "unknown",
        evidenceExampleIds: []
      };
      countsByStatus.unknown += 1;
      countsByConfidence.low += 1;
      continue;
    }

    hasAnySignal = true;

    const contradiction = detectContradiction({
      traitKey,
      proposedValue,
      traitEvidence: args.traitEvidence,
      activeExamples: args.activeExamples,
      activeExampleIds
    });

    if (contradiction) {
      records[traitKey] = {
        ...(proposedValue !== undefined ? { value: proposedValue } : {}),
        confidence: "low",
        status: "disputed",
        evidenceExampleIds: evidenceIds
      };
      countsByStatus.disputed += 1;
      countsByConfidence.low += 1;
      continue;
    }

    if (proposedValue === undefined) {
      records[traitKey] = {
        confidence: "low",
        status: "unknown",
        evidenceExampleIds: evidenceIds
      };
      countsByStatus.unknown += 1;
      countsByConfidence.low += 1;
      continue;
    }

    const supportingCount = Math.max(evidenceIds.length, proposedValue !== undefined ? 1 : 0);
    let confidence = deriveConfidence(supportingCount, {
      traitKey,
      value: proposedValue,
      development: args.development
    });
    let status: TraitStatus = "inferred";

    if (immature && confidence === "high") {
      confidence = "medium";
    }

    records[traitKey] = {
      value: proposedValue,
      confidence,
      status,
      evidenceExampleIds: evidenceIds
    };
    countsByConfidence[confidence] += 1;
    countsByStatus[status] += 1;
  }

  if (!hasAnySignal && Object.values(records).every((record) => record?.status === "unknown")) {
    return undefined;
  }

  return {
    profile: {
      traits,
      records: records as Record<TraitKey, TraitRecord>
    },
    countsByConfidence,
    countsByStatus
  };
}

function normalizeEvidenceIds(args: {
  readonly traitKey: TraitKey;
  readonly traitEvidence?: TraitEvidenceDraft;
  readonly activeExamples: readonly VoiceExampleRecord[];
  readonly activeExampleIds: ReadonlySet<string>;
}): readonly string[] {
  const entries = args.traitEvidence?.[args.traitKey] ?? [];
  const ids = entries
    .map((entry) => {
      if (typeof entry.exampleId === "string" && args.activeExampleIds.has(entry.exampleId)) {
        return entry.exampleId;
      }

      if (typeof entry.exampleIndex === "number") {
        const index = entry.exampleIndex - 1;
        const example = args.activeExamples[index];
        return example?.id;
      }

      return undefined;
    })
    .filter((id): id is string => typeof id === "string" && args.activeExampleIds.has(id));

  return [...new Set(ids)];
}

function detectContradiction(args: {
  readonly traitKey: TraitKey;
  readonly proposedValue?: TraitValue;
  readonly traitEvidence?: TraitEvidenceDraft;
  readonly activeExamples: readonly VoiceExampleRecord[];
  readonly activeExampleIds: ReadonlySet<string>;
}): boolean {
  const entries = args.traitEvidence?.[args.traitKey] ?? [];
  const valuesByExample = new Map<string, TraitValue>();

  for (const entry of entries) {
    let exampleId: string | undefined;
    if (typeof entry.exampleId === "string" && args.activeExampleIds.has(entry.exampleId)) {
      exampleId = entry.exampleId;
    } else if (typeof entry.exampleIndex === "number") {
      exampleId = args.activeExamples[entry.exampleIndex - 1]?.id;
    }

    if (!exampleId) {
      continue;
    }

    const entryValue = entry.value ?? args.proposedValue;
    if (entryValue === undefined) {
      continue;
    }

    const previous = valuesByExample.get(exampleId);
    if (previous !== undefined && previous !== entryValue) {
      return true;
    }

    valuesByExample.set(exampleId, entryValue);
  }

  const distinctValues = new Set(valuesByExample.values());
  return distinctValues.size > 1;
}

function deriveConfidence(
  supportingCount: number,
  args: {
    readonly traitKey: TraitKey;
    readonly value: TraitValue;
    readonly development: ArgumentDevelopmentSignature;
  }
): TraitConfidence {
  if (supportingCount >= 3) {
    return "high";
  }

  if (
    supportingCount >= 2
    && hasAlignedTransitionTendency(args.traitKey, args.value, args.development)
  ) {
    return "high";
  }

  if (supportingCount >= 2) {
    return "medium";
  }

  return "low";
}

function hasAlignedTransitionTendency(
  traitKey: TraitKey,
  value: TraitValue,
  development: ArgumentDevelopmentSignature
): boolean {
  if (traitKey === "perspectiveShiftDensity" && (value === "moderate" || value === "high")) {
    return development.transitionTendencies.some(
      (tendency) => tendency.frequency === "common" || tendency.frequency === "dominant"
    );
  }

  if (traitKey === "usesCounterexamples" && value !== "rare") {
    return development.moveLabels.some((label) => /counter|contra/i.test(label));
  }

  if (traitKey === "usesAnalogies" && value !== "rare") {
    return development.moveLabels.some((label) => /analog/i.test(label));
  }

  if (traitKey === "selfQuestioning" && (value === "moderate" || value === "high")) {
    return development.moveLabels.some((label) => /doubt|question|duvida/i.test(label));
  }

  return false;
}

export function capTraitConfidenceForImmature(
  profile: DevelopmentTraitProfile,
  activeExampleCount: number
): DevelopmentTraitProfile {
  if (activeExampleCount >= 3) {
    return profile;
  }

  const records = Object.fromEntries(
    Object.entries(profile.records).map(([key, record]) => {
      if (record.confidence === "high") {
        return [key, { ...record, confidence: "medium" as const }];
      }
      return [key, record];
    })
  ) as Record<TraitKey, TraitRecord>;

  return { ...profile, records };
}

export function mergeTraitConfirmations(
  profile: DevelopmentTraitProfile,
  confirmations: Readonly<Partial<Record<TraitKey, { readonly response: "confirmed" | "rejected" | "skipped" }>>>
): DevelopmentTraitProfile {
  const records = { ...profile.records };

  for (const traitKey of TRAIT_KEYS) {
    const confirmation = confirmations[traitKey];
    const record = records[traitKey];
    if (!confirmation || !record || confirmation.response === "skipped") {
      continue;
    }

    if (confirmation.response === "confirmed") {
      records[traitKey] = {
        ...record,
        status: "confirmed",
        confidence: bumpConfidence(record.confidence)
      };
      continue;
    }

    if (confirmation.response === "rejected") {
      records[traitKey] = {
        ...record,
        status: "disputed",
        confidence: record.confidence
      };
    }
  }

  return { ...profile, records };
}

function bumpConfidence(current: TraitConfidence): TraitConfidence {
  if (current === "low") {
    return "medium";
  }
  return "high";
}
