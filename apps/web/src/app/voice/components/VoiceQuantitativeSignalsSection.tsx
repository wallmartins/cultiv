import { Button, CoordinateLabel, LogbookProse, Text } from "@my-ai-orchestrator/ui";
import type { QuantitativeSignals } from "@my-ai-orchestrator/contracts";
import { VoiceConsistencyBreakdown } from "~/app/voice/components/VoiceConsistencyBreakdown";
import type { AppVoiceCalibrationDashboardMessages } from "~/i18n/app/types";

export interface VoiceQuantitativeSignalsSectionProps {
  readonly signals: QuantitativeSignals;
  readonly messages: AppVoiceCalibrationDashboardMessages;
  readonly stepLabels: Readonly<Record<string, string>>;
  readonly stepVariances?: readonly { readonly stepId: string; readonly variance: number }[];
  readonly onRedoStep?: (stepId: string) => void;
  readonly onBonusTopicStep?: () => void;
}

function formatScore(score: number): string {
  return score.toFixed(2);
}

function scoreLabel(score: number, messages: AppVoiceCalibrationDashboardMessages): string {
  if (score >= 0.7) {
    return messages.scoreGood;
  }

  if (score >= 0.5) {
    return messages.scoreFair;
  }

  return messages.scoreLow;
}

export function VoiceQuantitativeSignalsSection({
  signals,
  messages,
  stepLabels,
  stepVariances = [],
  onRedoStep,
  onBonusTopicStep
}: VoiceQuantitativeSignalsSectionProps) {
  const highestVarianceStep =
    stepVariances.length > 0
      ? stepVariances.reduce((max, step) => (step.variance > max.variance ? step : max))
      : undefined;

  return (
    <LogbookProse className="space-y-5 p-5">
      <div>
        <Text as="h2" variant="h2" className="mb-1 font-playfair text-ink">
          {messages.title}
        </Text>
        <Text variant="meta" className="text-ink-muted">
          {messages.subtitle}
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label={messages.consistency}
          value={formatScore(signals.consistencyScore)}
          hint={scoreLabel(signals.consistencyScore, messages)}
        />
        <MetricCard
          label={messages.topicIndependence}
          value={formatScore(signals.topicIndependenceScore)}
          hint={scoreLabel(signals.topicIndependenceScore, messages)}
        />
        <MetricCard
          label={messages.crossLength}
          value={formatScore(signals.crossLengthConsistency)}
          hint={scoreLabel(signals.crossLengthConsistency, messages)}
        />
      </div>

      {stepVariances.length > 0 ? (
        <div className="space-y-3">
          <CoordinateLabel index={1} label={messages.perStepTitle} className="block" />
          <VoiceConsistencyBreakdown
            steps={stepVariances.map((item) => ({
              stepId: item.stepId,
              label: stepLabels[item.stepId] ?? item.stepId,
              variance: item.variance,
              highlighted: highestVarianceStep?.stepId === item.stepId
            }))}
            varianceLabel={messages.varianceLabel}
          />
          {highestVarianceStep && onRedoStep ? (
            <div className="space-y-2 rounded-[5px] border border-dotted-cartography bg-cream px-4 py-3">
              <Text variant="meta" className="text-ink-muted">
                {messages.highestVarianceHint}
              </Text>
              <Button type="button" variant="secondary" onClick={() => onRedoStep(highestVarianceStep.stepId)}>
                {messages.redoStep}: {stepLabels[highestVarianceStep.stepId] ?? highestVarianceStep.stepId}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {signals.topicIndependenceScore < 0.6 && onBonusTopicStep ? (
        <div className="space-y-2 rounded-[5px] border border-dotted-cartography bg-off-white px-4 py-3">
          <Text as="h3" variant="h3" className="font-playfair text-ink">
            {messages.bonusTopicTitle}
          </Text>
          <Text variant="meta" className="text-ink-muted">
            {messages.bonusTopicBody}
          </Text>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={onBonusTopicStep}>
              {messages.bonusTopicAction}
            </Button>
            <Button type="button" variant="ghost">
              {messages.keepAsIs}
            </Button>
          </div>
        </div>
      ) : null}
    </LogbookProse>
  );
}

function MetricCard({
  label,
  value,
  hint
}: {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}) {
  return (
    <div className="rounded-[5px] border border-dotted-cartography bg-cream px-4 py-3">
      <CoordinateLabel index={0} label={label} className="mb-2 block" />
      <Text variant="body-lg" className="font-mono text-ink">
        {value}
      </Text>
      <Text variant="meta" className="text-ink-muted">
        {hint}
      </Text>
    </div>
  );
}
