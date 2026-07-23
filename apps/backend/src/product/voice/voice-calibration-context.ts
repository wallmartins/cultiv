import {
  CALIBRATION_WIZARD_STEPS,
  type CalibrationWizardStep,
  type WizardStepId
} from "@my-ai-orchestrator/domain";

export function getCalibrationWizardStep(stepId: WizardStepId): CalibrationWizardStep | undefined {
  return CALIBRATION_WIZARD_STEPS.find((step) => step.id === stepId);
}

// Legacy fixed/default step text, used only when a session has no generated calibration anchor (G3) for
// a step — the context_setup / review_confirm steps, and the initial pre-setContext state that
// refreshSessionStepPrompts overwrites. F3-4 removed THEMES_BY_DOMAIN (dead domain scaffolding): the
// subject-keyed opinion/argument themes are now the generated anchor, so the writable steps just fall
// back to their default text here until the anchor lands.
export function resolveTheme(step: CalibrationWizardStep): string {
  switch (step.id) {
    case "context_setup":
      return "";
    case "reasoning_reflection":
    case "format_adaptation":
      return step.fixedPrompt;
    case "review_confirm":
    case "micro_opinion":
    case "argument_development":
      return step.defaultTheme;
  }
}
