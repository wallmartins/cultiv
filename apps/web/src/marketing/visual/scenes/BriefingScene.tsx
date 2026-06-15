import { cn } from "@my-ai-orchestrator/ui";
import type { LocaleMessages } from "~/i18n/marketing/types";
import {
  BriefingChipGroup,
  BriefingFieldLabel,
  BriefingFormFooter,
  BriefingInputField,
  BriefingSelectField,
  BriefingStatusStrip,
  BriefingTextareaField,
  BriefingWindowChrome
} from "./briefing-scene-primitives";

export interface BriefingSceneProps {
  readonly className?: string;
  readonly copy: LocaleMessages["scenes"]["briefing"];
  readonly size?: "default" | "large";
}

function valueAfterColon(line: string) {
  const separatorIndex = line.indexOf(":");

  return separatorIndex >= 0 ? line.slice(separatorIndex + 1).trim() : line;
}

export function BriefingScene({ className, copy, size = "large" }: BriefingSceneProps) {
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
        sceneId="briefing"
        productLabel={copy.productLabel}
        breadcrumb={copy.breadcrumb}
        screenTitle={copy.screenTitle}
        stepIndicator={copy.stepIndicator}
      >
        <BriefingStatusStrip draftSaved={copy.draftSaved} progress={0.75} />
        <BriefingFieldLabel y={118} label={copy.formatTab} />
        <BriefingSelectField y={132} value={valueAfterColon(copy.format)} />
        <BriefingFieldLabel y={188} label={copy.objectiveTab} />
        <BriefingInputField y={202} value={valueAfterColon(copy.objective)} />
        <BriefingFieldLabel y={258} label={copy.audienceTab} />
        <BriefingChipGroup y={272} chips={copy.audienceChips} addLabel={copy.addAudienceLabel} />
        <BriefingFieldLabel y={318} label={copy.angleTab} />
        <BriefingTextareaField y={332} value={copy.placeholder} helper={copy.angleHelper} />
        <BriefingFormFooter voiceStatus={copy.voiceStatus} actionLabel={copy.previewAction} />
      </BriefingWindowChrome>
    </svg>
  );
}
