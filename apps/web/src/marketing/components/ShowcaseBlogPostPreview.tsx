import { Text } from "@my-ai-orchestrator/ui";
import type { ShowcasePostDocument } from "~/marketing/content/showcase/types";

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
  const textClass = muted ? "text-ink-muted" : "text-paper";
  const paragraphClamp = truncateParagraphs ? "line-clamp-3" : "";

  return (
    <article className="min-h-0 space-y-4 border border-paper/15 bg-paper/[0.03] p-4 md:min-h-[18rem] md:p-5">
      <header className="space-y-2 border-b border-paper/10 pb-4">
        <Text
          as="h4"
          variant="display-sm"
          className={`line-clamp-2 ${muted ? "text-ink-muted" : "text-paper"}`}
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
        <Text as="p" variant="caption" className="text-ink-muted">
          {moreBlocksLabel}
        </Text>
      ) : null}
    </article>
  );
}
