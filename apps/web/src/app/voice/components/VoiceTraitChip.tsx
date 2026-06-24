import { Text } from "@my-ai-orchestrator/ui";

export interface VoiceTraitChipProps {
  readonly label: string;
  readonly value: string;
  readonly id?: string;
}

export function VoiceTraitChip({ label, value, id }: VoiceTraitChipProps) {
  return (
    <div id={id} className="rounded-[var(--radius-cartography)] bg-pigment-terracotta/10 px-3 py-2.5">
      <Text variant="meta" className="mb-0.5 block text-xs text-ink-muted">
        {label}
      </Text>
      <Text variant="body" className="text-sm font-medium text-ink">
        {value}
      </Text>
    </div>
  );
}
