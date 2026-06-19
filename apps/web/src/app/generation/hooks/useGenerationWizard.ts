import type {
  GenerationChannel,
  GenerationIntent,
  GenerationLengthTier,
  GenerationScope
} from "@my-ai-orchestrator/contracts";
import { useCallback, useMemo, useState } from "react";
import type { GenerationIntentCatalogItemView } from "~/app/generation/lib/use-generation-intents";
import {
  buildScopeForIntent,
  canAdvanceToCompose,
  goBackFromScopeStep,
  type WizardStep,
  withChannel,
  withLengthTier
} from "~/app/generation/lib/generation-wizard-logic";

export type { WizardStep };

export function useGenerationWizard(intents: readonly GenerationIntentCatalogItemView[]) {
  const [step, setStep] = useState<WizardStep>(1);
  const [intent, setIntent] = useState<GenerationIntent | null>(null);
  const [scope, setScope] = useState<GenerationScope | null>(null);
  const [showMoreIntents, setShowMoreIntents] = useState(false);

  const selectedIntent = useMemo(
    () => intents.find((item) => item.id === intent) ?? null,
    [intent, intents]
  );

  const isReadyForCompose = canAdvanceToCompose(intent, scope);

  const selectIntent = useCallback(
    (nextIntent: GenerationIntent) => {
      const catalogItem = intents.find((item) => item.id === nextIntent);
      if (!catalogItem) {
        return;
      }

      setIntent(nextIntent);
      setScope(buildScopeForIntent(catalogItem.defaultLengthTier));
      setStep(2);
    },
    [intents]
  );

  const setLengthTier = useCallback((lengthTier: GenerationLengthTier) => {
    setScope((current) => withLengthTier(current, lengthTier));
  }, []);

  const setChannel = useCallback((channel: GenerationChannel) => {
    setScope((current) => withChannel(current, channel));
  }, []);

  const continueFromScope = useCallback(() => {
    if (canAdvanceToCompose(intent, scope)) {
      setStep(3);
    }
  }, [intent, scope]);

  const goBack = useCallback(() => {
    setStep((current) => goBackFromScopeStep(current));
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
