import { useAuth0 } from "@auth0/auth0-react";
import type { QualityMode } from "@my-ai-orchestrator/contracts";
import { Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { BriefingGuidancePanel } from "~/app/generation/components/BriefingGuidancePanel";
import { BriefingForm } from "~/app/generation/components/BriefingForm";
import { GenerationPreviewSidebar } from "~/app/generation/components/GenerationPreviewSidebar";
import { QualityModeHelpContent } from "~/app/generation/components/QualityModeHelpContent";
import { useGenerationCommercialGate } from "~/app/generation/hooks/useGenerationCommercialGate";
import { IMPORTED_CONTEXT_MAX, useGenerationForm } from "~/app/generation/hooks/useGenerationForm";
import { getBlockedReason } from "~/app/generation/lib/get-blocked-reason";
import { useContentTypes } from "~/app/generation/lib/use-content-types";
import {
  useCommercialGenerationPreview,
  useFullGenerationPreview
} from "~/app/generation/lib/use-generation-preview";
import { isVoiceStepSkipped } from "~/app/onboarding/lib/onboarding-flags";
import { getContentTypeLabel, getContentTypeDescription } from "~/i18n/app/content-types";
import { getGenerationLanguageLabel } from "~/i18n/app/generation-languages";
import {
  getQualityModeHelpScreenReaderText,
  getQualityModeTooltip
} from "~/i18n/app/quality-mode-tooltips";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useActiveExecutions } from "~/platform/active-executions/active-execution-store";
import { setCachedCreditBalance } from "~/platform/credits/credit-balance-cache";
import { formatSdkError } from "~/platform/sdk/format-sdk-error";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { AppCard } from "~/platform/ui/AppCard";
import { AppField, AppFieldSlot } from "~/platform/ui/AppField";
import { AppSegmentedControl } from "~/platform/ui/AppSegmentedControl";
import { AppSelect } from "~/platform/ui/AppSelect";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";
import { HelpTooltip } from "~/platform/ui/HelpTooltip";

const QUALITY_MODES: readonly QualityMode[] = ["fast", "balanced", "strict"];

