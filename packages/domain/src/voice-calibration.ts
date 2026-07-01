import type { VoiceProfileConfidence } from "@my-ai-orchestrator/contracts";

export const CALIBRATION_WIZARD_STEPS = [
  {
    id: "micro_opinion",
    label: "Opinião curta",
    prompt: "Qual é a sua opinião sobre {theme}?",
    targetWords: 60,
    maxWords: 100,
    targetSentences: 3,
    capturesFeatures: ["lexical", "punctuation", "tone"] as const,
    themePool: [
      "trabalho remoto",
      "um bom café",
      "acordar cedo",
      "melhor formato de conteúdo online"
    ] as const,
    defaultTheme: "trabalho remoto"
  },
  {
    id: "reasoning_reflection",
    label: "Como eu penso",
    prompt: "Conte sobre algo que você aprendeu recentemente e como isso mudou sua perspectiva.",
    fixedPrompt:
      "Conte sobre algo que você aprendeu recentemente e como isso mudou sua perspectiva.",
    targetWords: 150,
    maxWords: 250,
    targetSentences: 10,
    capturesFeatures: ["reasoning", "authority", "certainty"] as const,
    themePool: [] as const,
    defaultTheme: ""
  },
  {
    id: "argument_development",
    label: "Como eu construo",
    prompt: "Defenda uma posição sobre algo que importa para você.",
    targetWords: 250,
    maxWords: 400,
    targetSentences: 15,
    capturesFeatures: ["development", "transitions", "epistemic"] as const,
    themePool: [] as const,
    defaultTheme: "Defenda uma posição sobre algo que importa para você."
  },
  {
    id: "format_adaptation",
    label: "Versatilidade",
    prompt: "Explique algo que você sabe bem para alguém que não conhece o assunto.",
    fixedPrompt: "Explique algo que você sabe bem para alguém que não conhece o assunto.",
    targetWords: 180,
    maxWords: 300,
    targetSentences: 10,
    capturesFeatures: ["register", "complexity", "adaptation"] as const,
    themePool: [] as const,
    defaultTheme: ""
  },
  {
    id: "review_confirm",
    label: "Revisão",
    prompt: "",
    capturesFeatures: ["affirmation"] as const,
    themePool: [] as const,
    defaultTheme: ""
  }
] as const;

export type CalibrationWizardStep = (typeof CALIBRATION_WIZARD_STEPS)[number];
export type WizardStepId = CalibrationWizardStep["id"];

export interface VoiceCalibrationPlanLimits {
  readonly maxWizards: number;
  readonly chargesQuota: boolean;
  readonly maxConfidenceFromCalibration: VoiceProfileConfidence;
}

export const VOICE_CALIBRATION_PLAN_LIMITS: Readonly<
  Record<"free" | "criador" | "pro", VoiceCalibrationPlanLimits>
> = {
  free: {
    maxWizards: 1,
    chargesQuota: true,
    maxConfidenceFromCalibration: "medium"
  },
  criador: {
    maxWizards: 10,
    chargesQuota: false,
    maxConfidenceFromCalibration: "high"
  },
  pro: {
    maxWizards: 10,
    chargesQuota: false,
    maxConfidenceFromCalibration: "high"
  }
};
