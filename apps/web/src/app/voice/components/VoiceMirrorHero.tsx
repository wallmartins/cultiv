import { CoordinateLabel, LogbookProse } from "@my-ai-orchestrator/ui";
import {
  VoiceConfidenceRing,
  type VoiceConfidenceLevel
} from "~/app/voice/components/VoiceConfidenceRing";

export interface VoiceMirrorHeroProps {
  readonly level: VoiceConfidenceLevel;
  readonly dialSubline: string;
  readonly dialAccessibleLabel: string;
  readonly bodyCopy: string;
  readonly healthLabel?: string;
}

export function VoiceMirrorHero({
  level,
  dialSubline,
  dialAccessibleLabel,
  bodyCopy,
  healthLabel
}: VoiceMirrorHeroProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10">
      <LogbookProse className="min-w-0 whitespace-pre-wrap p-5 leading-relaxed">
        {bodyCopy}
      </LogbookProse>

      <div className="flex flex-col items-center gap-3 lg:items-end">
        {healthLabel ? (
          <CoordinateLabel index={0} label={healthLabel} className="block text-center lg:text-right" />
        ) : null}
        <VoiceConfidenceRing
          level={level}
          label={dialAccessibleLabel}
          centerLabel={dialSubline}
          size="hero"
          hideLabel
        />
      </div>
    </div>
  );
}
