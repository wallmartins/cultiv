import { useEffect, useState, type WheelEvent } from "react";
import { createPortal } from "react-dom";
import { Text } from "@my-ai-orchestrator/ui";
import { useLenisInstance } from "~/animations/lenis-context";
import type { ShowcaseSample } from "~/content/showcase/types";
import { ShowcaseSampleOutput } from "./ShowcaseSampleOutput";

type SampleVariant = "generic" | "voice";

export interface ShowcaseSampleDetailModalProps {
  readonly sample: ShowcaseSample;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly genericLabel: string;
  readonly voiceLabel: string;
  readonly closeLabel: string;
  readonly threadMorePostsLabel: string;
  readonly proseMoreBlocksLabel: string;
  readonly linkedInAuthorName: string;
  readonly linkedInAuthorMeta: string;
}

function stopWheelPropagation(event: WheelEvent<HTMLElement>) {
  event.stopPropagation();
}

export function ShowcaseSampleDetailModal({
  sample,
  open,
  onClose,
  genericLabel,
  voiceLabel,
  closeLabel,
  threadMorePostsLabel,
  proseMoreBlocksLabel,
  linkedInAuthorName,
  linkedInAuthorMeta
}: ShowcaseSampleDetailModalProps) {
  const lenis = useLenisInstance();
  const [mounted, setMounted] = useState(false);
  const [variant, setVariant] = useState<SampleVariant>("generic");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    lenis?.stop();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      lenis?.start();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, lenis]);

  if (!open || !mounted) {
    return null;
  }

  const isMuted = variant === "generic";
  const titleId = `showcase-sample-modal-${sample.id}`;
  const moreBlocksLabel = sample.id === "thread" ? threadMorePostsLabel : proseMoreBlocksLabel;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onWheel={stopWheelPropagation}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(90vh,48rem)] w-[min(92vw,42rem)] flex-col border border-showcase-foreground/25 bg-showcase text-showcase-foreground shadow-xl"
        onWheel={stopWheelPropagation}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-showcase-foreground/25 p-5 md:p-6">
          <div className="space-y-1">
            <Text as="p" variant="meta" className="text-showcase-accent">
              {sample.index}
            </Text>
            <Text as="h4" id={titleId} variant="display-sm" className="text-showcase-foreground">
              {sample.contentTypeLabel}
            </Text>
          </div>
          <button
            type="button"
            className="shrink-0 border border-showcase-foreground/25 px-3 py-1.5 text-sm text-showcase-muted transition-colors hover:text-showcase-foreground"
            onClick={onClose}
          >
            {closeLabel}
          </button>
        </div>

        <div className="flex shrink-0 gap-2 border-b border-showcase-foreground/25 p-4 md:px-6">
          <button
            type="button"
            aria-pressed={variant === "generic"}
            className={`flex-1 border px-3 py-2 text-left text-sm transition-colors ${
              variant === "generic"
                ? "border-showcase-foreground/40 bg-showcase-foreground/10 text-showcase-foreground"
                : "border-showcase-foreground/15 text-showcase-muted hover:text-showcase-foreground"
            }`}
            onClick={() => setVariant("generic")}
          >
            {genericLabel}
          </button>
          <button
            type="button"
            aria-pressed={variant === "voice"}
            className={`flex-1 border px-3 py-2 text-left text-sm transition-colors ${
              variant === "voice"
                ? "border-showcase-accent/60 bg-showcase-accent/10 text-showcase-foreground"
                : "border-showcase-foreground/15 text-showcase-muted hover:text-showcase-foreground"
            }`}
            onClick={() => setVariant("voice")}
          >
            {voiceLabel}
          </button>
        </div>

        <div
          className="showcase-output-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 md:p-6"
          onWheel={stopWheelPropagation}
        >
          <ShowcaseSampleOutput
            sampleId={sample.id}
            posts={variant === "generic" ? sample.genericPosts : sample.voicePosts}
            document={variant === "generic" ? sample.genericDocument : sample.voiceDocument}
            muted={isMuted}
            truncate={false}
            moreBlocksLabel={moreBlocksLabel}
            linkedInAuthorName={linkedInAuthorName}
            linkedInAuthorMeta={linkedInAuthorMeta}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
