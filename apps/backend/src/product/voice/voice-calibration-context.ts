import {
  CALIBRATION_WIZARD_STEPS,
  type CalibrationWizardStep,
  type WizardStepId
} from "@my-ai-orchestrator/domain";

export interface WizardContext {
  readonly domain?: string;
  readonly audience?: string;
  readonly selfDeclaredStrength?: string;
}

export const THEMES_BY_DOMAIN: Readonly<
  Record<string, { readonly opinion: string; readonly argument: string }>
> = {
  tecnologia: {
    opinion: "Vale a pena aprender a programar em 2026?",
    argument: "Ferramentas de IA devem ser obrigatórias no trabalho"
  },
  negocios: {
    opinion: "Trabalho remoto é produtivo ou prejudica o time?",
    argument: "Pequenas empresas devem investir em marca pessoal"
  },
  educacao: {
    opinion: "Escola deveria ensinar mais sobre vida prática?",
    argument: "Avaliação por provas ainda faz sentido"
  },
  saude: {
    opinion: "Exercício regular compensa o tempo que ocupa no dia?",
    argument: "Saúde mental deveria ser prioridade no trabalho"
  },
  criativo: {
    opinion: "Inspiração vem de rotina ou de momentos espontâneos?",
    argument: "Criatividade pode ser ensinada em escolas"
  }
};

export function getCalibrationWizardStep(stepId: WizardStepId): CalibrationWizardStep | undefined {
  return CALIBRATION_WIZARD_STEPS.find((step) => step.id === stepId);
}

export function resolveTheme(step: CalibrationWizardStep, context?: WizardContext): string {
  if (step.id === "reasoning_reflection" || step.id === "format_adaptation") {
    return "fixedPrompt" in step && step.fixedPrompt ? step.fixedPrompt : step.prompt;
  }

  if (step.id === "review_confirm") {
    return step.defaultTheme;
  }

  if (step.id === "micro_opinion" && context?.domain) {
    return THEMES_BY_DOMAIN[context.domain]?.opinion ?? step.defaultTheme;
  }

  if (step.id === "argument_development" && context?.domain) {
    return THEMES_BY_DOMAIN[context.domain]?.argument ?? step.defaultTheme;
  }

  return step.defaultTheme;
}
