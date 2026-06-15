import { useAuth0 } from "@auth0/auth0-react";
import type { ContentTypeCatalogItemView, QualityMode } from "@my-ai-orchestrator/contracts";
import { Button, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BriefingForm, isBriefingComplete } from "~/app/generation/components/BriefingForm";
import { QualityModeHelpContent } from "~/app/generation/components/QualityModeHelpContent";
import type { AppLocale } from "~/i18n/app/types";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { getBriefingGuidance } from "~/i18n/app/briefing-guidance";
import { getContentTypeLabel, getContentTypeDescription } from "~/i18n/app/content-types";
import { getGenerationLanguageLabel } from "~/i18n/app/generation-languages";
import { getPreviewRecommendationExplanation } from "~/i18n/app/preview-recommendation";
import {
  getQualityModeHelpScreenReaderText,
  getQualityModeTooltip,
  type QualityModeHelpContext
} from "~/i18n/app/quality-mode-tooltips";
import { HelpTooltip } from "~/platform/ui/HelpTooltip";
import { useActiveExecutions } from "~/platform/active-executions/active-execution-store";
import { setCachedCreditBalance } from "~/platform/credits/credit-balance-cache";
import { consumeGeneratePrefill } from "~/app/generation/lib/generate-prefill";
import { useContentTypes } from "~/app/generation/lib/use-content-types";
import { useGenerationPreview } from "~/app/generation/lib/use-generation-preview";
import { isVoiceStepSkipped } from "~/app/onboarding/lib/onboarding-flags";
import { formatSdkError } from "~/platform/sdk/format-sdk-error";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { AppSelect } from "~/platform/ui/AppSelect";
import { AppCard } from "~/platform/ui/AppCard";
import { AppField, AppFieldSlot } from "~/platform/ui/AppField";
import { AppSegmentedControl } from "~/platform/ui/AppSegmentedControl";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";

const IMPORTED_CONTEXT_MAX = 8000;
const QUALITY_MODES: readonly QualityMode[] = ["fast", "balanced", "strict"];

function getBlockedReason(
  reasonCode: string | undefined,
  messages: ReturnType<typeof useAppLocale>["messages"]
): string {
  if (reasonCode === "plan_restriction") {
    return messages.generate.blockedReasons.planRestriction;
  }

  if (reasonCode === "feature_flag_disabled") {
    return messages.generate.blockedReasons.featureFlagDisabled;
  }

  if (reasonCode === "subscription_inactive") {
    return messages.generate.blockedReasons.subscriptionInactive;
  }

  if (reasonCode === "quality_mode_plan_restriction") {
    return messages.generate.blockedReasons.qualityModePlanRestriction;
  }

  if (reasonCode === "insufficient_credits") {
    return messages.generate.blockedReasons.insufficientCredits;
  }

  return messages.generate.blocked;
}

