import type { AppMessages } from "../types.js";

export const detail: AppMessages["detail"] = {
  voiceAlignment: "Voice alignment",
  appliedTraits: "Applied traits",
  respectedRules: "Rules respected",
  antiPatterns: "Anti-patterns avoided",
  fullVoiceProfile: "See full voice profile →",
  bandOpen: "open →",
  bandClose: "close ×",
  demoVoice: "demo voice",
  writing: "writing in your voice…",
  failedTitle: "This generation failed",
  creditsNotCharged: "your credits weren't charged",
  redo: "Generate again →",
  cancelledReason: "generation cancelled",
  unknownReason: "reason unknown",
  reaction: {
    prompt: "did this sound like you?",
    up: "Spot on",
    down: "Not quite",
    thanks: "thanks — this sharpens your voice"
  },
  voiceVersion: (version) => `voice v${version}`,
  error: {
    notFound: "this generation no longer exists",
    sessionExpired: "your session expired — sign in again",
    generic: "couldn't load this generation"
  }
};
