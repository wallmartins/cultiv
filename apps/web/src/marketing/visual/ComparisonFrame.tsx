import { useState } from "react";
import { cn, Text } from "@my-ai-orchestrator/ui";

type PanelKey = "generic" | "voice";

export type ComparisonFrameMessages = {
  readonly comparisonLabel: string;
  readonly genericLabel: string;
  readonly voiceLabel: string;
  readonly genericLine1: string;
  readonly genericLine2: string;
  readonly voiceLine1: string;
  readonly voiceLine2: string;
  readonly genericNote?: string;
  readonly voiceNote?: string;
};

export interface ComparisonFrameProps {
  readonly messages: ComparisonFrameMessages;
  readonly idPrefix?: string;
  readonly className?: string;
}

export function ComparisonFrame({
  messages,
  idPrefix = "comparison",
  className,
}: ComparisonFrameProps) {
  const [activePanel, setActivePanel] = useState<PanelKey>("voice");
  const genericTabId = `${idPrefix}-generic-tab`;
  const voiceTabId = `${idPrefix}-voice-tab`;

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-[5px] p-4 md:p-5",
          "bg-gradient-to-br from-off-white via-off-white to-cream/70",
          "shadow-[0_10px_36px_rgba(26,46,60,0.07)]",
          "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_18%_12%,rgba(196,164,132,0.14),transparent_58%)]",
          "after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_88%_92%,rgba(181,90,59,0.08),transparent_52%)]"
        )}
      >
        <div className="relative z-10 mb-4 flex items-center justify-between gap-3 border-b border-ink-ghost/15 pb-3">
          <span className="ui-type-mono text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">
            {messages.comparisonLabel}
          </span>

          <div
            className="flex gap-1 md:hidden"
            role="tablist"
            aria-label={messages.comparisonLabel}
          >
            <ComparisonTab
              id={genericTabId}
              label={messages.genericLabel}
              selected={activePanel === "generic"}
              onSelect={() => setActivePanel("generic")}
              variant="generic"
            />
            <ComparisonTab
              id={voiceTabId}
              label={messages.voiceLabel}
              selected={activePanel === "voice"}
              onSelect={() => setActivePanel("voice")}
              variant="voice"
            />
          </div>
        </div>

        <div className="relative z-10 grid gap-3 md:grid-cols-2 md:gap-4">
          <ComparisonPanel
            kind="generic"
            label={messages.genericLabel}
            line1={messages.genericLine1}
            line2={messages.genericLine2}
            note={messages.genericNote}
            mobileActive={activePanel === "generic"}
            tabId={genericTabId}
          />
          <ComparisonPanel
            kind="voice"
            label={messages.voiceLabel}
            line1={messages.voiceLine1}
            line2={messages.voiceLine2}
            note={messages.voiceNote}
            mobileActive={activePanel === "voice"}
            tabId={voiceTabId}
          />
        </div>
      </div>
    </div>
  );
}

function ComparisonTab({
  id,
  label,
  selected,
  onSelect,
  variant,
}: {
  readonly id: string;
  readonly label: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly variant: PanelKey;
}) {
  const isVoice = variant === "voice";

  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "ui-type-mono rounded-[3px] px-2.5 py-1 text-[0.625rem] uppercase tracking-widest transition-colors",
        selected
          ? isVoice
            ? "bg-terracotta text-off-white"
            : "bg-deep-blue text-off-white"
          : "text-ink-muted hover:text-ink"
      )}
    >
      {label}
    </button>
  );
}

function ComparisonPanel({
  kind,
  label,
  line1,
  line2,
  note,
  mobileActive,
  tabId,
}: {
  readonly kind: PanelKey;
  readonly label: string;
  readonly line1: string;
  readonly line2: string;
  readonly note?: string;
  readonly mobileActive: boolean;
  readonly tabId: string;
}) {
  const isVoice = kind === "voice";

  return (
    <div
      role="tabpanel"
      aria-labelledby={tabId}
      className={cn(
        "rounded-[5px] border-dotted-cartography p-4",
        isVoice ? "bg-cream/80" : "bg-off-white/70",
        !mobileActive && "hidden md:block"
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
      {note ? (
        <Text
          as="p"
          variant="margem"
          className={cn("mt-3", isVoice ? "text-terracotta" : "text-ink-muted")}
        >
          {note}
        </Text>
      ) : null}
    </div>
  );
}
