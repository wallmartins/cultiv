import {
  CALIBRATION_WIZARD_STEPS,
  type CalibrationWizardStep,
  type WizardStepId
} from "@my-ai-orchestrator/domain";
import {
  getCalibrationWizardStep,
  resolveTheme,
  type WizardContext
} from "./voice-calibration-context.js";

export interface WizardStepPrompt {
  readonly prompt: string;
  readonly theme: string;
  readonly targetWords?: number;
  readonly maxWords?: number;
  readonly minWords?: number;
}

export function pickThemeFromPool(step: CalibrationWizardStep, rotationIndex = 0): string {
  if (step.themePool.length === 0) {
    return step.defaultTheme;
  }

  return step.themePool[rotationIndex % step.themePool.length] ?? step.defaultTheme;
}

export function buildStepPrompt(
  stepId: WizardStepId,
  context?: WizardContext,
  rotationIndex = 0
): WizardStepPrompt {
  const step = getCalibrationWizardStep(stepId);
  if (!step) {
    throw new Error(`Unknown calibration wizard step: ${stepId}`);
  }

  const theme =
    step.id === "micro_opinion" && !context?.subject && step.themePool.length > 0
      ? pickThemeFromPool(step, rotationIndex)
      : resolveTheme(step, context);

  const prompt = step.prompt.includes("{theme}")
    ? step.prompt.replace("{theme}", theme)
    : "fixedPrompt" in step && step.fixedPrompt
      ? step.fixedPrompt
      : theme || step.prompt;

  const targetWords = "targetWords" in step ? step.targetWords : undefined;
  const maxWords = "maxWords" in step ? step.maxWords : undefined;
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
