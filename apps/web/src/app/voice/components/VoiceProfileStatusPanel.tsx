import { Text } from "@my-ai-orchestrator/ui";
import {
  VoiceConfidenceRing,
  type VoiceConfidenceLevel
} from "~/app/voice/components/VoiceConfidenceRing";

export interface VoiceProfileStatusPanelProps {
  readonly level: VoiceConfidenceLevel;
  readonly confidenceLabel: string;
  readonly panelTitle: string;
  readonly contextCopy: string;
  readonly adaptationLine: string;
}

export function VoiceProfileStatusPanel({
  level,
  confidenceLabel,
  panelTitle,
  contextCopy,
  adaptationLine
}: VoiceProfileStatusPanelProps) {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1">
        <Text variant="label" className="mb-2 block">
          {panelTitle}
        </Text>
        <Text variant="body-lg" className="w-full leading-relaxed text-foreground">
          {contextCopy}
        </Text>
        <Text variant="meta" className="mt-2 w-full text-muted-foreground">
          {adaptationLine}
        </Text>
      </div>
      <VoiceConfidenceRing
        size="panel"
        level={level}
        label={contextCopy}
        centerLabel={confidenceLabel}
      />
    </div>
  );
}
