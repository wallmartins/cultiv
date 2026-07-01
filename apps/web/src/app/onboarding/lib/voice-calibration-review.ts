import type { VoiceProfileScreenView } from "@my-ai-orchestrator/contracts";
import { CALIBRATION_WIZARD_STEP_IDS } from "./onboarding-steps";

export const REVIEW_WIZARD_STEP_INDEX = CALIBRATION_WIZARD_STEP_IDS.length - 1;

export function isWizardReviewStep(uiStepIndex: number): boolean {
  return uiStepIndex === REVIEW_WIZARD_STEP_INDEX;
}

export function resolveThinkingReviewBody(
  profile: VoiceProfileScreenView | null
): string | undefined {
  return profile?.reasoning?.core.narrativeProse?.trim() || undefined;
}

export function resolveDevelopmentReviewBody(
  profile: VoiceProfileScreenView | null
): string | undefined {
  return profile?.reasoning?.development?.developmentProse?.trim() || undefined;
}

export function isReviewSectionPending(
  profile: VoiceProfileScreenView | null | undefined,
  body: string | undefined
): boolean {
  if (!body) {
    return true;
  }

  if (!profile) {
    return true;
  }

  return profile.diagnostics.updating;
}

export function shouldPollVoiceProfileOnReview(
  profile: VoiceProfileScreenView | null | undefined,
  pollAttempt: number,
  maxAttempts: number
): boolean {
  if (pollAttempt >= maxAttempts) {
    return false;
  }

  if (!profile) {
    return true;
  }

  if (profile.diagnostics.updating) {
    return true;
  }

  const thinkingReady = Boolean(resolveThinkingReviewBody(profile));
  const developmentReady = Boolean(resolveDevelopmentReviewBody(profile));

  return !thinkingReady || !developmentReady;
}
