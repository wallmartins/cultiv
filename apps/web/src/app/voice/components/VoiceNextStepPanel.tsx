import { Button, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import type { VoiceNextStepView } from "~/app/voice/lib/voice-dashboard-copy";

export interface VoiceNextStepPanelProps {
  readonly eyebrow: string;
  readonly step: VoiceNextStepView;
}

export function VoiceNextStepPanel({ eyebrow, step }: VoiceNextStepPanelProps) {
  const actionButton = (
    <Button type="button" disabled={step.disabled} className="w-full sm:w-auto">
      {step.cta}
    </Button>
  );

  return (
    <section
      className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
      aria-labelledby="voice-next-step-heading"
    >
      <div className="min-w-0 flex-1">
        <Text id="voice-next-step-heading" variant="label" className="mb-2 block">
          {eyebrow}
        </Text>
        <Text variant="body-lg" className="w-full leading-relaxed text-ink">
          {step.message}
        </Text>
      </div>
      <div className="w-full shrink-0 sm:w-auto">
        {step.disabled ? (
          actionButton
        ) : (
          <Link to={step.href} className="block w-full sm:w-auto">
            {actionButton}
          </Link>
        )}
      </div>
    </section>
  );
}
