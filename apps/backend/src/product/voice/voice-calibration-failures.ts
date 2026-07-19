import type { WizardStepId } from "@my-ai-orchestrator/domain";

export interface VoiceCalibrationFailureRecord {
  readonly stepId: WizardStepId;
  readonly userId: string;
  readonly sessionId: string;
  readonly error: string;
  readonly attemptCount: number;
  readonly failedAt: string;
  readonly phase: "deterministic_extraction" | "example_save" | "llm_extraction" | "confidence";
}

const failures: VoiceCalibrationFailureRecord[] = [];

export function recordWizardStepFailure(record: VoiceCalibrationFailureRecord): void {
  failures.push(record);
}

export function listWizardStepFailures(userId: string): readonly VoiceCalibrationFailureRecord[] {
  return failures.filter((entry) => entry.userId === userId);
}

export function clearWizardStepFailuresForTests(): void {
  failures.length = 0;
}
