import { Schema } from "effect";
import {
  AuthoritySourceSchema,
  CertaintyLevelSchema,
  ConclusionPaceSchema,
  DevelopmentTraitsSchema,
  EpistemicPostureSchema,
  JudgmentFrequencySchema,
  ReaderRelationshipSchema,
  TraitEvidenceDraftSchema,
  TransitionFrequencySchema
} from "@my-ai-orchestrator/contracts";

// The LLM occasionally returns an enum value outside its closed set (a hallucinated posture, an
// invented transition frequency). Schema.decodeUnknown is all-or-nothing, so a single stray literal
// reproves the ENTIRE object and the extraction fails deterministically — same model, same prompt,
// same bad output. We coerce only the CATEGORICAL fields to a safe default so decode can succeed.
// The prose (narrativeProse / developmentProse — the actual voice) is NEVER fabricated here: a
// missing or malformed prose still fails decode and triggers the model repair re-ask upstream.

const isEpistemicPosture = Schema.is(EpistemicPostureSchema);
const isTransitionFrequency = Schema.is(TransitionFrequencySchema);
const isDevelopmentTraits = Schema.is(DevelopmentTraitsSchema);
const isTraitEvidenceDraft = Schema.is(TraitEvidenceDraftSchema);
const isCertaintyLevel = Schema.is(CertaintyLevelSchema);
const isJudgmentFrequency = Schema.is(JudgmentFrequencySchema);
const isConclusionPace = Schema.is(ConclusionPaceSchema);
const isReaderRelationship = Schema.is(ReaderRelationshipSchema);
const isAuthoritySource = Schema.is(AuthoritySourceSchema);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizeDevelopmentRaw(raw: unknown): unknown {
  if (!isRecord(raw) || !isRecord(raw.development)) {
    return raw;
  }

  const development: Record<string, unknown> = { ...raw.development };

  if (!isEpistemicPosture(development.epistemicPosture)) {
    development.epistemicPosture = "not_applicable";
  }

  development.transitionTendencies = Array.isArray(development.transitionTendencies)
    ? development.transitionTendencies
        .filter(
          (tendency): tendency is Record<string, unknown> =>
            isRecord(tendency) && typeof tendency.from === "string" && typeof tendency.to === "string"
        )
        .map((tendency) => ({
          ...tendency,
          frequency: isTransitionFrequency(tendency.frequency) ? tendency.frequency : "occasional"
        }))
    : [];

  const result: Record<string, unknown> = { ...raw, development };

  // traits / traitEvidence are optional enhancements — if the model produced an invalid enum in
  // them, drop the whole optional block rather than fail the required signature.
  if (!isDevelopmentTraits(result.traits)) {
    delete result.traits;
  }
  if (!isTraitEvidenceDraft(result.traitEvidence)) {
    delete result.traitEvidence;
  }

  return result;
}

export function sanitizeReasoningRaw(raw: unknown): unknown {
  if (!isRecord(raw) || !isRecord(raw.core)) {
    return raw;
  }

  const core: Record<string, unknown> = { ...raw.core };

  if (!isCertaintyLevel(core.certaintyLevel)) {
    core.certaintyLevel = "moderate";
  }
  if (!isJudgmentFrequency(core.judgmentFrequency)) {
    core.judgmentFrequency = "moderate";
  }
  if (!isConclusionPace(core.conclusionPace)) {
    core.conclusionPace = "moderate";
  }
  if (!isReaderRelationship(core.readerRelationship)) {
    core.readerRelationship = "peer";
  }
  if (!isAuthoritySource(core.authoritySource)) {
    core.authoritySource = "personal_observation";
  }
  if (!Array.isArray(core.derivedAntiPatterns)) {
    core.derivedAntiPatterns = [];
  }

  return { ...raw, core };
}
