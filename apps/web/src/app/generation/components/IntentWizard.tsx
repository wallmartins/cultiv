import type { GenerationChannel, GenerationLengthTier } from "@my-ai-orchestrator/contracts";
import { Button, cn, Text } from "@my-ai-orchestrator/ui";
import type { useGenerationWizard } from "~/app/generation/hooks/useGenerationWizard";
import type {
  GenerationIntentCatalogItemView,
  GenerationIntentsStatus
} from "~/app/generation/lib/use-generation-intents";
import {
  GENERATION_CHANNEL_IDS,
  GENERATION_LENGTH_TIER_IDS,
  getChannelDescription,
  getChannelLabel,
  getLengthTierDescription,
  getLengthTierLabel
} from "~/i18n/app/generation-intents";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { formatSdkError } from "~/platform/sdk/format-sdk-error";
import { AppCard } from "~/platform/ui/AppCard";
import { AppFieldSlot } from "~/platform/ui/AppField";
import { AppSegmentedControl } from "~/platform/ui/AppSegmentedControl";
import { AppSelect } from "~/platform/ui/AppSelect";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";
import { HelpTooltip } from "~/platform/ui/HelpTooltip";
import { useState } from "react";

type WizardState = ReturnType<typeof useGenerationWizard>;

export interface IntentWizardProps {
  readonly wizard: WizardState;
  readonly featuredIntents: readonly GenerationIntentCatalogItemView[];
  readonly moreIntents: readonly GenerationIntentCatalogItemView[];
  readonly status: GenerationIntentsStatus;
  readonly catalogError: unknown;
  readonly onRetry: () => void;
}

