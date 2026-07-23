import type {
  OnboardingStatusView,
  VoiceProfileDiagnosticsView,
  VoiceTrainingConsentStatusView
} from "@my-ai-orchestrator/contracts";

export type AppMode = "calibrate" | "locked" | "normal";

// GAP #9 — contratos-por-superficie.md frames the gate as "sem voz → wizard; recusou → travado":
// consent is what blocks. `insufficient_examples` is a *quality* advisory, not an entitlement one —
// deriveReasonCodes emits it below 5 active examples and the calibration wizard only produces 4
// writing steps, so treating it as blocking locked out every author the moment they onboarded.
const LOCKED_REASON_CODES = new Set(["subscription_inactive"]);

export function deriveAppMode(
  onboarding: OnboardingStatusView | undefined,
  consent: VoiceTrainingConsentStatusView | undefined,
  diagnostics: VoiceProfileDiagnosticsView | undefined
): AppMode {
  if (!onboarding?.completed) {
    return "calibrate";
  }

  if (!consent?.granted) {
    return "locked";
  }

  const blocked = diagnostics?.reasonCodes.some((code) => LOCKED_REASON_CODES.has(code)) ?? false;
  return blocked ? "locked" : "normal";
}
