import { Text } from "@my-ai-orchestrator/ui";

export interface VoiceTraitChipProps {
  readonly label: string;
  readonly value: string;
}

export function VoiceTraitChip({ label, value }: VoiceTraitChipProps) {
  return (
    <div className="rounded-[var(--workspace-radius-sm)] bg-moss/10 px-3 py-2.5">
      <Text variant="meta" className="mb-0.5 block text-xs text-muted">
        {label}
      </Text>
      <Text variant="body" className="text-sm font-medium text-foreground">
        {value}
      </Text>
    </div>
  );
}
