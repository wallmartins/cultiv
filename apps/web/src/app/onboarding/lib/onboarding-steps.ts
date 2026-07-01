export const WIZARD_DOMAIN_OPTIONS = [
  "tecnologia",
  "negocios",
  "educacao",
  "saude",
  "criativo",
  "outros"
] as const;

export const WIZARD_AUDIENCE_OPTIONS = [
  "colegas",
  "clientes",
  "publico_geral",
  "comunidade_tecnica",
  "estudantes"
] as const;

export type WizardDomainOption = (typeof WIZARD_DOMAIN_OPTIONS)[number];
export type WizardAudienceOption = (typeof WIZARD_AUDIENCE_OPTIONS)[number];

/** Writable wizard steps + review (matches CALIBRATION_WIZARD_STEPS in domain). */
export const CALIBRATION_WIZARD_STEP_IDS = [
  "micro_opinion",
  "reasoning_reflection",
  "argument_development",
  "format_adaptation",
  "review_confirm"
] as const;

export type CalibrationWizardStepId = (typeof CALIBRATION_WIZARD_STEP_IDS)[number];

export const WRITABLE_WIZARD_STEP_IDS = [
  "micro_opinion",
  "reasoning_reflection",
  "argument_development",
  "format_adaptation"
] as const;

export type WritableWizardStepId = (typeof WRITABLE_WIZARD_STEP_IDS)[number];

export function isWritableWizardStep(stepId: string): stepId is WritableWizardStepId {
  return (WRITABLE_WIZARD_STEP_IDS as readonly string[]).includes(stepId);
}

export function resolveWizardStepIndex(stepId: string): number {
  return CALIBRATION_WIZARD_STEP_IDS.indexOf(stepId as CalibrationWizardStepId);
}
