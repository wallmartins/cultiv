import { Text } from "@my-ai-orchestrator/ui";
import { VoiceConfidenceDial } from "~/app/voice/components/VoiceConfidenceDial";
import type { VoiceConfidenceLevel } from "~/app/voice/components/VoiceConfidenceRing";

export interface VoiceMirrorHeroProps {
  readonly level: VoiceConfidenceLevel;
  readonly dialSubline: string;
  readonly dialAccessibleLabel: string;
  readonly bodyCopy: string;
}

export function VoiceMirrorHero({
  level,
  dialSubline,
  dialAccessibleLabel,
  bodyCopy
}: VoiceMirrorHeroProps) {
  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-10 lg:gap-14">
      <Text variant="body-lg" className="min-w-0 flex-1 w-full whitespace-pre-wrap leading-relaxed text-foreground">
        {bodyCopy}
      </Text>
      <div className="shrink-0 pr-3 sm:pr-6">
        <VoiceConfidenceDial
          level={level}
          centerLabel={dialSubline}
          accessibleLabel={dialAccessibleLabel}
        />
      </div>
    </div>
  );
}
