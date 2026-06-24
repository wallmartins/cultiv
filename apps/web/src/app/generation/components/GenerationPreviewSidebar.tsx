import type { GenerationPreviewResponse } from "@my-ai-orchestrator/contracts";
import { Button, LogbookProse, Text } from "@my-ai-orchestrator/ui";
import type { AppLocale } from "~/i18n/app/types";
import type { AppMessages } from "~/i18n/app/types";
import { getPreviewRecommendationExplanation } from "~/i18n/app/preview-recommendation";
import type { GenerationPreviewStatus } from "~/app/generation/lib/use-generation-preview";
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
    <aside className="mt-8 lg:mt-0 lg:sticky lg:top-[calc(var(--app-header-height)+1.5rem)] lg:self-start">
      <LogbookProse className="space-y-4 p-5">
        <div className="space-y-1 pb-4">
          <Text as="h2" variant="label" className="font-playfair text-deep-blue">
            {messages.generate.previewTitle}
          </Text>
        </div>

        {commercialInitialLoad ? <AppSkeleton className="h-16 w-full" /> : null}
        {commercialPreview ? (
          <div
            className={`space-y-2 transition-opacity duration-[250ms] ease-out motion-reduce:transition-none ${
              commercialRefreshing ? "opacity-55" : "opacity-100"
            }`}
          >
            {typeof commercialPreview.quotaCost === "number" &&
            typeof commercialPreview.quotaRemaining === "number" &&
            typeof commercialPreview.quotaLimit === "number" ? (
              <Text variant="meta" className="ui-type-mono text-ink-muted">
                {messages.generate.previewQuota
                  .replace("{cost}", String(commercialPreview.quotaCost))
                  .replace("{remaining}", String(commercialPreview.quotaRemaining))
                  .replace("{limit}", String(commercialPreview.quotaLimit))}
              </Text>
            ) : (
              <>
                <div className="rounded-[5px] border border-dotted-cartography bg-cream px-3 py-2.5">
                  <Text variant="meta" className="ui-type-mono text-ink-muted">
                    {messages.generate.previewPrice.replace(
                      "{price}",
                      String(commercialPreview.pricingSnapshot.creditPrice)
                    )}
                  </Text>
                </div>
                <Text variant="meta" className="ui-type-mono text-ink-muted">
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
          <LogbookProse
            className={`p-4 transition-opacity duration-[250ms] ease-out motion-reduce:transition-none ${
              fullRefreshing ? "opacity-55" : "opacity-100"
            }`}
          >
            {previewRecommendation ? (
              <Text variant="logbook" className="text-ink-muted">
                {getPreviewRecommendationExplanation(locale, previewRecommendation, {
                  fast: messages.qualityModes.fast,
                  balanced: messages.qualityModes.balanced,
                  strict: messages.qualityModes.strict
                })}
              </Text>
            ) : null}
            {recommendationStale ? (
              <Text variant="logbook" className="text-ink-muted">
                {messages.generate.previewRecommendationStale}
              </Text>
            ) : null}
          </LogbookProse>
        ) : null}
        {briefingComplete ? (
          <button
            type="button"
            className="text-sm font-medium text-terracotta underline-offset-2 hover:underline disabled:opacity-50"
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
          <Text variant="meta" className="ui-type-mono text-ink-muted">
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
      </LogbookProse>
    </aside>
  );
}
