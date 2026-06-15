import { useState } from "react";
import { cn } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import {
  VOICE_ROOT_NODE_POSITIONS,
  VOICE_ROOT_OUTPUT_ANCHOR,
  VOICE_ROOT_VIEWBOX,
  VoiceRootSystemArt
} from "~/marketing/visual/illustrations/VoiceRootSystemArt";

export interface VoiceRootTimelineStep {
  readonly index: string;
  readonly title: string;
  readonly body: string;
}

export interface VoiceRootTimelineProps {
  readonly outputLabel: string;
  readonly steps: readonly VoiceRootTimelineStep[];
  readonly className?: string;
}

function toPercentX(x: number) {
  return `${(x / VOICE_ROOT_VIEWBOX.width) * 100}%`;
}

function toPercentY(y: number) {
  return `${(y / VOICE_ROOT_VIEWBOX.height) * 100}%`;
}

export function VoiceRootTimeline({ outputLabel, steps, className }: VoiceRootTimelineProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const revealRef = useSectionReveal<HTMLDivElement>("[data-root-reveal]");

  return (
    <div
      ref={revealRef}
      className={cn("voice-root-timeline relative mx-auto w-full max-w-[88rem]", className)}
    >
      <div className="voice-root-timeline__stage relative mx-auto w-full max-w-[min(100%,88rem,80svh)]">
        <div data-root-reveal>
          <VoiceRootSystemArt className="h-auto w-full text-moss" />
        </div>

        <div
          className="pointer-events-none absolute z-[1]"
          style={{
            left: toPercentX(VOICE_ROOT_OUTPUT_ANCHOR.x),
            top: toPercentY(VOICE_ROOT_OUTPUT_ANCHOR.y),
            translate: "-50% -120%"
          }}
        >
          <span className="voice-root-timeline__output-pill voice-root-timeline__output-pill--crown">
            {outputLabel}
          </span>
        </div>

        {steps.map((step, index) => {
          const node = VOICE_ROOT_NODE_POSITIONS[index];
          if (!node) {
            return null;
          }

          const isActive = activeIndex === index;
          const isLeft = node.side === "left";

          return (
            <button
              key={step.index}
              type="button"
              className={cn(
                "voice-root-timeline__trigger",
                isActive && "is-active"
              )}
              style={{
                left: toPercentX(node.x),
                top: toPercentY(node.y),
                animationDelay: `${index * 0.35}s`
              }}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(isActive ? null : index)}
              aria-expanded={isActive}
              aria-label={`${step.index} ${step.title}`}
            >
              <span className="voice-root-timeline__pulse-dot" aria-hidden />

              <div
                role="tooltip"
                className={cn(
                  "voice-root-timeline__popover",
                  isLeft ? "voice-root-timeline__popover--left" : "voice-root-timeline__popover--right",
                  isActive && "is-visible"
                )}
              >
                <p className="voice-root-timeline__popover-heading">
                  <span className="voice-root-timeline__popover-index">{step.index}</span>
                  <span className="voice-root-timeline__popover-separator">-</span>
                  <span>{step.title}</span>
                </p>
                <p className="voice-root-timeline__popover-body">{step.body}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