export function GenerationScreen() {
  const { user } = useAuth0();
  const { locale, messages } = useAppLocale();
  const client = useClientSdk();
  const { registerQueuedExecution, openDrawer } = useActiveExecutions();
  const { status: catalogStatus, catalog, error: catalogError, retry: retryCatalog } = useContentTypes();
  const [submitting, setSubmitting] = useState(false);

  const form = useGenerationForm(catalog);
  const {
    status: commercialStatus,
    preview: commercialPreview,
    error: commercialError,
    isRefreshing: commercialRefreshing
  } = useCommercialGenerationPreview(form.commercialRequest);
  const {
    status: fullStatus,
    preview: fullPreview,
    error: fullError,
    isStale: recommendationStale,
    isRefreshing: fullRefreshing
  } = useFullGenerationPreview(form.fullPreviewRequest, form.fullRefreshKey);

  const commercialGate = useGenerationCommercialGate({
    qualityMode: form.qualityMode,
    setQualityMode: form.setQualityMode,
    commercialPreview,
    fullPreview,
    catalog
  });

  const previewRecommendation =
    fullPreview?.recommendation && !recommendationStale ? fullPreview.recommendation : undefined;

  async function handleGenerate() {
    if (
      !form.selectedType ||
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
      const queued = await client.toPromise(
        client.executions.create({
          contentType: form.contentTypeId,
          briefing: form.briefing,
          language: form.language,
          qualityMode: form.qualityMode,
          quoteId: commercialPreview.pricingSnapshot.quoteId,
          previewRecommendation,
          importedContext: form.importedContext.trim() ? form.importedContext : undefined
        })
      );

      registerQueuedExecution(queued, {
        contentTypeLabel: getContentTypeLabel(locale, form.contentTypeId, form.selectedType.label),
        briefing: form.briefing,
        language: form.language,
        qualityMode: form.qualityMode
      });
      openDrawer(queued.jobId);
      setCachedCreditBalance(commercialPreview.projectedBalanceAfterGeneration);
      form.resetGenerationForm();
    } catch (error) {
      form.setSubmitError(formatSdkError(error, messages).message);
    } finally {
      setSubmitting(false);
    }
  }

  const commercialErrorMessage = commercialError
    ? formatSdkError(commercialError, messages).message
    : null;
  const fullErrorMessage = fullError ? formatSdkError(fullError, messages).message : null;
  const commercialInitialLoad = commercialStatus === "loading" && !commercialPreview;
  const showCommercialCalculating =
    commercialStatus === "idle" && form.commercialRequest !== null && !commercialPreview;
  const showReminder = isVoiceStepSkipped(user?.sub);

  return (
    <div className="px-[var(--spacing-gutter)] py-8 md:py-10">
      {showReminder ? (
        <div className="mb-6 rounded-2xl border border-golden/40 bg-golden/10 px-4 py-3">
          <Text variant="meta" className="mb-2 block">
            {messages.generate.reminderBanner}
          </Text>
          <Link
            to="/app/voice/examples/new"
            className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
          >
            {messages.generate.reminderBannerAction}
          </Link>
        </div>
      ) : null}

      <Text as="h1" variant="h1" className="mb-3">
        {messages.generate.title}
      </Text>

      {catalogStatus === "loading" && !catalog ? (
        <div className="space-y-3">
          <AppSkeleton className="h-8 w-48" />
          <AppSkeleton className="h-32 w-full" />
        </div>
      ) : null}

      {catalogStatus === "error" && !catalog ? (
        <div className="mb-6 rounded-2xl border border-red-700/30 bg-red-700/10 px-4 py-4">
          <Text variant="body" className="mb-2 text-red-800">
            {messages.generate.catalogLoadError}
          </Text>
          <Text variant="meta" className="mb-3 text-red-800/80">
            {catalogError ? formatSdkError(catalogError, messages).message : messages.errors.default.message}
          </Text>
          <button
            type="button"
            className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
            onClick={retryCatalog}
          >
            {messages.generate.catalogRetry}
          </button>
        </div>
      ) : null}

      {catalog ? (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] lg:items-start lg:gap-8">
          <div className="workspace-stagger-group space-y-6">
            <AppCard padding="compact">
              <AppFieldSlot
                label={messages.generate.contentType}
                labelAccessory={
                  form.contentTypeId && getContentTypeDescription(locale, form.contentTypeId) ? (
                    <HelpTooltip
                      text={getContentTypeDescription(locale, form.contentTypeId)!}
                      ariaLabel={messages.generate.contentTypeHelp}
                      placement="responsive-end"
                      size="wide"
                    />
                  ) : null
                }
              >
                <AppSelect
                  id="content-type"
                  className="w-full"
                  value={form.contentTypeId}
                  onChange={form.handleContentTypeChange}
                  placeholder={messages.generate.contentTypePlaceholder}
                  options={(catalog?.items ?? []).map((item) => ({
                    value: item.id,
                    label: `${getContentTypeLabel(locale, item.id, item.label)}${
                      !item.available ? ` (${getBlockedReason(item.reasonCode, messages)})` : ""
                    }`,
                    disabled: !item.available
                  }))}
                />
              </AppFieldSlot>
            </AppCard>

            {form.selectedType ? (
              <>
                <BriefingGuidancePanel locale={locale} item={form.selectedType} />
                <AppCard>
                  <Text as="h2" variant="label" className="mb-4 block">
                    {messages.generate.briefing}
                  </Text>
                  <BriefingForm
                    locale={locale}
                    contentTypeId={form.selectedType.id}
                    fields={form.selectedType.inputSchema}
                    values={form.briefing}
                    onChange={form.setBriefing}
                  />
                </AppCard>

                <AppCard padding="compact">
                  {form.importedOpen ? (
                    <AppField
                      multiline
                      label={messages.generate.importedContextExpand}
                      value={form.importedContext}
                      onChange={(event) => form.setImportedContext(event.target.value)}
                      maxLength={IMPORTED_CONTEXT_MAX}
                      hint={messages.generate.importedContextCounter.replace(
                        "{count}",
                        String(form.importedContext.length)
                      )}
                      error={form.importedTooLarge ? messages.generate.importedContextTooLarge : undefined}
                    />
                  ) : null}
                  <button
                    type="button"
                    className="text-sm font-medium text-moss underline-offset-2 hover:underline"
                    onClick={() => form.setImportedOpen((open) => !open)}
                  >
                    {form.importedOpen
                      ? messages.generate.importedContextExpand
                      : messages.generate.importedContextExpand}
                  </button>
                </AppCard>

                <AppCard padding="compact">
                  <AppFieldSlot label={messages.generate.language}>
                    <AppSelect
                      value={form.language}
                      onChange={form.setLanguage}
                      options={form.selectedType.supportedLanguages.map((option) => ({
                        value: option,
                        label: getGenerationLanguageLabel(locale, option)
                      }))}
                    />
                  </AppFieldSlot>
                </AppCard>

                <AppCard padding="compact">
                  <AppFieldSlot
                    label={messages.generate.qualityMode}
                    labelAccessory={
                      <HelpTooltip
                        ariaLabel={messages.qualityModes.help}
                        placement="responsive-end"
                        size="wide"
                        screenReaderText={getQualityModeHelpScreenReaderText(
                          locale,
                          form.qualityMode,
                          messages,
                          commercialGate.qualityModeHelpContext
                        )}
                      >
                        <QualityModeHelpContent
                          locale={locale}
                          mode={form.qualityMode}
                          messages={messages}
                          context={commercialGate.qualityModeHelpContext}
                        />
                      </HelpTooltip>
                    }
                  >
                    <AppSegmentedControl
                      name="quality-mode"
                      value={form.qualityMode}
                      onChange={(mode) => form.setQualityMode(mode as QualityMode)}
                      options={QUALITY_MODES.map((mode) => {
                        const option = commercialGate.qualityModeDisplayOptions.find(
                          (candidate) => candidate.id === mode
                        );
                        const allowed = commercialGate.isModeAllowedForUser(mode);
                        const blockedReason =
                          option?.blockedReason ?? (!allowed ? "quality_mode_plan_restriction" : undefined);

                        return {
                          value: mode,
                          disabled: !allowed,
                          ariaLabel: getQualityModeTooltip(locale, mode, messages, {
                            allowed,
                            blockedReason
                          }),
                          label: (
                            <>
                              {messages.qualityModes[mode]}
                              {option?.recommended ? " ★" : ""}
                            </>
                          )
                        };
                      })}
                    />
                  </AppFieldSlot>
                </AppCard>
              </>
            ) : null}
          </div>

          {form.selectedType ? (
            <GenerationPreviewSidebar
              locale={locale}
              messages={messages}
              commercialStatus={commercialStatus}
              commercialPreview={commercialPreview}
              commercialErrorMessage={commercialErrorMessage}
              commercialInitialLoad={commercialInitialLoad}
              showCommercialCalculating={showCommercialCalculating}
              fullStatus={fullStatus}
              fullPreview={fullPreview}
              fullErrorMessage={fullErrorMessage}
              previewRecommendation={previewRecommendation}
              recommendationStale={recommendationStale}
              fullRefreshing={fullRefreshing}
              commercialRefreshing={commercialRefreshing}
              briefingComplete={form.briefingComplete}
              submitError={form.submitError}
              importedTooLarge={form.importedTooLarge}
              submitting={submitting}
              noCredits={commercialGate.noCredits}
              selectedModeAllowed={commercialGate.selectedModeAllowed}
              creditPrice={commercialGate.creditPrice}
              onRefreshRecommendation={() => form.setFullRefreshKey((key) => key + 1)}
              onGenerate={() => void handleGenerate()}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
