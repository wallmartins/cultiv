import { ReadingSurface } from "../primitives/ReadingSurface.js";
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
    <article className="border-t border-ink-ghost">
      <div className="flex flex-col gap-4 py-6 md:flex-row md:items-end md:justify-between md:py-8">
        <div className="space-y-3">
          <Text as="p" variant="meta" className="text-ink">
            [{index}]
          </Text>
          <Text as="h3" variant="display-sm" className="max-w-2xl text-ink">
            {contentTypeLabel}
          </Text>
        </div>
      </div>

      <Text as="p" variant="body-lg" className="max-w-3xl pb-8 text-ink-muted">
        {briefing}
      </Text>

      <div className="grid border-t border-ink-ghost md:grid-cols-2">
        <ReadingSurface className="space-y-4 border-b border-ink-ghost md:border-r md:border-b-0">
          <Text as="p" variant="caption">
            {genericLabel}
          </Text>
          <Text as="p" variant="reading" className="text-ink-muted">
            {genericOutput}
          </Text>
        </ReadingSurface>
        <ReadingSurface className="space-y-4 bg-paper-elevated">
          <Text as="p" variant="caption">
            {voiceLabel}
          </Text>
          <Text as="p" variant="reading">
            {voiceOutput}
          </Text>
        </ReadingSurface>
      </div>
    </article>
  );
}
