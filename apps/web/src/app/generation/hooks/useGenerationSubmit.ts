import type {
  GenerationPreviewResponse,
  QualityMode,
  QueuedExecutionView
} from "@my-ai-orchestrator/contracts";
import type { ClientSdk } from "@my-ai-orchestrator/client-sdk";
import { useState } from "react";
import type { GenerationFormSelection } from "~/app/generation/hooks/useGenerationForm";
import type { useGenerationForm } from "~/app/generation/hooks/useGenerationForm";
import type { useGenerationCommercialGate } from "~/app/generation/hooks/useGenerationCommercialGate";
import type { useGenerationWizard } from "~/app/generation/hooks/useGenerationWizard";
import { getContentTypeLabel } from "~/i18n/app/content-types";
import { getIntentLabel } from "~/i18n/app/generation-intents";
import type { AppLocale, AppMessages } from "~/i18n/app/types";
import { setCachedCreditBalance } from "~/platform/credits/credit-balance-cache";
import { formatSdkError } from "~/platform/sdk/format-sdk-error";

export function useGenerationSubmit({
  formSelection,
  form,
  commercialPreview,
  commercialGate,
  previewRecommendation,
  client,
  locale,
  messages,
  registerQueuedExecution,
  openDrawer,
  wizard,
  setLegacyContentTypeId
}: {
  readonly formSelection: GenerationFormSelection | null;
  readonly form: ReturnType<typeof useGenerationForm>;
  readonly commercialPreview: GenerationPreviewResponse | null;
  readonly commercialGate: ReturnType<typeof useGenerationCommercialGate>;
  readonly previewRecommendation: GenerationPreviewResponse["recommendation"] | undefined;
  readonly client: ClientSdk;
  readonly locale: AppLocale;
  readonly messages: AppMessages;
  readonly registerQueuedExecution: (
    queued: QueuedExecutionView,
    meta: {
      readonly contentTypeLabel: string;
      readonly briefing: Record<string, unknown>;
      readonly language: string;
      readonly qualityMode: QualityMode;
    }
  ) => void;
  readonly openDrawer: (jobId: string) => void;
  readonly wizard: ReturnType<typeof useGenerationWizard>;
  readonly setLegacyContentTypeId: (id: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleGenerate() {
    if (
      !formSelection ||
      !commercialPreview ||
      !form.briefingComplete ||
      form.importedTooLarge ||
      commercialGate.noCredits ||
      !commercialGate.selectedModeAllowed
    ) {
      return;
    }

    setSubmitting(true);
    form.setSubmitError(null);

    try {
      const shared = {
        briefing: form.briefing,
        language: form.language,
        qualityMode: form.qualityMode,
        quoteId: commercialPreview.pricingSnapshot.quoteId,
        previewRecommendation,
        importedContext: form.importedContext.trim() ? form.importedContext : undefined
      };

      const queued = await client.toPromise(
        formSelection.mode === "intent"
          ? client.executions.create({
              ...shared,
              intent: formSelection.intent,
              scope: formSelection.scope
            })
          : client.executions.create({
              ...shared,
              contentType: formSelection.contentTypeId
            })
      );

      const contentTypeLabel =
        formSelection.mode === "intent"
          ? getIntentLabel(locale, formSelection.intent, formSelection.catalogItem.label)
          : getContentTypeLabel(locale, formSelection.contentTypeId, formSelection.catalogItem.label);

      registerQueuedExecution(queued, {
        contentTypeLabel,
        briefing: form.briefing,
        language: form.language,
        qualityMode: form.qualityMode
      });
      openDrawer(queued.jobId);
      setCachedCreditBalance(commercialPreview.projectedBalanceAfterGeneration);
      form.resetGenerationForm();
      wizard.resetWizard();
      setLegacyContentTypeId("");
    } catch (error) {
      form.setSubmitError(formatSdkError(error, messages).message);
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, handleGenerate };
}
