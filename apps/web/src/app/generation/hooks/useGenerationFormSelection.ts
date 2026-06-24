import type { ContentTypeCatalogView } from "@my-ai-orchestrator/contracts";
import { useMemo, useState } from "react";
import { resolveLegacyContentTypeId } from "~/app/generation/lib/generate-prefill";
import type { GenerationFormSelection } from "~/app/generation/hooks/useGenerationForm";
import type { useGenerationWizard } from "~/app/generation/hooks/useGenerationWizard";

export function useGenerationFormSelection(
  legacyFormatPickerEnabled: boolean,
  contentTypesCatalog: ContentTypeCatalogView | null,
  wizard: ReturnType<typeof useGenerationWizard>
) {
  const [legacyContentTypeId, setLegacyContentTypeId] = useState("");

  const legacySelectedType = useMemo(
    () => contentTypesCatalog?.items.find((item) => item.id === legacyContentTypeId) ?? null,
    [contentTypesCatalog?.items, legacyContentTypeId]
  );

  const useLegacyFlow = legacyFormatPickerEnabled && legacyContentTypeId.length > 0;

  const formSelection = useMemo((): GenerationFormSelection | null => {
    if (useLegacyFlow && legacySelectedType) {
      return {
        mode: "legacy",
        contentTypeId: legacyContentTypeId,
        catalogItem: legacySelectedType
      };
    }

    if (
      wizard.step === 3 &&
      wizard.intent !== null &&
      wizard.scope !== null &&
      wizard.selectedIntent !== null
    ) {
      return {
        mode: "intent",
        intent: wizard.intent,
        scope: wizard.scope,
        catalogItem: wizard.selectedIntent,
        fieldLabelKey: resolveLegacyContentTypeId(wizard.intent, wizard.scope.lengthTier)
      };
    }

    return null;
  }, [
    legacyContentTypeId,
    legacySelectedType,
    useLegacyFlow,
    wizard.intent,
    wizard.scope,
    wizard.selectedIntent,
    wizard.step
  ]);

  return {
    legacyContentTypeId,
    setLegacyContentTypeId,
    useLegacyFlow,
    formSelection
  };
}
