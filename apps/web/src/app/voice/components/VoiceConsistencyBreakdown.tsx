import { Text } from "@my-ai-orchestrator/ui";

export interface VoiceConsistencyStep {
  readonly stepId: string;
  readonly label: string;
  readonly variance: number;
  readonly highlighted?: boolean;
}

export interface VoiceConsistencyBreakdownProps {
  readonly steps: readonly VoiceConsistencyStep[];
  readonly varianceLabel: string;
}

export function VoiceConsistencyBreakdown({ steps, varianceLabel }: VoiceConsistencyBreakdownProps) {
  const maxVariance = Math.max(...steps.map((step) => step.variance), 0.01);

  return (
    <div className="space-y-3" role="list" aria-label={varianceLabel}>
      {steps.map((step) => {
        const widthPercent = Math.round((step.variance / maxVariance) * 100);

        return (
          <div key={step.stepId} role="listitem" className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <Text variant="meta" className={step.highlighted ? "font-medium text-terracotta" : "text-ink"}>
                {step.label}
              </Text>
              <Text variant="meta" className="font-mono text-ink-muted">
                {step.variance.toFixed(2)}
              </Text>
            </div>
            <div className="h-2 overflow-hidden rounded-[4px] border border-dotted-cartography bg-off-white">
              <div
                className="h-full rounded-[3px] bg-ochre transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${widthPercent}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
