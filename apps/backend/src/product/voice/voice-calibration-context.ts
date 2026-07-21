import {
  CALIBRATION_WIZARD_STEPS,
  type CalibrationWizardStep,
  type WizardStepId
} from "@my-ai-orchestrator/domain";

export interface WizardContext {
  readonly subject?: string;
  readonly vantagePoint?: string;
  readonly audiences?: readonly string[];
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
  switch (step.id) {
    case "context_setup":
      return "";
    case "reasoning_reflection":
    case "format_adaptation":
      return step.fixedPrompt;
    case "review_confirm":
      return step.defaultTheme;
    // ponytail: F1-3/F3-4 — THEMES_BY_DOMAIN is dead scaffolding (real anchor is the generated
    // one, F3-4); subject is free text now, so this key match rarely hits and falls through.
    case "micro_opinion":
      return context?.subject
        ? (THEMES_BY_DOMAIN[context.subject]?.opinion ?? step.defaultTheme)
        : step.defaultTheme;
    case "argument_development":
      return context?.subject
        ? (THEMES_BY_DOMAIN[context.subject]?.argument ?? step.defaultTheme)
        : step.defaultTheme;
  }
}
