import { useAuth0 } from "@auth0/auth0-react";
import type { QualityMode } from "@my-ai-orchestrator/contracts";
import { CartographySurface, CoordinateLabel, LogbookProse, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BriefingGuidancePanel } from "~/app/generation/components/BriefingGuidancePanel";
import { BriefingForm } from "~/app/generation/components/BriefingForm";
import { GenerationPreviewSidebar } from "~/app/generation/components/GenerationPreviewSidebar";
import { IntentWizard } from "~/app/generation/components/IntentWizard";
import { QualityModeHelpContent } from "~/app/generation/components/QualityModeHelpContent";
import { WizardRouteProgress } from "~/app/generation/components/WizardRouteProgress";
import { useGenerationCommercialGate } from "~/app/generation/hooks/useGenerationCommercialGate";
import {
  IMPORTED_CONTEXT_MAX,
  useGenerationForm,
  type GenerationFormSelection
} from "~/app/generation/hooks/useGenerationForm";
import { useGenerationWizard } from "~/app/generation/hooks/useGenerationWizard";
import { getBlockedReason } from "~/app/generation/lib/get-blocked-reason";
import {
  consumeGeneratePrefill,
  mapLegacyContentTypeToIntent,
  resolveLegacyContentTypeId
} from "~/app/generation/lib/generate-prefill";
import { useContentTypes } from "~/app/generation/lib/use-content-types";
import { useGenerationIntents } from "~/app/generation/lib/use-generation-intents";
import {
  useCommercialGenerationPreview,
  useFullGenerationPreview
} from "~/app/generation/lib/use-generation-preview";
import { useLegacyFormatPickerEnabled } from "~/app/generation/lib/use-legacy-format-picker";
import { isVoiceStepSkipped } from "~/app/onboarding/lib/onboarding-flags";
import { getContentTypeLabel, getContentTypeDescription } from "~/i18n/app/content-types";
import { getGenerationLanguageLabel } from "~/i18n/app/generation-languages";
import { getIntentLabel } from "~/i18n/app/generation-intents";
import {
  getQualityModeHelpScreenReaderText,
  getQualityModeTooltip
} from "~/i18n/app/quality-mode-tooltips";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useActiveExecutions } from "~/platform/active-executions/active-execution-store";
import { setCachedCreditBalance } from "~/platform/credits/credit-balance-cache";
import { formatSdkError } from "~/platform/sdk/format-sdk-error";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
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
  const legacyFormatPickerEnabled = useLegacyFormatPickerEnabled();
  const {
    status: contentTypesStatus,
    catalog: contentTypesCatalog,
    error: contentTypesError,
    retry: retryContentTypes
  } = useContentTypes();
  const {
    status: intentsStatus,
    items: intentItems,
    featuredIntents,
    moreIntents,
    error: intentsError,
    retry: retryIntents
  } = useGenerationIntents();
  const wizard = useGenerationWizard(intentItems);
  const [legacyContentTypeId, setLegacyContentTypeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);

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

  const form = useGenerationForm(formSelection, contentTypesCatalog);
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
    catalog: contentTypesCatalog
  });

  const previewRecommendation =
    fullPreview?.recommendation && !recommendationStale ? fullPreview.recommendation : undefined;

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

  const commercialErrorMessage = commercialError
    ? formatSdkError(commercialError, messages).message
    : null;
  const fullErrorMessage = fullError ? formatSdkError(fullError, messages).message : null;
  const commercialInitialLoad = commercialStatus === "loading" && !commercialPreview;
  const showCommercialCalculating =
    commercialStatus === "idle" && form.commercialRequest !== null && !commercialPreview;
  const showReminder = isVoiceStepSkipped(user?.sub);
  const showComposeStep = formSelection !== null;
  const showWizard = !useLegacyFlow && wizard.step < 3;
  const catalogReady = intentsStatus !== "loading" || intentItems.length > 0;

  return (
    <CartographySurface className="px-[var(--spacing-gutter)] py-8 md:py-10">
      {showReminder ? (
        <LogbookProse className="mb-6 border-ochre/40 bg-ochre/10 p-4">
          <Text variant="meta" className="mb-2 block">
            {messages.generate.reminderBanner}
          </Text>
          <Link
            to="/app/voice/examples/new"
            className="text-sm font-medium text-ink underline-offset-2 hover:underline"
          >
            {messages.generate.reminderBannerAction}
          </Link>
        </LogbookProse>
      ) : null}

      <Text as="h1" variant="h1" className="mb-3 font-playfair text-deep-blue">
        {messages.generate.title}
      </Text>

      {!catalogReady && intentsStatus === "loading" ? (
        <div className="space-y-3">
          <AppSkeleton className="h-8 w-48" />
          <AppSkeleton className="h-32 w-full" />
        </div>
      ) : null}

      {legacyFormatPickerEnabled && contentTypesCatalog ? (
        <LogbookProse className="mb-6 p-4">
          <AppFieldSlot
            label={messages.generate.contentType}
            labelAccessory={
              legacyContentTypeId && getContentTypeDescription(locale, legacyContentTypeId) ? (
                <HelpTooltip
                  text={getContentTypeDescription(locale, legacyContentTypeId)!}
                  ariaLabel={messages.generate.contentTypeHelp}
                  placement="responsive-end"
                  size="wide"
                />
              ) : null
            }
          >
            <AppSelect
              id="content-type-legacy"
              className="w-full"
              value={legacyContentTypeId}
              onChange={(nextContentTypeId) => {
                if (nextContentTypeId !== legacyContentTypeId) {
                  form.setBriefing({});
                }
                setLegacyContentTypeId(nextContentTypeId);
                form.handleLegacyContentTypeChange(nextContentTypeId, contentTypesCatalog);
                wizard.resetWizard();
              }}
              placeholder={messages.generate.contentTypePlaceholder}
              options={(contentTypesCatalog.items ?? []).map((item) => ({
                value: item.id,
                label: `${getContentTypeLabel(locale, item.id, item.label)}${
                  !item.available ? ` (${getBlockedReason(item.reasonCode, messages)})` : ""
                }`,
                disabled: !item.available
              }))}
            />
          </AppFieldSlot>
        </LogbookProse>
      ) : null}

      {legacyFormatPickerEnabled && contentTypesStatus === "error" && !contentTypesCatalog ? (
        <LogbookProse className="mb-6 border-red-700/30 bg-red-700/10 p-4">
          <Text variant="body" className="mb-2 text-red-800">
            {messages.generate.catalogLoadError}
          </Text>
          <Text variant="meta" className="mb-3 text-red-800/80">
            {contentTypesError
              ? formatSdkError(contentTypesError, messages).message
              : messages.errors.default.message}
          </Text>
          <button
            type="button"
            className="text-sm font-medium text-ink underline-offset-2 hover:underline"
            onClick={retryContentTypes}
          >
            {messages.generate.catalogRetry}
          </button>
        </LogbookProse>
      ) : null}

      <div className="lg:grid lg:grid-cols-[minmax(0,13fr)_minmax(280px,7fr)] lg:items-start lg:gap-8">
        <div className="space-y-6">
          {showWizard ? (
            <IntentWizard
              wizard={wizard}
              featuredIntents={featuredIntents}
              moreIntents={moreIntents}
              status={intentsStatus}
              catalogError={intentsError}
              onRetry={retryIntents}
            />
          ) : null}

          {showComposeStep ? (
            <>
              <WizardRouteProgress current={3} messages={messages} />

              <BriefingGuidancePanel
                locale={locale}
                item={formSelection.catalogItem}
                guidanceSource={formSelection.mode === "intent" ? "intent" : "content-type"}
              />
              <LogbookProse className="p-5">
                <CoordinateLabel
                  index={3}
                  label={messages.generate.briefing}
                  className="mb-4 block"
                />
                <BriefingForm
                  locale={locale}
                  contentTypeId={form.fieldLabelKey}
                  fields={form.inputSchema}
                  values={form.briefing}
                  onChange={form.setBriefing}
                />
              </LogbookProse>

              <LogbookProse className="p-5">
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
                  className="text-sm font-medium text-terracotta underline-offset-2 hover:underline"
                  onClick={() => form.setImportedOpen((open) => !open)}
                >
                  {messages.generate.importedContextExpand}
                </button>
              </LogbookProse>

              <LogbookProse className="p-5">
                <AppFieldSlot label={messages.generate.language}>
                  <AppSelect
                    value={form.language}
                    onChange={form.setLanguage}
                    options={form.supportedLanguages.map((option) => ({
                      value: option,
                      label: getGenerationLanguageLabel(locale, option)
                    }))}
                  />
                </AppFieldSlot>
              </LogbookProse>

              <LogbookProse className="p-5">
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
              </LogbookProse>
            </>
          ) : null}
        </div>

        {showComposeStep ? (
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
            fallbackBalance={commercialGate.currentBalance}
            onRefreshRecommendation={() => form.setFullRefreshKey((key) => key + 1)}
            onGenerate={() => void handleGenerate()}
          />
        ) : null}
      </div>
    </CartographySurface>
  );
}
