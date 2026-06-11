import { Text } from "../primitives/Text.js";

export interface ComparisonCardProps {
  readonly index: string;
  readonly contentTypeLabel: string;
  readonly briefing: string;
  readonly genericOutput: string;
  readonly voiceOutput: string;
  readonly genericLabel: string;
  readonly voiceLabel: string;
}

export function ComparisonCard({
  index,
  contentTypeLabel,
  briefing,
  genericOutput,
  voiceOutput,
  genericLabel,
  voiceLabel
}: ComparisonCardProps) {
  return (
    <article className="editorial-rule">
      <div className="flex flex-col gap-4 py-6 md:flex-row md:items-end md:justify-between md:py-8">
        <div className="space-y-3">
          <Text as="p" variant="meta" className="text-foreground">
            [{index}]
          </Text>
          <Text as="h3" variant="display-sm" className="max-w-2xl">
            {contentTypeLabel}
          </Text>
        </div>
      </div>

      <Text as="p" variant="body-lg" className="max-w-3xl pb-8 text-muted">
        {briefing}
      </Text>

      <div className="grid border-t border-foreground md:grid-cols-2">
        <div className="space-y-4 border-b border-foreground p-6 md:border-r md:border-b-0 md:p-8">
          <Text as="p" variant="caption">
            {genericLabel}
          </Text>
          <Text as="p" variant="body" className="text-muted">
            {genericOutput}
          </Text>
        </div>
        <div className="space-y-4 bg-surface-elevated p-6 md:p-8">
          <Text as="p" variant="caption">
            {voiceLabel}
          </Text>
          <Text as="p" variant="body">
            {voiceOutput}
          </Text>
        </div>
      </div>
    </article>
  );
}
