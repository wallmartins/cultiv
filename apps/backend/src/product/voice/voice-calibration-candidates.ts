import {
  CALIBRATION_WIZARD_STEPS,
  type WizardStepId
} from "@my-ai-orchestrator/domain";
import { getCalibrationWizardStep, resolveTheme } from "./voice-calibration-context.js";

export interface WizardStepPrompt {
  readonly prompt: string;
  readonly theme: string;
  readonly targetWords?: number;
  readonly maxWords?: number;
  readonly minWords?: number;
}

// A generated calibration anchor (G3) for one writable step: the anchored question text plus its fixed
// word target. When present it replaces the legacy resolveTheme text for that step (F3-4).
export interface WizardStepAnchor {
  readonly prompt: string;
  readonly wordTarget: number;
}

export function buildStepPrompt(stepId: WizardStepId, anchor?: WizardStepAnchor): WizardStepPrompt {
  const step = getCalibrationWizardStep(stepId);
  if (!step) {
    throw new Error(`Unknown calibration wizard step: ${stepId}`);
  }

  const maxWords = "maxWords" in step ? step.maxWords : undefined;

  if (anchor) {
    return {
      prompt: anchor.prompt,
      theme: anchor.prompt,
      targetWords: anchor.wordTarget,
      maxWords,
      minWords: Math.floor(anchor.wordTarget * 0.5)
    };
  }

  const theme = resolveTheme(step);
  const prompt = step.prompt.includes("{theme}")
    ? step.prompt.replace("{theme}", theme)
    : "fixedPrompt" in step && step.fixedPrompt
      ? step.fixedPrompt
      : theme || step.prompt;

  const targetWords = "targetWords" in step ? step.targetWords : undefined;
  const minWords = targetWords !== undefined ? Math.floor(targetWords * 0.5) : undefined;

  return {
    prompt,
    theme,
    targetWords,
    maxWords,
    minWords
  };
}

export function listWritableWizardStepIds(): readonly WizardStepId[] {
  return CALIBRATION_WIZARD_STEPS.filter((step) => step.id !== "review_confirm").map(
    (step) => step.id
  );
}
