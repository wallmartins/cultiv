import type { WizardStepId } from "@my-ai-orchestrator/domain";
import { getCalibrationWizardStep } from "./voice-calibration-context.js";

export type TextLengthBucket = "short" | "medium" | "long";

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0).length;
}

export function canAdvance(targetWords: number, wordCount: number): boolean {
  return wordCount >= targetWords * 0.5;
}

export function resolveTextLengthBucket(wordCount: number): TextLengthBucket {
  if (wordCount < 80) {
    return "short";
  }

  if (wordCount <= 200) {
    return "medium";
  }

  return "long";
}

export function buildWizardExampleLabels(
  stepId: WizardStepId,
  _topicTag: string
): readonly string[] {
  return [stepId, "wizard_calibration"];
}

export function resolveStepTargetWords(stepId: WizardStepId): number | undefined {
  const step = getCalibrationWizardStep(stepId);
  return step && "targetWords" in step ? step.targetWords : undefined;
}

export function shouldTriggerRebuildOnStep(stepId: WizardStepId): boolean {
  const writableSteps = ["argument_development", "format_adaptation"] as const;
  return (writableSteps as readonly string[]).includes(stepId);
}
