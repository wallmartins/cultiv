import type { GenerationChannel, GenerationLengthTier } from "@my-ai-orchestrator/contracts";
import {
  Button,
  cn,
  ExpeditionCard,
  IconLetter,
  IconMap,
  IconPen,
  IconPin,
  IconRoute,
  IconScroll,
  LogbookProse,
  Text
} from "@my-ai-orchestrator/ui";
import type { ReactNode } from "react";
import { useState } from "react";
import { WizardRouteProgress } from "~/app/generation/components/WizardRouteProgress";
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
  getIntentDescription,
  getIntentLabel,
  getLengthTierDescription,
  getLengthTierLabel
} from "~/i18n/app/generation-intents";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { formatSdkError } from "~/platform/sdk/format-sdk-error";
import { AppFieldSlot } from "~/platform/ui/AppField";
import { AppSegmentedControl } from "~/platform/ui/AppSegmentedControl";
import { AppSelect } from "~/platform/ui/AppSelect";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";
import { HelpTooltip } from "~/platform/ui/HelpTooltip";

type WizardState = ReturnType<typeof useGenerationWizard>;

export interface IntentWizardProps {
  readonly wizard: WizardState;
  readonly featuredIntents: readonly GenerationIntentCatalogItemView[];
  readonly moreIntents: readonly GenerationIntentCatalogItemView[];
  readonly status: GenerationIntentsStatus;
  readonly catalogError: unknown;
  readonly onRetry: () => void;
}

const intentIcons: Record<string, (props: { readonly className?: string }) => ReactNode> = {
  "share-idea": (props) => <IconPin size={22} className={props.className} />,
  "explain-deeply": (props) => <IconMap size={22} className={props.className} />,
  "engage-audience": (props) => <IconRoute size={22} className={props.className} />,
  "tell-story": (props) => <IconScroll size={22} className={props.className} />,
  "update-subscribers": (props) => <IconLetter size={22} className={props.className} />,
  "document-decision": (props) => <IconPen size={22} className={props.className} />
};

function IntentExpeditionCard({
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
  const { locale } = useAppLocale();
  const Icon = intentIcons[item.id];
  const label = getIntentLabel(locale, item.id, item.label);
  const description = getIntentDescription(locale, item.id, item.description);

  return (
    <ExpeditionCard selected={selected} onClick={onSelect} className="group h-full w-full p-5">
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          {Icon ? (
            <span
              className={cn(
                "inline-flex text-deep-blue/70 transition-colors duration-[250ms] motion-reduce:transition-none",
                selected && "text-terracotta"
              )}
              aria-hidden="true"
            >
              <Icon className="text-current" />
            </span>
          ) : (
            <span />
          )}
          {description ? (
            <HelpTooltip
              text={description}
              ariaLabel={helpLabel}
              placement="responsive-end"
              size="wide"
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <Text
            as="span"
            variant="label"
            className={cn(
              "block transition-colors duration-[250ms] motion-reduce:transition-none",
              selected ? "text-terracotta" : "text-deep-blue"
            )}
          >
            {label}
          </Text>
          {description ? (
            <Text as="span" variant="meta" className="block leading-relaxed text-ink-muted">
              {description}
            </Text>
          ) : null}
        </div>
      </div>
    </ExpeditionCard>
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
      <LogbookProse className="border-red-700/30 bg-red-700/5">
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
      </LogbookProse>
    );
  }

  if (wizard.step === 1) {
    return (
      <div className="space-y-6">
        <WizardRouteProgress current={1} messages={messages} />

        <div>
          <Text as="h2" variant="h2" className="mb-2 font-playfair text-deep-blue">
            {messages.intentWizard.stepObjectiveTitle}
          </Text>
          <Text variant="body" className="text-ink-muted">
            {messages.intentWizard.stepObjectiveSubtitle}
          </Text>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allIntents.map((item) => (
            <IntentExpeditionCard
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
        <WizardRouteProgress current={2} messages={messages} />

        <div>
          <Text as="h2" variant="h2" className="mb-2 font-playfair text-deep-blue">
            {messages.intentWizard.stepScopeTitle}
          </Text>
          <Text variant="body" className="text-ink-muted">
            {messages.intentWizard.stepScopeSubtitle}
          </Text>
        </div>

        {wizard.selectedIntent ? (
          <LogbookProse className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Text variant="meta" className="mb-1 block ui-type-mono text-ink-muted">
                  {messages.intentWizard.stepExplorar}
                </Text>
                <Text variant="label">
                  {getIntentLabel(locale, wizard.selectedIntent.id, wizard.selectedIntent.label)}
                </Text>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-terracotta underline-offset-2 hover:underline"
                onClick={wizard.changeIntent}
              >
                {messages.intentWizard.changeIntent}
              </button>
            </div>
          </LogbookProse>
        ) : null}

        <LogbookProse className="space-y-4 p-5">
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
        </LogbookProse>

        <LogbookProse className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Text variant="label">{messages.intentWizard.channel}</Text>
            <Text variant="meta" className="ui-type-mono text-ink-muted">
              {messages.intentWizard.channelOptional}
            </Text>
          </div>
          {channelExpanded ? (
            <AppSelect
              value={activeChannel}
              onChange={(value) => wizard.setChannel(value as GenerationChannel)}
              sortAlphabetically={false}
              options={GENERATION_CHANNEL_IDS.map((channel) => ({
                value: channel,
                label: getChannelLabel(locale, channel, channel)
              }))}
            />
          ) : (
            <button
              type="button"
              className="text-sm font-medium text-terracotta underline-offset-2 hover:underline"
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
        </LogbookProse>

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
