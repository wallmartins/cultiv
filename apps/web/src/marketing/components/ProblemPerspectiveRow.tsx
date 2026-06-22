import { PaperSurface, Text } from "@my-ai-orchestrator/ui";

export interface ProblemPerspectiveRowProps {
  readonly index: string;
  readonly title: string;
  readonly body: string;
  readonly proofLabel: string;
  readonly proofLines: readonly string[];
  readonly reverse?: boolean;
}

export function ProblemPerspectiveRow({
  index,
  title,
  body,
  proofLabel,
  proofLines,
  reverse = false
}: ProblemPerspectiveRowProps) {
  return (
    <div
      data-section-item
      className="grid items-center gap-10 md:grid-cols-2 md:gap-16 lg:gap-20"
    >
      <PaperSurface className={reverse ? "md:order-2" : ""}>
        <div className="space-y-4 px-6 py-8">
          <Text as="p" variant="caption">
            {proofLabel}
          </Text>
          <div className="space-y-3 border-l border-ink-ghost pl-4">
            {proofLines.map((line) => (
              <Text key={line} as="p" variant="reading" className="text-ink-muted">
                {line}
              </Text>
            ))}
          </div>
        </div>
      </PaperSurface>
      <div className={reverse ? "md:order-1" : ""}>
        <Text as="p" variant="meta" className="mb-4 text-ink-muted">
          [{index}]
        </Text>
        <Text as="h3" variant="h3" className="mb-4 text-xl text-ink md:text-2xl">
          {title}
        </Text>
        <Text as="p" variant="body-lg" className="text-ink-muted">
          {body}
        </Text>
      </div>
    </div>
  );
}
