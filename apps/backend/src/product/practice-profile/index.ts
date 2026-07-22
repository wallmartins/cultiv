// Practice Profile generator (ADR 0010, plan Phase 2). The 5 generative surfaces (norte gerador-spec):
// G1/G2 = seed→enriched profile, G3 = calibration anchor, G4 = generation slots, G5 = niche-ask.
// All share the same rule: curated structure, LLM fill.
export {
  PRACTICE_PROFILE_ROUTING_PROFILE_ID,
  resolvePracticeProfileLocale,
  resolvePracticeProfileAttempts,
  sameDeclaredAxes,
  type PracticeProfileLocale,
  type DeclaredPracticeAxes,
  type PracticeProfileGenerationDeps
} from "./practice-profile-generation-core.js";
export {
  practiceProfileEntityId,
  practiceProfileDiagnosticsEntityId,
  contractsProfileToDomain,
  domainProfileToContracts
} from "./practice-profile-domain-bridge.js";
export { PracticeProfileGenerationError } from "./practice-profile-errors.js";
export {
  GENERATOR_ANTI_PATTERN_RULES,
  assessClicheLeak,
  buildClicheRetrySuffix,
  namesSpecific,
  containsGenericCliche
} from "./practice-profile-anti-patterns.js";
export {
  generateSeedPracticeProfile,
  enrichPracticeProfile,
  type PracticeProfileEnrichment
} from "./practice-profile-generator.js";
export { buildNicheAsk, type NicheAsk } from "./practice-profile-niche-ask.js";
export {
  generateCalibrationAnchors,
  agnosticCalibrationAnchors,
  type CalibrationAnchor,
  type CalibrationAnchorSet
} from "./practice-profile-calibration-anchor.js";
export {
  generateGenerationSlots,
  backboneGenerationSlots,
  type GenerationSlot,
  type GenerationSlotKey,
  type GenerationSlotSet
} from "./practice-profile-generation-slots.js";
export {
  enrichPracticeProfileForUser,
  type PracticeProfileEnrichmentDeps
} from "./practice-profile-enrichment.js";