function IntentOptionCard({
  item,
  selected,
  helpLabel,
  onSelect
}: {
  readonly item: GenerationIntentCatalogItemView;
  readonly selected: boolean;
  readonly helpLabel: string;
  readonly onSelect: () => void;
}) {
  return (
    <button type="button" className="w-full text-left" onClick={onSelect}>
      <AppCard
        hover
        padding="compact"
        className={cn(
          "h-full transition-shadow",
          selected && "ring-2 ring-pigment-terracotta/30 ring-offset-2 ring-offset-surface"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Text as="span" variant="label" className="block">
              {item.label}
            </Text>
            <Text as="span" variant="meta" className="block text-muted-foreground">
              {item.description}
            </Text>
          </div>
          {item.description ? (
            <HelpTooltip
              text={item.description}
              ariaLabel={helpLabel}
              placement="responsive-end"
              size="wide"
            />
          ) : null}
        </div>
      </AppCard>
    </button>
  );
}

export function IntentWizard({
  wizard,
  featuredIntents,
  moreIntents,
  status,
  catalogError,
  onRetry
}: IntentWizardProps) {
  const { locale, messages } = useAppLocale();
  const [channelExpanded, setChannelExpanded] = useState(false);

  if (status === "loading" && featuredIntents.length === 0) {
    return (
      <div className="space-y-3">
        <AppSkeleton className="h-8 w-56" />
        <AppSkeleton className="h-28 w-full" />
        <AppSkeleton className="h-28 w-full" />
      </div>
    );
  }

  if (status === "error" && featuredIntents.length === 0) {
    return (
      <div className="rounded-2xl border border-red-700/30 bg-red-700/10 px-4 py-4">
        <Text variant="body" className="mb-2 text-red-800">
          {messages.intentWizard.catalogLoadError}
        </Text>
        <Text variant="meta" className="mb-3 text-red-800/80">
          {catalogError ? formatSdkError(catalogError, messages).message : messages.errors.default.message}
        </Text>
        <button
          type="button"
          className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
          onClick={onRetry}
        >
          {messages.intentWizard.catalogRetry}
        </button>
      </div>
    );
  }

  if (wizard.step === 1) {
    return (
      <div className="workspace-stagger-group space-y-6">
        <div>
          <Text as="h2" variant="h2" className="mb-2">
            {messages.intentWizard.stepObjectiveTitle}
          </Text>
          <Text variant="body" className="text-muted-foreground">
            {messages.intentWizard.stepObjectiveSubtitle}
          </Text>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {featuredIntents.map((item) => (
            <IntentOptionCard
              key={item.id}
              item={item}
              selected={wizard.intent === item.id}
              helpLabel={messages.intentWizard.intentHelp}
              onSelect={() => wizard.selectIntent(item.id)}
            />
          ))}
        </div>

        {moreIntents.length > 0 ? (
          <div className="space-y-3">
            <button
              type="button"
              className="text-sm font-medium text-pigment-terracotta underline-offset-2 hover:underline"
              onClick={() => wizard.setShowMoreIntents((open) => !open)}
            >
              {messages.intentWizard.moreOptions}
            </button>
            {wizard.showMoreIntents ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {moreIntents.map((item) => (
                  <IntentOptionCard
                    key={item.id}
                    item={item}
                    selected={wizard.intent === item.id}
                    helpLabel={messages.intentWizard.intentHelp}
                    onSelect={() => wizard.selectIntent(item.id)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (wizard.step === 2 && wizard.scope) {
    const activeLengthTier = wizard.scope.lengthTier;
    const activeChannel = wizard.scope.channel ?? "unspecified";

    return (
      <div className="workspace-stagger-group space-y-6">
        <div>
          <Text as="h2" variant="h2" className="mb-2">
            {messages.intentWizard.stepScopeTitle}
          </Text>
          <Text variant="body" className="text-muted-foreground">
            {messages.intentWizard.stepScopeSubtitle}
          </Text>
        </div>

        {wizard.selectedIntent ? (
          <AppCard padding="compact" className="border-pigment-terracotta/20 bg-pigment-terracotta/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Text variant="meta" className="mb-1 block text-muted-foreground">
                  {messages.intentWizard.stepObjectiveTitle}
                </Text>
                <Text variant="label">{wizard.selectedIntent.label}</Text>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-pigment-terracotta underline-offset-2 hover:underline"
                onClick={wizard.changeIntent}
              >
                {messages.intentWizard.changeIntent}
              </button>
            </div>
          </AppCard>
        ) : null}

        <AppCard padding="compact">
          <AppFieldSlot label={messages.intentWizard.lengthTier}>
            <AppSegmentedControl
              name="generation-length-tier"
              value={activeLengthTier}
              onChange={(value) => wizard.setLengthTier(value as GenerationLengthTier)}
              options={GENERATION_LENGTH_TIER_IDS.map((tier) => ({
                value: tier,
                label: getLengthTierLabel(locale, tier, tier),
                ariaLabel: getLengthTierDescription(locale, tier)
              }))}
            />
          </AppFieldSlot>
        </AppCard>

        <AppCard padding="compact">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Text variant="label">{messages.intentWizard.channel}</Text>
              <Text variant="meta" className="text-muted-foreground">
                {messages.intentWizard.channelOptional}
              </Text>
            </div>
            {channelExpanded ? (
              <AppFieldSlot label={messages.intentWizard.channel}>
                <AppSelect
                  value={activeChannel}
                  onChange={(value) => wizard.setChannel(value as GenerationChannel)}
                  sortAlphabetically={false}
                  options={GENERATION_CHANNEL_IDS.map((channel) => ({
                    value: channel,
                    label: getChannelLabel(locale, channel, channel)
                  }))}
                />
              </AppFieldSlot>
            ) : (
              <button
                type="button"
                className="text-sm font-medium text-pigment-terracotta underline-offset-2 hover:underline"
                onClick={() => setChannelExpanded(true)}
              >
                {messages.intentWizard.channelExpand}
              </button>
            )}
            {channelExpanded && getChannelDescription(locale, activeChannel) ? (
              <Text variant="meta" className="text-muted-foreground">
                {getChannelDescription(locale, activeChannel)}
              </Text>
            ) : null}
          </div>
        </AppCard>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="ghost" onClick={wizard.goBack}>
            {messages.intentWizard.back}
          </Button>
          <Button type="button" onClick={wizard.continueFromScope} disabled={!wizard.isReadyForCompose}>
            {messages.intentWizard.continue}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
