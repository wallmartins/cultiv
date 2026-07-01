import { CALIBRATION_WIZARD_STEPS, type WizardStepId } from "@my-ai-orchestrator/domain";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";

const WIZARD_STEP_IDS = new Set<string>(CALIBRATION_WIZARD_STEPS.map((step) => step.id));

export function isWizardVoiceExample(example: VoiceExampleRecord): boolean {
  if (example.topicTag !== undefined && example.topicTag.trim().length > 0) {
    return true;
  }

  return example.classificationLabels?.some((label) => WIZARD_STEP_IDS.has(label)) ?? false;
}

export function resolveWizardStepId(example: VoiceExampleRecord): WizardStepId | undefined {
  const fromLabels = example.classificationLabels?.find((label) => WIZARD_STEP_IDS.has(label));
  return fromLabels as WizardStepId | undefined;
}

export function resolveWizardTopicTag(example: VoiceExampleRecord): string {
  if (example.topicTag !== undefined && example.topicTag.trim().length > 0) {
    return example.topicTag.trim();
  }

  return resolveWizardStepId(example) ?? "unknown";
}
