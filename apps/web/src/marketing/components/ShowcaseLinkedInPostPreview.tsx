import { type WheelEvent } from "react";
import { Text } from "@my-ai-orchestrator/ui";
import type { ShowcasePostDocument } from "~/marketing/content/showcase/types";

export interface ShowcaseLinkedInPostPreviewProps {
  readonly document: ShowcasePostDocument;
  readonly authorName: string;
  readonly authorMeta: string;
  readonly muted?: boolean;
  readonly truncateParagraphs?: boolean;
  readonly scrollableBody?: boolean;
  readonly moreBlocksLabel?: string;
  readonly hiddenParagraphCount?: number;
}

function stopWheelPropagation(event: WheelEvent<HTMLElement>) {
  event.stopPropagation();
}

export function ShowcaseLinkedInPostPreview({
  document,
  authorName,
  authorMeta,
  muted = false,
  truncateParagraphs = true,
  scrollableBody = false,
  moreBlocksLabel,
  hiddenParagraphCount = 0
}: ShowcaseLinkedInPostPreviewProps) {
  const textClass = muted ? "text-showcase-muted" : "text-showcase-foreground";
  const paragraphClamp = truncateParagraphs ? "line-clamp-3" : "";
  const showMarkdownTitle = document.titleFromMarkdown;

  return (
    <article
      className={`flex min-h-0 flex-col border border-showcase-foreground/15 bg-showcase-foreground/[0.03] p-4 md:p-5 ${
        truncateParagraphs ? "md:min-h-[18rem]" : ""
      }`}
    >
      <header className="mb-4 flex shrink-0 items-center gap-3">
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

      <div
        className={
          scrollableBody
            ? "showcase-output-scroll min-h-0 max-h-[min(40rem,78vh)] space-y-2 overflow-y-auto overscroll-contain pr-1"
            : "space-y-2"
        }
        onWheel={scrollableBody ? stopWheelPropagation : undefined}
      >
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

        {hiddenParagraphCount > 0 && moreBlocksLabel ? (
          <Text as="p" variant="caption" className="text-showcase-muted">
            {moreBlocksLabel}
          </Text>
        ) : null}
      </div>
    </article>
  );
}
