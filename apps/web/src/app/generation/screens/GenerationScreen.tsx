import { useAuth0 } from "@auth0/auth0-react";
import { CartographySurface, cn, LogbookProse, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { GenerationComposeStep } from "~/app/generation/components/GenerationComposeStep";
import { GenerationPreviewSidebar } from "~/app/generation/components/GenerationPreviewSidebar";
import { IntentWizard } from "~/app/generation/components/IntentWizard";
import { LegacyContentTypeSection } from "~/app/generation/components/LegacyContentTypeSection";
import { useGenerationCommercialGate } from "~/app/generation/hooks/useGenerationCommercialGate";
import { useGenerationForm } from "~/app/generation/hooks/useGenerationForm";
import { useGenerationFormSelection } from "~/app/generation/hooks/useGenerationFormSelection";
import { useGenerationPrefill } from "~/app/generation/hooks/useGenerationPrefill";
import { useGenerationSubmit } from "~/app/generation/hooks/useGenerationSubmit";
import { useGenerationWizard } from "~/app/generation/hooks/useGenerationWizard";
import { useContentTypes } from "~/app/generation/lib/use-content-types";
import { useGenerationIntents } from "~/app/generation/lib/use-generation-intents";
import {
  useCommercialGenerationPreview,
  useFullGenerationPreview
} from "~/app/generation/lib/use-generation-preview";
import { useLegacyFormatPickerEnabled } from "~/app/generation/lib/use-legacy-format-picker";
import { isVoiceStepSkipped } from "~/app/onboarding/lib/onboarding-flags";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useActiveExecutions } from "~/platform/active-executions/active-execution-store";
import { formatSdkError } from "~/platform/sdk/format-sdk-error";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";

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
  const { legacyContentTypeId, setLegacyContentTypeId, useLegacyFlow, formSelection } =
    useGenerationFormSelection(legacyFormatPickerEnabled, contentTypesCatalog, wizard);

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

  useGenerationPrefill({ legacyFormatPickerEnabled, wizard, form, setLegacyContentTypeId });

  const { submitting, handleGenerate } = useGenerationSubmit({
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
  });

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
      <div className="mx-auto w-full max-w-7xl">
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

        <LegacyContentTypeSection
          legacyFormatPickerEnabled={legacyFormatPickerEnabled}
          contentTypesCatalog={contentTypesCatalog}
          contentTypesStatus={contentTypesStatus}
          contentTypesError={contentTypesError}
          retryContentTypes={retryContentTypes}
          legacyContentTypeId={legacyContentTypeId}
          setLegacyContentTypeId={setLegacyContentTypeId}
          locale={locale}
          messages={messages}
          form={form}
          wizard={wizard}
        />

        <div
          className={cn(
            showComposeStep &&
              "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,22rem)] lg:items-start lg:gap-10"
          )}
        >
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
              <GenerationComposeStep
                locale={locale}
                messages={messages}
                formSelection={formSelection}
                form={form}
                commercialGate={commercialGate}
              />
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
              fallbackBalance={commercialGate.currentBalance}
              onRefreshRecommendation={() => form.setFullRefreshKey((key) => key + 1)}
              onGenerate={() => void handleGenerate()}
            />
          ) : null}
        </div>
      </div>
    </CartographySurface>
  );
}
