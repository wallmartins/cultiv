import { Text, cn } from "@my-ai-orchestrator/ui";
import type { ShowcaseSample } from "~/content/showcase/types";
import { StampBadge } from "~/visual/typography/StampBadge";
import { ShowcaseVariantPanel } from "./ShowcaseVariantPanel";

export interface ShowcaseSlideProps {
  readonly sample: ShowcaseSample;
  readonly genericLabel: string;
  readonly voiceLabel: string;
  readonly stampLabel: string;
  readonly stampValue: string;
  readonly slideLabel: string;
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
  threadMorePostsLabel,
  proseMoreBlocksLabel,
  linkedInAuthorName,
  linkedInAuthorMeta,
  layout = "pinned"
}: ShowcaseSlideProps) {
  const isStacked = layout === "stacked";

  return (
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

        <ShowcaseVariantPanel
          sample={sample}
          showcase={{
            genericLabel,
            voiceLabel,
            threadMorePosts: threadMorePostsLabel,
            proseMoreBlocks: proseMoreBlocksLabel,
            linkedInAuthorName,
            linkedInAuthorMeta
          }}
        />
      </div>
    </article>
  );
}
