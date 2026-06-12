import { useState } from "react";
import { cn } from "@my-ai-orchestrator/ui";
import { ShowcaseSampleOutput } from "~/components/ShowcaseSampleOutput";
import type { ShowcaseSample } from "~/content/showcase/types";
import type { LocaleMessages } from "~/i18n/types";

type SampleVariant = "generic" | "voice";

export interface ShowcaseVariantPanelProps {
  readonly sample: ShowcaseSample;
  readonly showcase: Pick<
    LocaleMessages["showcase"],
    "genericLabel" | "voiceLabel" | "proseMoreBlocks" | "threadMorePosts" | "linkedInAuthorName" | "linkedInAuthorMeta"
  >;
  readonly className?: string;
}

export function ShowcaseVariantPanel({ sample, showcase, className }: ShowcaseVariantPanelProps) {
  const [variant, setVariant] = useState<SampleVariant>("generic");
  const isGeneric = variant === "generic";
  const moreBlocksLabel = sample.id === "thread" ? showcase.threadMorePosts : showcase.proseMoreBlocks;

  return (
    <div className={cn("border border-showcase-foreground/25", className)}>
      <div
        className="grid grid-cols-2 gap-0 border-b border-showcase-foreground/25"
        role="tablist"
        aria-label={showcase.genericLabel}
      >
        <button
          type="button"
          role="tab"
          id={`showcase-variant-${sample.id}-generic`}
          aria-selected={isGeneric}
          aria-controls={`showcase-variant-${sample.id}-panel`}
          className={cn(
            "px-4 py-3 text-left font-body text-[0.6875rem] font-semibold uppercase tracking-editorial transition-colors md:px-6 md:py-3.5",
            isGeneric
              ? "bg-showcase-foreground/10 text-showcase-foreground"
              : "text-showcase-muted hover:bg-showcase-foreground/5 hover:text-showcase-foreground"
          )}
          onClick={() => setVariant("generic")}
        >
          {showcase.genericLabel}
        </button>
        <button
          type="button"
          role="tab"
          id={`showcase-variant-${sample.id}-voice`}
          aria-selected={!isGeneric}
          aria-controls={`showcase-variant-${sample.id}-panel`}
          className={cn(
            "border-l border-showcase-foreground/25 px-4 py-3 text-left font-body text-[0.6875rem] font-semibold uppercase tracking-editorial transition-colors md:px-6 md:py-3.5",
            !isGeneric
              ? "bg-showcase-accent/10 text-showcase-foreground"
              : "text-showcase-muted hover:bg-showcase-foreground/5 hover:text-showcase-foreground"
          )}
          onClick={() => setVariant("voice")}
        >
          {showcase.voiceLabel}
        </button>
      </div>

      <div
        id={`showcase-variant-${sample.id}-panel`}
        role="tabpanel"
        aria-labelledby={
          isGeneric
            ? `showcase-variant-${sample.id}-generic`
            : `showcase-variant-${sample.id}-voice`
        }
        className="p-5 md:p-6"
      >
        <ShowcaseSampleOutput
          sampleId={sample.id}
          posts={isGeneric ? sample.genericPosts : sample.voicePosts}
          document={isGeneric ? sample.genericDocument : sample.voiceDocument}
          muted={isGeneric}
          truncate={false}
          scrollableBody
          moreBlocksLabel={moreBlocksLabel}
          linkedInAuthorName={showcase.linkedInAuthorName}
          linkedInAuthorMeta={showcase.linkedInAuthorMeta}
        />
      </div>
    </div>
  );
}
