import { Text } from "@my-ai-orchestrator/ui";
import type { ShowcasePostDocument } from "~/content/showcase/types";

export interface ShowcaseLinkedInPostPreviewProps {
  readonly document: ShowcasePostDocument;
  readonly authorName: string;
  readonly authorMeta: string;
  readonly muted?: boolean;
  readonly truncateParagraphs?: boolean;
  readonly moreBlocksLabel?: string;
  readonly hiddenParagraphCount?: number;
}

export function ShowcaseLinkedInPostPreview({
  document,
  authorName,
  authorMeta,
  muted = false,
  truncateParagraphs = true,
  moreBlocksLabel,
  hiddenParagraphCount = 0
}: ShowcaseLinkedInPostPreviewProps) {
  const textClass = muted ? "text-showcase-muted" : "text-showcase-foreground";
  const paragraphClamp = truncateParagraphs ? "line-clamp-3" : "";
  const showMarkdownTitle = document.titleFromMarkdown;

  return (
    <article className="min-h-0 border border-showcase-foreground/15 bg-showcase-foreground/[0.03] p-4 md:min-h-[18rem] md:p-5">
      <header className="mb-4 flex items-center gap-3">
        <div
          className={`size-10 shrink-0 rounded-full border border-showcase-foreground/20 ${
            muted ? "bg-showcase-muted/20" : "bg-showcase-accent/25"
          }`}
          aria-hidden
        />
        <div className="min-w-0 space-y-0.5">
          <Text as="p" variant="body-lg" className={`truncate font-medium ${textClass}`}>
            {authorName}
          </Text>
          <Text as="p" variant="caption" className="text-showcase-muted">
            {authorMeta}
          </Text>
        </div>
      </header>

      <div className="space-y-2">
        {showMarkdownTitle ? (
          <Text as="p" variant="body-lg" className={`font-medium ${textClass}`}>
            {document.title}
          </Text>
        ) : null}
        {document.paragraphs.map((paragraph, index) => (
          <Text
            key={`${index + 1}-${paragraph.slice(0, 24)}`}
            as="p"
            variant="body-lg"
            className={`${paragraphClamp} overflow-hidden text-ellipsis whitespace-pre-line ${textClass}`}
          >
            {paragraph}
          </Text>
        ))}
      </div>

      {hiddenParagraphCount > 0 && moreBlocksLabel ? (
        <Text as="p" variant="caption" className="mt-3 text-showcase-muted">
          {moreBlocksLabel}
        </Text>
      ) : null}
    </article>
  );
}
