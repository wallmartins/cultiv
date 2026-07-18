import type {
  OnboardingStatusView,
  VoiceProfileDiagnosticsView,
  VoiceTrainingConsentStatusView
} from "@my-ai-orchestrator/contracts";

export type AppMode = "calibrate" | "locked" | "normal";

// GAP #9 — the two reason codes the spec calls out as blocking (contratos-por-superficie.md).
const LOCKED_REASON_CODES = new Set(["insufficient_examples", "subscription_inactive"]);

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
