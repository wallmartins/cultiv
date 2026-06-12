import { cn } from "@my-ai-orchestrator/ui";
import type { LocaleMessages } from "~/i18n/types";
import { BriefingFieldLabel, BriefingStatusStrip, BriefingWindowChrome } from "./briefing-scene-primitives";
import {
  PreviewDraftPanel,
  PreviewFormFooter,
  PreviewMatchCard,
  PreviewMetricCard
} from "./preview-scene-primitives";

export interface PreviewConfidenceSceneProps {
  readonly className?: string;
  readonly copy: LocaleMessages["scenes"]["previewConfidence"];
  readonly size?: "default" | "large";
}

export function PreviewConfidenceScene({ className, copy, size = "large" }: PreviewConfidenceSceneProps) {
  return (
    <svg
      viewBox="0 0 520 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "h-auto w-full text-foreground",
        size === "large" ? "max-w-[min(36rem,100%)]" : "max-w-[min(30rem,100%)]",
        className
      )}
      aria-hidden
    >
      <BriefingWindowChrome
        sceneId="preview"
        productLabel={copy.productLabel}
        breadcrumb={copy.breadcrumb}
        screenTitle={copy.screenTitle}
        stepIndicator={copy.stepIndicator}
      >
        <BriefingStatusStrip draftSaved={copy.readyStatus} progress={1} />
        <BriefingFieldLabel y={118} label={copy.label} />
        <text x="32" y="136" fontFamily="var(--font-body)" fontSize="12" fill="var(--color-muted)">
          {copy.formatRecap}
        </text>
        <PreviewMetricCard x={32} y={156} value={copy.creditsAmount} caption={copy.creditsCaption} accent="golden" />
        <PreviewMatchCard x={268} y={156} badge={copy.matchBadge} caption={copy.matchCaption} />
        <PreviewDraftPanel
          y={242}
          label={copy.draftLabel}
          lines={copy.draftLines}
          assurance={copy.toneAssurance}
        />
        <PreviewFormFooter
          footnote={copy.footnote}
          backAction={copy.backAction}
          confirmAction={copy.confirm}
        />
      </BriefingWindowChrome>
    </svg>
  );
}
