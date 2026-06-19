import type { GenerationPreviewResponse } from "@my-ai-orchestrator/contracts";
import { Button, Text } from "@my-ai-orchestrator/ui";
import type { AppLocale } from "~/i18n/app/types";
import type { AppMessages } from "~/i18n/app/types";
import { getPreviewRecommendationExplanation } from "~/i18n/app/preview-recommendation";
import type { GenerationPreviewStatus } from "~/app/generation/lib/use-generation-preview";
import { AppCard } from "~/platform/ui/AppCard";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";

export function GenerationPreviewSidebar({
  locale,
  messages,
  commercialStatus,
  commercialPreview,
  commercialErrorMessage,
  commercialInitialLoad,
  showCommercialCalculating,
  fullStatus,
  fullPreview,
  fullErrorMessage,
  previewRecommendation,
  recommendationStale,
  fullRefreshing,
  commercialRefreshing,
  briefingComplete,
  submitError,
  importedTooLarge,
  submitting,
  noCredits,
  selectedModeAllowed,
  creditPrice,
  fallbackBalance,
  onRefreshRecommendation,
  onGenerate
}: {
  readonly locale: AppLocale;
  readonly messages: AppMessages;
  readonly commercialStatus: GenerationPreviewStatus;
  readonly commercialPreview: GenerationPreviewResponse | null;
  readonly commercialErrorMessage: string | null;
  readonly commercialInitialLoad: boolean;
  readonly showCommercialCalculating: boolean;
  readonly fullStatus: GenerationPreviewStatus;
  readonly fullPreview: GenerationPreviewResponse | null;
  readonly fullErrorMessage: string | null;
  readonly previewRecommendation: GenerationPreviewResponse["recommendation"] | undefined;
  readonly recommendationStale: boolean;
  readonly fullRefreshing: boolean;
  readonly commercialRefreshing: boolean;
  readonly briefingComplete: boolean;
  readonly submitError: string | null;
  readonly importedTooLarge: boolean;
  readonly submitting: boolean;
  readonly noCredits: boolean;
  readonly selectedModeAllowed: boolean;
  readonly creditPrice: number | null;
  readonly fallbackBalance: number | null;
  readonly onRefreshRecommendation: () => void;
  readonly onGenerate: () => void;
}) {
  return (
    <aside className="mt-8 space-y-4 lg:mt-0 lg:sticky lg:top-[calc(var(--app-header-height)+1.5rem)]">
      <AppCard className="space-y-4">
        <Text as="h2" variant="label" className="block">
          {messages.generate.previewTitle}
        </Text>
        {commercialInitialLoad ? <AppSkeleton className="h-16 w-full" /> : null}
        {commercialPreview ? (
          <div
            className={`space-y-2 transition-opacity duration-300 ease-out ${
              commercialRefreshing ? "opacity-55" : "opacity-100"
            }`}
          >
            {typeof commercialPreview.quotaCost === "number" &&
            typeof commercialPreview.quotaRemaining === "number" &&
            typeof commercialPreview.quotaLimit === "number" ? (
              <Text variant="meta">
                {messages.generate.previewQuota
                  .replace("{cost}", String(commercialPreview.quotaCost))
                  .replace("{remaining}", String(commercialPreview.quotaRemaining))
                  .replace("{limit}", String(commercialPreview.quotaLimit))}
              </Text>
            ) : (
              <>
                <Text variant="meta">
                  {messages.generate.previewPrice.replace(
                    "{price}",
                    String(commercialPreview.pricingSnapshot.creditPrice)
                  )}
                </Text>
                <Text variant="meta">
                  {messages.generate.previewBalance
                    .replace(
                      "{current}",
                      String(commercialPreview.currentBalance ?? fallbackBalance ?? "—")
                    )
                    .replace("{projected}", String(commercialPreview.projectedBalanceAfterGeneration))}
                </Text>
              </>
            )}
          </div>
        ) : null}
        {fullStatus === "loading" && !fullPreview && briefingComplete ? (
          <AppSkeleton className="h-10 w-full" />
        ) : null}
        {fullPreview && (previewRecommendation || recommendationStale) ? (
          <div
            className={`space-y-2 transition-opacity duration-300 ease-out ${
              fullRefreshing ? "opacity-55" : "opacity-100"
            }`}
          >
            {previewRecommendation ? (
              <Text variant="meta" className="text-muted-foreground">
                {getPreviewRecommendationExplanation(locale, previewRecommendation, {
                  fast: messages.qualityModes.fast,
                  balanced: messages.qualityModes.balanced,
                  strict: messages.qualityModes.strict
                })}
              </Text>
            ) : null}
            {recommendationStale ? (
              <Text variant="meta" className="text-muted-foreground">
                {messages.generate.previewRecommendationStale}
              </Text>
            ) : null}
          </div>
        ) : null}
        {briefingComplete ? (
          <button
            type="button"
            className="text-sm font-medium text-moss underline-offset-2 hover:underline disabled:opacity-50"
            disabled={fullStatus === "loading"}
            onClick={onRefreshRecommendation}
          >
            {messages.generate.previewRefreshRecommendation}
          </button>
        ) : null}
        {commercialStatus === "error" && commercialErrorMessage ? (
          <Text variant="meta" className="text-red-700">
            {commercialErrorMessage}
          </Text>
        ) : null}
        {fullStatus === "error" && fullErrorMessage ? (
          <Text variant="meta" className="text-red-700">
            {fullErrorMessage}
          </Text>
        ) : null}
        {showCommercialCalculating ? (
          <Text variant="meta" className="text-muted-foreground">
            {messages.generate.calculating}
          </Text>
        ) : null}

        {submitError ? (
          <Text variant="meta" className="text-red-700">
            {submitError}
          </Text>
        ) : null}

        <Button
          type="button"
          className="w-full justify-center"
          disabled={
            !briefingComplete ||
            importedTooLarge ||
            submitting ||
            commercialStatus === "loading" ||
            !commercialPreview ||
            noCredits ||
            !selectedModeAllowed
          }
          onClick={onGenerate}
        >
          {submitting
            ? messages.generate.sending
            : noCredits
              ? messages.generate.noCredits
              : !briefingComplete
                ? messages.generate.incomplete
                : creditPrice !== null
                  ? messages.generate.generateWithCredits.replace("{price}", String(creditPrice))
                  : messages.generate.generate}
        </Button>
      </AppCard>
    </aside>
  );
}
