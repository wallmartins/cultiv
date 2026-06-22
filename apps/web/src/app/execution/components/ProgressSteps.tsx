import type { JobProgress } from "@my-ai-orchestrator/contracts";
import { Text } from "@my-ai-orchestrator/ui";
import type { AppLocale } from "~/i18n/app/types";
import type { AppMessages } from "~/i18n/app/types";
import { getExecutionStepPresentation } from "~/app/execution/lib/execution-step-messages";

export interface ProgressStepsProps {
  readonly progress: JobProgress;
  readonly locale: AppLocale;
  readonly messages: AppMessages;
}

export function ProgressSteps({ progress, locale, messages }: ProgressStepsProps) {
  const step = getExecutionStepPresentation(locale, progress.currentStep, messages);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Text variant="label" className="text-ink">
          {step.label}
        </Text>
        <Text variant="meta" className="text-ink-muted">
          {step.summary}
        </Text>
        <Text variant="meta" className="text-ink-muted">
          {messages.history.detail.progressSteps} {progress.stepIndex + 1}/{progress.totalSteps} ·{" "}
          {progress.percent}%
        </Text>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-paper-pressed">
        <div
          className="h-full bg-pigment-terracotta transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={step.label}
        />
      </div>
    </div>
  );
}
