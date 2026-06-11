import { SHOWCASE_CONTENT_PREVIEW_BLOCK_COUNT } from "~/content/showcase/format-thread";
import { sliceDocumentForPreview } from "~/content/showcase/format-prose-document";
import type { ShowcasePostDocument, ShowcaseSample } from "~/content/showcase/types";
import { ShowcaseBlogPostPreview } from "./ShowcaseBlogPostPreview";
import { ShowcaseLinkedInPostPreview } from "./ShowcaseLinkedInPostPreview";
import { ShowcaseThreadPosts } from "./ShowcaseThreadPosts";

export interface ShowcaseSampleOutputProps {
  readonly sampleId: ShowcaseSample["id"];
  readonly posts?: readonly string[];
  readonly document?: ShowcasePostDocument;
  readonly muted?: boolean;
  readonly truncate?: boolean;
  readonly moreBlocksLabel?: string;
  readonly linkedInAuthorName?: string;
  readonly linkedInAuthorMeta?: string;
}

function formatMoreBlocksLabel(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function ShowcaseSampleOutput({
  sampleId,
  posts,
  document,
  muted = false,
  truncate = true,
  moreBlocksLabel,
  linkedInAuthorName = "",
  linkedInAuthorMeta = ""
}: ShowcaseSampleOutputProps) {
  if (sampleId === "thread" && posts && posts.length > 0) {
    const hiddenCount =
      truncate && posts.length > SHOWCASE_CONTENT_PREVIEW_BLOCK_COUNT
        ? posts.length - SHOWCASE_CONTENT_PREVIEW_BLOCK_COUNT
        : 0;

    return (
      <ShowcaseThreadPosts
        posts={posts}
        muted={muted}
        numbered
        maxPosts={truncate ? SHOWCASE_CONTENT_PREVIEW_BLOCK_COUNT : undefined}
        lineClamp={truncate ? 3 : false}
        moreBlocksLabel={
          hiddenCount > 0 && moreBlocksLabel
            ? formatMoreBlocksLabel(moreBlocksLabel, hiddenCount)
            : undefined
        }
      />
    );
  }

  if (!document) {
    return null;
  }

  const previewDocument = truncate ? sliceDocumentForPreview(document) : document;
  const hiddenParagraphCount = truncate
    ? "hiddenParagraphCount" in previewDocument
      ? previewDocument.hiddenParagraphCount
      : 0
    : 0;
  const resolvedMoreLabel =
    hiddenParagraphCount > 0 && moreBlocksLabel
      ? formatMoreBlocksLabel(moreBlocksLabel, hiddenParagraphCount)
      : undefined;

  if (sampleId === "blog-post") {
    return (
      <ShowcaseBlogPostPreview
        document={previewDocument}
        muted={muted}
        truncateParagraphs={truncate}
        moreBlocksLabel={resolvedMoreLabel}
        hiddenParagraphCount={hiddenParagraphCount}
      />
    );
  }

  if (sampleId === "linkedin-post") {
    return (
      <ShowcaseLinkedInPostPreview
        document={previewDocument}
        authorName={linkedInAuthorName}
        authorMeta={linkedInAuthorMeta}
        muted={muted}
        truncateParagraphs={truncate}
        moreBlocksLabel={resolvedMoreLabel}
        hiddenParagraphCount={hiddenParagraphCount}
      />
    );
  }

  return null;
}
