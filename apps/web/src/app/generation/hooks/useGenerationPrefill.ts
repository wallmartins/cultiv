import { useEffect, useState } from "react";
import {
  consumeGeneratePrefill,
  mapLegacyContentTypeToIntent
} from "~/app/generation/lib/generate-prefill";
import type { useGenerationForm } from "~/app/generation/hooks/useGenerationForm";
import type { useGenerationWizard } from "~/app/generation/hooks/useGenerationWizard";

export function useGenerationPrefill({
  legacyFormatPickerEnabled,
  wizard,
  form,
  setLegacyContentTypeId
}: {
  readonly legacyFormatPickerEnabled: boolean;
  readonly wizard: ReturnType<typeof useGenerationWizard>;
  readonly form: ReturnType<typeof useGenerationForm>;
  readonly setLegacyContentTypeId: (id: string) => void;
}) {
  const [prefillApplied, setPrefillApplied] = useState(false);

  useEffect(() => {
    if (prefillApplied) {
      return;
    }

    const prefill = consumeGeneratePrefill();
    if (!prefill) {
      setPrefillApplied(true);
      return;
    }

    if (prefill.intent && prefill.scope) {
      wizard.selectIntent(prefill.intent);
      wizard.setLengthTier(prefill.scope.lengthTier);
      if (prefill.scope.channel) {
        wizard.setChannel(prefill.scope.channel);
      }
      wizard.setStep(3);
    } else if (prefill.contentType) {
      const mapped = mapLegacyContentTypeToIntent(prefill.contentType);
      if (mapped) {
        wizard.selectIntent(mapped.intent);
        wizard.setLengthTier(mapped.scope.lengthTier);
        if (mapped.scope.channel) {
          wizard.setChannel(mapped.scope.channel);
        }
        wizard.setStep(3);
      } else if (legacyFormatPickerEnabled) {
        setLegacyContentTypeId(prefill.contentType);
      }
    }

    form.applyPrefill(prefill);
    setPrefillApplied(true);
    // Prefill is consumed once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, [prefillApplied]);
}
