import type {
  GenerationChannel,
  GenerationIntent,
  GenerationLengthTier,
  GenerationScope
} from "@my-ai-orchestrator/contracts";
import { useCallback, useMemo, useState } from "react";
import type { GenerationIntentCatalogItemView } from "~/app/generation/lib/use-generation-intents";

export type WizardStep = 1 | 2 | 3;

const INITIAL_SCOPE: GenerationScope = {
  lengthTier: "medium"
};

export function useGenerationWizard(intents: readonly GenerationIntentCatalogItemView[]) {
  const [step, setStep] = useState<WizardStep>(1);
  const [intent, setIntent] = useState<GenerationIntent | null>(null);
  const [scope, setScope] = useState<GenerationScope | null>(null);
  const [showMoreIntents, setShowMoreIntents] = useState(false);

  const selectedIntent = useMemo(
    () => intents.find((item) => item.id === intent) ?? null,
    [intent, intents]
  );

  const isReadyForCompose = intent !== null && scope?.lengthTier !== undefined;

  const selectIntent = useCallback(
    (nextIntent: GenerationIntent) => {
      const catalogItem = intents.find((item) => item.id === nextIntent);
      if (!catalogItem) {
        return;
      }

      setIntent(nextIntent);
      setScope({
        lengthTier: catalogItem.defaultLengthTier
      });
      setStep(2);
    },
    [intents]
  );

  const setLengthTier = useCallback((lengthTier: GenerationLengthTier) => {
    setScope((current) => ({
      ...(current ?? INITIAL_SCOPE),
      lengthTier
    }));
  }, []);

  const setChannel = useCallback((channel: GenerationChannel) => {
    setScope((current) => {
      if (!current) {
        return {
          lengthTier: "medium",
          channel
        };
      }

      return {
        ...current,
        channel
      };
    });
  }, []);

  const continueFromScope = useCallback(() => {
    if (intent !== null && scope?.lengthTier !== undefined) {
      setStep(3);
    }
  }, [intent, scope?.lengthTier]);

  const goBack = useCallback(() => {
    setStep((current) => (current === 2 ? 1 : current));
  }, []);

  const changeIntent = useCallback(() => {
    setStep(1);
  }, []);

  const resetWizard = useCallback(() => {
    setStep(1);
    setIntent(null);
    setScope(null);
    setShowMoreIntents(false);
  }, []);

  return {
    step,
    intent,
    scope,
    showMoreIntents,
    setShowMoreIntents,
    selectedIntent,
    isReadyForCompose,
    selectIntent,
    setLengthTier,
    setChannel,
    continueFromScope,
    goBack,
    changeIntent,
    resetWizard,
    setStep
  };
}
