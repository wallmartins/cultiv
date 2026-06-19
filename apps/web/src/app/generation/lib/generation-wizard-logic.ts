import type { GenerationIntent, GenerationLengthTier, GenerationScope } from "@my-ai-orchestrator/contracts";

export type WizardStep = 1 | 2 | 3;

export function buildScopeForIntent(defaultLengthTier: GenerationLengthTier): GenerationScope {
  return { lengthTier: defaultLengthTier };
}

export function canAdvanceToCompose(
  intent: GenerationIntent | null,
  scope: GenerationScope | null
): boolean {
  return intent !== null && scope?.lengthTier !== undefined;
}

export function goBackFromScopeStep(currentStep: WizardStep): WizardStep {
  return currentStep === 2 ? 1 : currentStep;
}

export function withLengthTier(scope: GenerationScope | null, lengthTier: GenerationLengthTier): GenerationScope {
  return {
    ...(scope ?? { lengthTier: "medium" }),
    lengthTier
  };
}

export function withChannel(
  scope: GenerationScope | null,
  channel: GenerationScope["channel"]
): GenerationScope {
  if (!scope) {
    return {
      lengthTier: "medium",
      channel
    };
  }

  return {
    ...scope,
    channel
  };
}
