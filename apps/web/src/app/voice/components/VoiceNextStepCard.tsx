import { Button, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { AppCard } from "~/platform/ui/AppCard";
import type { VoiceNextStepView } from "~/app/voice/lib/voice-dashboard-copy";

export interface VoiceNextStepCardProps {
  readonly eyebrow: string;
  readonly step: VoiceNextStepView;
}

export function VoiceNextStepCard({ eyebrow, step }: VoiceNextStepCardProps) {
  return (
    <AppCard className="border-moss/25 bg-soft-loam/40">
      <Text variant="label" className="mb-2 block">
        {eyebrow}
      </Text>
      <Text variant="body-lg" className="mb-4 max-w-prose text-foreground">
        {step.message}
      </Text>
      {step.disabled ? (
        <Button type="button" disabled>
          {step.cta}
        </Button>
      ) : (
        <Link to={step.href}>
          <Button type="button">{step.cta}</Button>
        </Link>
      )}
    </AppCard>
  );
}
