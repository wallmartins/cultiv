import type {
  VoiceCalibrationSessionView,
  VoiceProfileScreenView
} from "@my-ai-orchestrator/contracts";
import { CALIBRATION_WIZARD_STEP_IDS } from "./onboarding-steps";

export const REVIEW_WIZARD_STEP_INDEX = CALIBRATION_WIZARD_STEP_IDS.length - 1;

export function isWizardReviewStep(uiStepIndex: number): boolean {
  return uiStepIndex === REVIEW_WIZARD_STEP_INDEX;
}

export function resolveDevelopmentReviewBody(
  profile: VoiceProfileScreenView | null,
  session: VoiceCalibrationSessionView | null
): string | undefined {
  const extracted = profile?.reasoning?.development?.developmentProse?.trim();
  if (extracted) {
    return extracted;
  }

  if (profile?.diagnostics?.updating) {
    return undefined;
  }

  return session?.steps.find((step) => step.stepId === "argument_development")?.text?.trim();
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

  return !profile.reasoning?.development?.developmentProse?.trim();
}
