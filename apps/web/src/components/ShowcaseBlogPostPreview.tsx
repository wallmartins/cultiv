import { Text } from "@my-ai-orchestrator/ui";
import type { ShowcasePostDocument } from "~/content/showcase/types";

export interface ShowcaseBlogPostPreviewProps {
  readonly document: ShowcasePostDocument;
  readonly muted?: boolean;
  readonly truncateParagraphs?: boolean;
  readonly moreBlocksLabel?: string;
  readonly hiddenParagraphCount?: number;
}

export function ShowcaseBlogPostPreview({
  document,
  muted = false,
  truncateParagraphs = true,
  moreBlocksLabel,
  hiddenParagraphCount = 0
}: ShowcaseBlogPostPreviewProps) {
  const textClass = muted ? "text-showcase-muted" : "text-showcase-foreground";
  const paragraphClamp = truncateParagraphs ? "line-clamp-3" : "";

  return (
    <article className="min-h-0 space-y-4 border border-showcase-foreground/15 bg-showcase-foreground/[0.03] p-4 md:min-h-[18rem] md:p-5">
      <header className="space-y-2 border-b border-showcase-foreground/10 pb-4">
        <Text
          as="h4"
          variant="display-sm"
          className={`line-clamp-2 ${muted ? "text-showcase-muted" : "text-showcase-foreground"}`}
        >
          {document.title}
        </Text>
      </header>
      <div className="space-y-3">
        {document.paragraphs.map((paragraph, index) => (
          <Text
            key={`${index + 1}-${paragraph.slice(0, 24)}`}
            as="p"
            variant="body-lg"
            className={`${paragraphClamp} overflow-hidden text-ellipsis ${textClass}`}
          >
            {paragraph}
          </Text>
        ))}
      </div>
      {hiddenParagraphCount > 0 && moreBlocksLabel ? (
        <Text as="p" variant="caption" className="text-showcase-muted">
          {moreBlocksLabel}
        </Text>
      ) : null}
    </article>
  );
}
