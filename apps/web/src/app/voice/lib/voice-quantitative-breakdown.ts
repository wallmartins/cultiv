import type { VoiceExampleListItemView } from "@my-ai-orchestrator/contracts";
import { WRITABLE_WIZARD_STEP_IDS } from "~/app/onboarding/lib/onboarding-steps";
import { countWords } from "~/app/onboarding/lib/voice-calibration-word-count";

function estimateAvgSentenceLength(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((part) => part.trim().length > 0);
  const words = countWords(text);

  if (sentences.length === 0) {
    return words;
  }

  return words / sentences.length;
}

function resolveWizardStepId(example: VoiceExampleListItemView): string | undefined {
  return example.classificationLabels.find((label) =>
    (WRITABLE_WIZARD_STEP_IDS as readonly string[]).includes(label)
  );
}

export function buildWizardStepVariances(
  examples: readonly VoiceExampleListItemView[]
): readonly { readonly stepId: string; readonly variance: number }[] {
  const wizardExamples = examples.filter((example) =>
    example.classificationLabels.includes("wizard_calibration")
  );

  const byStep = new Map<string, number[]>();

  for (const example of wizardExamples) {
    const stepId = resolveWizardStepId(example);
    if (!stepId) {
      continue;
    }

    const lengths = byStep.get(stepId) ?? [];
    lengths.push(estimateAvgSentenceLength(example.text));
    byStep.set(stepId, lengths);
  }

  const globalLengths = [...byStep.values()].flat();
  const globalMean =
    globalLengths.length > 0
      ? globalLengths.reduce((total, value) => total + value, 0) / globalLengths.length
      : 0;

  return WRITABLE_WIZARD_STEP_IDS.map((stepId) => {
    const lengths = byStep.get(stepId) ?? [];
    if (lengths.length === 0 || globalMean === 0) {
      return { stepId, variance: 0 };
    }

    const stepMean = lengths.reduce((total, value) => total + value, 0) / lengths.length;
    return { stepId, variance: Math.abs(stepMean - globalMean) / globalMean };
  });
}