export function GenerationScreen() {
  const { user } = useAuth0();
  const { locale, messages } = useAppLocale();
  const client = useClientSdk();
  const { registerQueuedExecution, openDrawer } = useActiveExecutions();
  const { status: catalogStatus, catalog, error: catalogError, retry: retryCatalog } = useContentTypes();

  const [contentTypeId, setContentTypeId] = useState("");
  const [briefing, setBriefing] = useState<Record<string, unknown>>({});
  const [language, setLanguage] = useState("");
  const [qualityMode, setQualityMode] = useState<QualityMode>("fast");
  const [importedContext, setImportedContext] = useState("");
  const [importedOpen, setImportedOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedType = useMemo(
    () => catalog?.items.find((item) => item.id === contentTypeId) ?? null,
    [catalog?.items, contentTypeId]
  );

  useEffect(() => {
    const prefill = consumeGeneratePrefill();
    if (!prefill) {
      return;
    }

    setContentTypeId(prefill.contentType);
    setBriefing(prefill.briefing ?? {});
    setLanguage(prefill.language ?? "pt-BR");
    setQualityMode(prefill.qualityMode ?? "balanced");
    setImportedContext(prefill.importedContext ?? "");
    if (prefill.importedContext) {
      setImportedOpen(true);
    }
  }, []);

  function handleContentTypeChange(nextContentTypeId: string) {
    if (nextContentTypeId !== contentTypeId) {
      setBriefing({});
    }

    setContentTypeId(nextContentTypeId);

    const nextType = catalog?.items.find((item) => item.id === nextContentTypeId);
    if (nextType) {
      setLanguage(nextType.defaultLanguage);
    }
  }

  const previewRequest = useMemo(() => {
    if (!selectedType || !language || !isBriefingComplete(selectedType.inputSchema, briefing)) {
      return null;
    }

    return {
      contentType: contentTypeId,
      briefing,
      language,
      qualityMode,
      importedContext: importedContext.trim() ? importedContext : undefined
    };
  }, [briefing, contentTypeId, importedContext, language, qualityMode, selectedType]);

  const { status: previewStatus, preview, error: previewError } = useGenerationPreview(previewRequest);

  const qualityModeOptions = preview?.options.qualityModes ?? [];
  const catalogAllowedModes = catalog?.commercial?.allowedQualityModes;

  function isModeAllowedForUser(mode: QualityMode): boolean {
    const previewOption = qualityModeOptions.find((option) => option.id === mode);
    if (previewOption) {
      return previewOption.allowed;
    }

    return catalogAllowedModes?.includes(mode) ?? false;
  }

  const selectedModeAllowed = isModeAllowedForUser(qualityMode);

  const qualityModeHelpContext = useMemo((): QualityModeHelpContext => {
    const selectedOption = qualityModeOptions.find((option) => option.id === qualityMode);

    return {
      allowed: selectedModeAllowed,
      blockedReason:
        selectedOption?.blockedReason ?? (!selectedModeAllowed ? "quality_mode_plan_restriction" : undefined)
    };
  }, [qualityMode, qualityModeOptions, selectedModeAllowed]);

  useEffect(() => {
    if (!catalogAllowedModes?.length || catalogAllowedModes.includes(qualityMode)) {
      return;
    }

    setQualityMode(catalogAllowedModes[0] ?? "fast");
  }, [catalogAllowedModes, qualityMode]);

  useEffect(() => {
    if (qualityModeOptions.length === 0 || selectedModeAllowed) {
      return;
    }

    const fallback =
      qualityModeOptions.find((option) => option.recommended && option.allowed) ??
      qualityModeOptions.find((option) => option.allowed);

    if (fallback && fallback.id !== qualityMode) {
      setQualityMode(fallback.id);
    }
  }, [qualityMode, qualityModeOptions, selectedModeAllowed]);

  const briefingComplete = selectedType
    ? isBriefingComplete(selectedType.inputSchema, briefing)
    : false;
  const importedTooLarge = importedContext.length > IMPORTED_CONTEXT_MAX;
  const currentBalance = preview?.currentBalance ?? null;
  const creditPrice = preview?.pricingSnapshot.creditPrice ?? null;
  const noCredits = currentBalance !== null && creditPrice !== null && currentBalance < creditPrice;

  async function handleGenerate() {
    if (!selectedType || !preview || !briefingComplete || importedTooLarge || noCredits || !selectedModeAllowed) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const queued = await client.toPromise(
        client.executions.create({
          contentType: contentTypeId,
          briefing,
          language,
          qualityMode,
          quoteId: preview.pricingSnapshot.quoteId,
          previewRecommendation: preview.recommendation,
          importedContext: importedContext.trim() ? importedContext : undefined
        })
      );

      registerQueuedExecution(queued, {
        contentTypeLabel: getContentTypeLabel(locale, contentTypeId, selectedType.label),
        briefing,
        language,
        qualityMode
      });
      openDrawer(queued.jobId);
      setCachedCreditBalance(preview.projectedBalanceAfterGeneration);
    } catch (error) {
      setSubmitError(formatSdkError(error, messages).message);
    } finally {
      setSubmitting(false);
    }
  }

  const previewErrorMessage = previewError
    ? formatSdkError(previewError, messages).message
    : null;

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
                  contentTypeId && getContentTypeDescription(locale, contentTypeId) ? (
                    <HelpTooltip
                      text={getContentTypeDescription(locale, contentTypeId)!}
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
                  value={contentTypeId}
                  onChange={handleContentTypeChange}
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

          {selectedType ? (
            <>
              <BriefingGuidancePanel locale={locale} item={selectedType} />
              <AppCard>
                <Text as="h2" variant="label" className="mb-4 block">
                  {messages.generate.briefing}
                </Text>
                <BriefingForm
                  locale={locale}
                  contentTypeId={selectedType.id}
                  fields={selectedType.inputSchema}
                  values={briefing}
                  onChange={setBriefing}
                />
              </AppCard>

              <AppCard padding="compact">
                {importedOpen ? (
                  <AppField
                    multiline
                    label={messages.generate.importedContextExpand}
                    value={importedContext}
                    onChange={(event) => setImportedContext(event.target.value)}
                    maxLength={IMPORTED_CONTEXT_MAX}
                    hint={messages.generate.importedContextCounter.replace(
                      "{count}",
                      String(importedContext.length)
                    )}
                    error={importedTooLarge ? messages.generate.importedContextTooLarge : undefined}
                  />
                ) : null}
                <button
                  type="button"
                  className="text-sm font-medium text-moss underline-offset-2 hover:underline"
                  onClick={() => setImportedOpen((open) => !open)}
                >
                  {importedOpen
                    ? messages.generate.importedContextExpand
                    : messages.generate.importedContextExpand}
                </button>
              </AppCard>

              <AppCard padding="compact">
                <AppFieldSlot label={messages.generate.language}>
                  <AppSelect
                    value={language}
                    onChange={setLanguage}
                    options={selectedType.supportedLanguages.map((option) => ({
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
                        qualityMode,
                        messages,
                        qualityModeHelpContext
                      )}
                    >
                      <QualityModeHelpContent
                        locale={locale}
                        mode={qualityMode}
                        messages={messages}
                        context={qualityModeHelpContext}
                      />
                    </HelpTooltip>
                  }
                >
                  <AppSegmentedControl
                    name="quality-mode"
                    value={qualityMode}
                    onChange={(mode) => setQualityMode(mode as QualityMode)}
                    options={QUALITY_MODES.map((mode) => {
                      const option = qualityModeOptions.find((candidate) => candidate.id === mode);
                      const allowed = isModeAllowedForUser(mode);
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

          {selectedType ? (
            <aside className="mt-8 space-y-4 lg:mt-0 lg:sticky lg:top-[calc(var(--app-header-height)+1.5rem)]">
              <AppCard className="space-y-4">
                <Text as="h2" variant="label" className="block">
                  {messages.generate.previewTitle}
                </Text>
                {previewStatus === "loading" ? (
                  <AppSkeleton className="h-16 w-full" />
                ) : null}
                {preview ? (
                  <div className="space-y-2">
                    <Text variant="meta">
                      {messages.generate.previewPrice.replace("{price}", String(preview.pricingSnapshot.creditPrice))}
                    </Text>
                    <Text variant="meta">
                      {messages.generate.previewBalance
                        .replace("{current}", String(preview.currentBalance))
                        .replace("{projected}", String(preview.projectedBalanceAfterGeneration))}
                    </Text>
                    {preview.recommendation ? (
                      <Text variant="meta" className="text-muted-foreground">
                        {getPreviewRecommendationExplanation(locale, preview.recommendation, {
                          fast: messages.qualityModes.fast,
                          balanced: messages.qualityModes.balanced,
                          strict: messages.qualityModes.strict
                        })}
                      </Text>
                    ) : null}
                  </div>
                ) : null}
                {previewStatus === "error" && previewErrorMessage ? (
                  <Text variant="meta" className="text-red-700">
                    {previewErrorMessage}
                  </Text>
                ) : null}
                {previewStatus === "idle" && briefingComplete ? (
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
                    previewStatus === "loading" ||
                    !preview ||
                    noCredits ||
                    !selectedModeAllowed
                  }
                  onClick={() => void handleGenerate()}
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function BriefingGuidancePanel({
  locale,
  item
}: {
  readonly locale: AppLocale;
  readonly item: ContentTypeCatalogItemView;
}) {
  const { messages } = useAppLocale();
  const guidance = getBriefingGuidance(locale, item.id, item.briefingGuidance);

  return (
    <AppCard className="bg-soft-loam/30">
      <Text as="h2" variant="label" className="mb-2">
        {messages.generate.guidanceTitle}
      </Text>
      <Text variant="meta" className="mb-3 block">
        {guidance.objective}
      </Text>
      {guidance.tips.length > 0 ? (
        <div className="mb-3">
          <Text variant="meta" className="mb-1 font-medium">
            {messages.generate.guidanceTips}
          </Text>
          <ul className="list-disc space-y-1 pl-5">
            {guidance.tips.map((tip) => (
              <li key={tip}>
                <Text variant="meta">{tip}</Text>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {guidance.commonMistakes.length > 0 ? (
        <div>
          <Text variant="meta" className="mb-1 font-medium">
            {messages.generate.guidanceMistakes}
          </Text>
          <ul className="list-disc space-y-1 pl-5">
            {guidance.commonMistakes.map((mistake) => (
              <li key={mistake}>
                <Text variant="meta">{mistake}</Text>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </AppCard>
  );
}
