// Presentational view-models for packages/ui/app/onboarding/** — no shared/sdk/enum leakage.
// Containers (apps/web/src/routes/calibrate.tsx, -wizard-overlay.tsx) build these from the real
// VoiceCalibrationSessionView/VoiceProfileScreenView.

export type WizardStepStatus = "done" | "active" | "upcoming";

export interface WizardStepVM {
  readonly id: string;
  readonly label: string;
  readonly status: WizardStepStatus;
}

export interface VoicePreviewVM {
  readonly ringValue: number;
  readonly ringCaption: string;
  readonly headline: string;
  readonly proseCore: string;
  readonly proseDevelopment?: string;
  readonly descriptorChips: readonly string[];
}
