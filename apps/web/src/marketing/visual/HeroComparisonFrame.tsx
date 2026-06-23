import { useState } from "react";
import { cn } from "@my-ai-orchestrator/ui";
import type { LocaleMessages } from "~/i18n/marketing/types";

type HeroMessages = LocaleMessages["hero"];

export interface HeroComparisonFrameProps {
  readonly messages: HeroMessages;
}

type PanelKey = "generic" | "voice";

export function HeroComparisonFrame({ messages }: HeroComparisonFrameProps) {
  const [activePanel, setActivePanel] = useState<PanelKey>("voice");

  return (
    <div className="w-full max-w-xl lg:max-w-none">
      <div
        className={cn(
          "relative rounded-[5px] border-double-cartography bg-off-white p-4 shadow-cartography md:p-5",
          "before:pointer-events-none before:absolute before:left-0 before:top-0 before:h-3 before:w-3",
          "before:rounded-br-[3px] before:bg-cream",
          "after:pointer-events-none after:absolute after:bottom-0 after:right-0 after:h-3 after:w-3",
          "after:rounded-tl-[3px] after:bg-cream"
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-dotted-cartography pb-3">
          <span className="ui-type-mono text-[0.6875rem] uppercase tracking-widest text-ink-muted">
            {messages.comparisonLabel}
          </span>

          <div className="flex gap-1 md:hidden" role="tablist" aria-label={messages.comparisonLabel}>
            <button
              type="button"
              role="tab"
              id="hero-generic-tab"
              aria-selected={activePanel === "generic"}
              onClick={() => setActivePanel("generic")}
              className={cn(
                "ui-type-mono rounded-[3px] px-2.5 py-1 text-[0.625rem] uppercase tracking-widest transition-colors",
                activePanel === "generic"
                  ? "bg-deep-blue text-off-white"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              {messages.genericLabel}
            </button>
            <button
              type="button"
              role="tab"
              id="hero-voice-tab"
              aria-selected={activePanel === "voice"}
              onClick={() => setActivePanel("voice")}
              className={cn(
                "ui-type-mono rounded-[3px] px-2.5 py-1 text-[0.625rem] uppercase tracking-widest transition-colors",
                activePanel === "voice"
                  ? "bg-terracotta text-off-white"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              {messages.voiceLabel}
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          <ComparisonPanel
            kind="generic"
            label={messages.genericLabel}
            line1={messages.genericLine1}
            line2={messages.genericLine2}
            mobileActive={activePanel === "generic"}
            className="md:block"
          />
          <ComparisonPanel
            kind="voice"
            label={messages.voiceLabel}
            line1={messages.voiceLine1}
            line2={messages.voiceLine2}
            mobileActive={activePanel === "voice"}
            className="md:block"
          />
        </div>
      </div>
    </div>
  );
}

function ComparisonPanel({
  kind,
  label,
  line1,
  line2,
  mobileActive,
  className,
}: {
  readonly kind: PanelKey;
  readonly label: string;
  readonly line1: string;
  readonly line2: string;
  readonly mobileActive: boolean;
  readonly className?: string;
}) {
  const isVoice = kind === "voice";

  return (
    <div
      role="tabpanel"
      aria-labelledby={isVoice ? "hero-voice-tab" : "hero-generic-tab"}
      className={cn(
        "rounded-[5px] border-dotted-cartography p-4",
        isVoice ? "bg-cream" : "bg-off-white",
        !mobileActive && "hidden md:block",
        className
      )}
    >
      <span
        className={cn(
          "mb-2 block ui-type-mono text-[0.625rem] uppercase tracking-widest",
          isVoice ? "text-terracotta" : "text-ink-muted"
        )}
      >
        {label}
      </span>
      <p
        className={cn(
          "text-sm leading-relaxed",
          isVoice ? "ui-type-logbook text-ink" : "font-inter text-ink-muted/80"
        )}
      >
        {line1}
        <br />
        {line2}
      </p>
    </div>
  );
}
