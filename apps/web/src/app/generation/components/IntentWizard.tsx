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

const intentIcons: Record<string, { readonly path: string; readonly color: string }> = {
  "share-idea": {
    path: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    color: "terracota"
  },
  "explain-deeply": {
    path: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    color: "azul"
  },
  "engage-audience": {
    path: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z",
    color: "ocre"
  },
  "tell-story": {
    path: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "musgo"
  },
  "update-subscribers": {
    path: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    color: "ocre"
  },
  "document-decision": {
    path: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    color: "azul"
  }
};

const colorMap: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  terracota: {
    bg: "bg-terracota/5",
    border: "border-terracota/20",
    text: "text-terracota",
    ring: "ring-terracota/30"
  },
  azul: {
    bg: "bg-azul/5",
    border: "border-azul/15",
    text: "text-azul",
    ring: "ring-azul/30"
  },
  ocre: {
    bg: "bg-ocre/10",
    border: "border-ocre/25",
    text: "text-ocre",
    ring: "ring-ocre/30"
  },
  musgo: {
    bg: "bg-musgo/5",
    border: "border-musgo/20",
    text: "text-musgo",
    ring: "ring-musgo/30"
  }
};

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
  const iconConfig = intentIcons[item.id];
  const colors = iconConfig ? colorMap[iconConfig.color] : colorMap.azul;

  return (
    <button type="button" className="w-full text-left group" onClick={onSelect}>
      <div
        className={cn(
          "relative h-full rounded-[var(--radius-press)] border p-5 transition-all duration-300 overflow-hidden",
          selected
            ? `ring-2 ${colors.ring} ring-offset-2 ring-offset-paper ${colors.border} ${colors.bg} shadow-[4px_4px_0px_rgba(26,46,60,0.08)]`
            : `border-borda/20 bg-offwhite hover:border-borda/30 hover:shadow-[3px_3px_0px_rgba(26,46,60,0.05)]`
        )}
      >
        <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.03] pointer-events-none">
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" />
            <circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
          </svg>
        </div>

        <div className="flex items-start gap-3.5">
          {iconConfig ? (
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border transition-colors duration-300",
              selected ? `${colors.border} ${colors.bg}` : "border-borda/15 bg-creme group-hover:border-borda/25"
            )}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={cn("h-5 w-5 transition-colors duration-300", selected ? colors.text : "text-azul/60 group-hover:text-azul")}>
                <path d={iconConfig.path} />
              </svg>
            </div>
          ) : null}

          <div className="min-w-0 flex-1 space-y-1">
            <Text as="span" variant="label" className={cn("block transition-colors duration-300", selected ? colors.text : "text-azul")}>
              {item.label}
            </Text>
            <Text as="span" variant="meta" className="block text-ink-muted leading-relaxed">
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

        {selected && (
          <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", colors.bg.replace('/5', '').replace('/10', ''))} style={{ background: `var(--color-${iconConfig.color === 'ocre' ? 'ocre' : iconConfig.color === 'musgo' ? 'musgo' : iconConfig.color})`, opacity: 0.3 }} />
        )}
      </div>
    </button>
  );
}

function StepIndicator({ current, total, labels }: { readonly current: number; readonly total: number; readonly labels: string[] }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {labels.map((label, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={index} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-bold transition-colors duration-300",
                isDone
                  ? "border-musgo bg-musgo text-white"
                  : isActive
                    ? "border-terracota bg-terracota/10 text-terracota"
                    : "border-borda/30 bg-creme text-borda"
              )}
            >
              {isDone ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                stepNum
              )}
            </div>
            <span
              className={cn(
                "font-inter text-xs font-medium hidden sm:inline transition-colors duration-300",
                isActive ? "text-azul" : isDone ? "text-musgo" : "text-borda"
              )}
            >
              {label}
            </span>
            {index < labels.length - 1 && (
              <div className={cn(
                "w-8 h-px mx-1 hidden sm:block",
                isDone ? "bg-musgo/40" : "bg-borda/20"
              )} />
            )}
          </div>
        );
      })}
    </div>
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

  const stepLabels = [
    messages.intentWizard.stepObjectiveTitle,
    messages.intentWizard.stepScopeTitle,
    messages.generate.briefing
  ];

  const allIntents = [...featuredIntents, ...moreIntents];

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
      <div className="rounded-[var(--radius-press)] border border-red-700/30 bg-red-700/10 px-4 py-4">
        <Text variant="body" className="mb-2 text-red-800">
          {messages.intentWizard.catalogLoadError}
        </Text>
        <Text variant="meta" className="mb-3 text-red-800/80">
          {catalogError ? formatSdkError(catalogError, messages).message : messages.errors.default.message}
        </Text>
        <button
          type="button"
          className="text-sm font-medium text-ink underline-offset-2 hover:underline"
          onClick={onRetry}
        >
          {messages.intentWizard.catalogRetry}
        </button>
      </div>
    );
  }

  if (wizard.step === 1) {
    return (
      <div className="space-y-6">
        <StepIndicator current={1} total={3} labels={stepLabels} />

        <div>
          <Text as="h2" variant="h2" className="mb-2 font-playfair text-azul">
            {messages.intentWizard.stepObjectiveTitle}
          </Text>
          <Text variant="body" className="text-ink-muted">
            {messages.intentWizard.stepObjectiveSubtitle}
          </Text>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allIntents.map((item) => (
            <IntentOptionCard
              key={item.id}
              item={item}
              selected={wizard.intent === item.id}
              helpLabel={messages.intentWizard.intentHelp}
              onSelect={() => wizard.selectIntent(item.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (wizard.step === 2 && wizard.scope) {
    const activeLengthTier = wizard.scope.lengthTier;
    const activeChannel = wizard.scope.channel ?? "unspecified";

    return (
      <div className="space-y-6">
        <StepIndicator current={2} total={3} labels={stepLabels} />

        <div>
          <Text as="h2" variant="h2" className="mb-2 font-playfair text-azul">
            {messages.intentWizard.stepScopeTitle}
          </Text>
          <Text variant="body" className="text-ink-muted">
            {messages.intentWizard.stepScopeSubtitle}
          </Text>
        </div>

        {wizard.selectedIntent ? (
          <AppCard padding="compact" className="border-terracota/20 bg-terracota/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Text variant="meta" className="mb-1 block text-ink-muted">
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
              <Text variant="meta" className="text-ink-muted">
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
              <Text variant="meta" className="text-ink-muted">
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
