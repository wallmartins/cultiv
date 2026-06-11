import { useState } from "react";
import { Text, cn } from "@my-ai-orchestrator/ui";
import type { ShowcaseSample } from "~/content/showcase/types";
import { StampBadge } from "~/visual/typography/StampBadge";
import { ShowcaseOutputColumn } from "./ShowcaseOutputColumn";
import { ShowcaseSampleDetailModal } from "./ShowcaseSampleDetailModal";
import { ShowcaseSampleOutput } from "./ShowcaseSampleOutput";

export interface ShowcaseSlideProps {
  readonly sample: ShowcaseSample;
  readonly genericLabel: string;
  readonly voiceLabel: string;
  readonly stampLabel: string;
  readonly stampValue: string;
  readonly slideLabel: string;
  readonly viewFullSampleLabel: string;
  readonly closeModalLabel: string;
  readonly threadMorePostsLabel: string;
  readonly proseMoreBlocksLabel: string;
  readonly linkedInAuthorName: string;
  readonly linkedInAuthorMeta: string;
  readonly layout?: "stacked" | "pinned";
}

export function ShowcaseSlide({
  sample,
  genericLabel,
  voiceLabel,
  stampLabel,
  stampValue,
  slideLabel,
  viewFullSampleLabel,
  closeModalLabel,
  threadMorePostsLabel,
  proseMoreBlocksLabel,
  linkedInAuthorName,
  linkedInAuthorMeta,
  layout = "pinned"
}: ShowcaseSlideProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isThread = sample.id === "thread";
  const moreBlocksLabel = isThread ? threadMorePostsLabel : proseMoreBlocksLabel;
  const isStacked = layout === "stacked";

  return (
    <>
      <article
        className={cn(
          "flex w-full flex-col",
          isStacked
            ? "border-b border-showcase-foreground/20 py-10 last:border-b-0 md:py-12"
            : "h-full min-h-0 w-screen max-w-full shrink-0 px-[var(--spacing-gutter)] py-8 md:px-12 md:py-10"
        )}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:gap-8">
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-6">
            <div className="space-y-4">
              <Text as="p" variant="meta" className="text-showcase-accent">
                {slideLabel}
              </Text>
              <Text as="h3" variant="display-sm" className="max-w-3xl text-showcase-foreground">
                {sample.contentTypeLabel}
              </Text>
              <Text as="p" variant="body-lg" className="line-clamp-3 max-w-2xl text-showcase-muted">
                {sample.briefing}
              </Text>
            </div>
            <StampBadge label={stampLabel} value={stampValue} invert />
          </div>

          <div className="grid gap-0 border border-showcase-foreground/25 md:grid-cols-2">
            <ShowcaseOutputColumn label={genericLabel} labelClassName="text-showcase-muted">
              <ShowcaseSampleOutput
                sampleId={sample.id}
                posts={sample.genericPosts}
                document={sample.genericDocument}
                muted
                truncate
                moreBlocksLabel={moreBlocksLabel}
                linkedInAuthorName={linkedInAuthorName}
                linkedInAuthorMeta={linkedInAuthorMeta}
              />
            </ShowcaseOutputColumn>
            <ShowcaseOutputColumn
              label={voiceLabel}
              labelClassName="text-showcase-accent"
              invert
            >
              <ShowcaseSampleOutput
                sampleId={sample.id}
                posts={sample.voicePosts}
                document={sample.voiceDocument}
                truncate
                moreBlocksLabel={moreBlocksLabel}
                linkedInAuthorName={linkedInAuthorName}
                linkedInAuthorMeta={linkedInAuthorMeta}
              />
            </ShowcaseOutputColumn>
          </div>

          <div className={cn("flex shrink-0", isStacked ? "justify-stretch sm:justify-end" : "justify-end")}>
            <button
              type="button"
              className={cn(
                "border border-showcase-foreground/25 px-4 py-2.5 text-sm text-showcase-muted transition-colors hover:border-showcase-accent/50 hover:text-showcase-foreground",
                isStacked && "w-full sm:w-auto"
              )}
              onClick={() => setModalOpen(true)}
            >
              {viewFullSampleLabel}
            </button>
          </div>
        </div>
      </article>

      <ShowcaseSampleDetailModal
        sample={sample}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        genericLabel={genericLabel}
        voiceLabel={voiceLabel}
        closeLabel={closeModalLabel}
        linkedInAuthorName={linkedInAuthorName}
        linkedInAuthorMeta={linkedInAuthorMeta}
        threadMorePostsLabel={threadMorePostsLabel}
        proseMoreBlocksLabel={proseMoreBlocksLabel}
      />
    </>
  );
}
