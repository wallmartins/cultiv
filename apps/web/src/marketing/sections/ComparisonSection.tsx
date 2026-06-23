import { useState } from "react";
import {
  CartographySurface,
  CoordinateLabel,
  Container,
  Text,
  cn,
} from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

type PanelKey = "generic" | "voice";

export interface ComparisonSectionProps {
  readonly locale: MarketingLocale;
}

export function ComparisonSection({ locale }: ComparisonSectionProps) {
  const { comparison } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");
  const [activePanel, setActivePanel] = useState<PanelKey>("voice");

  return (
    <section id="comparacao" className="border-b border-ink-ghost/30">
      <CartographySurface>
        <Container
          ref={sectionRef}
          className="py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
        >
          <header
            className="mx-auto mb-10 max-w-3xl text-center md:mb-14"
            data-section-item
          >
            <CoordinateLabel
              index={4}
              label={comparison.eyebrow}
              className="mb-4 block"
            />
            <Text as="h2" variant="display" className="text-deep-blue">
              {comparison.title}
            </Text>
          </header>

          <div className="mx-auto max-w-4xl" data-section-item>
            <div className="overflow-hidden rounded-[5px] border-double-cartography bg-off-white shadow-cartography">
              <div className="border-b border-dotted-cartography px-5 py-4 md:px-6">
                <span className="ui-type-mono text-[0.6875rem] uppercase tracking-widest text-ink-muted">
                  {comparison.title}
                </span>

                <div
                  className="mt-3 flex gap-1 md:hidden"
                  role="tablist"
                  aria-label={comparison.title}
                >
                  <ComparisonTab
                    id="comparison-generic-tab"
                    label={comparison.genericLabel}
                    selected={activePanel === "generic"}
                    onSelect={() => setActivePanel("generic")}
                    variant="generic"
                  />
                  <ComparisonTab
                    id="comparison-voice-tab"
                    label={comparison.voiceLabel}
                    selected={activePanel === "voice"}
                    onSelect={() => setActivePanel("voice")}
                    variant="voice"
                  />
                </div>
              </div>

              <div className="relative grid md:grid-cols-2">
                <div
                  className="pointer-events-none absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-ink-ghost/50 md:block"
                  aria-hidden="true"
                />

                <ComparisonMeridianPanel
                  kind="generic"
                  label={comparison.genericLabel}
                  line1={comparison.genericLine1}
                  line2={comparison.genericLine2}
                  note={comparison.genericNote}
                  mobileActive={activePanel === "generic"}
                  tabId="comparison-generic-tab"
                />
                <ComparisonMeridianPanel
                  kind="voice"
                  label={comparison.voiceLabel}
                  line1={comparison.voiceLine1}
                  line2={comparison.voiceLine2}
                  note={comparison.voiceNote}
                  mobileActive={activePanel === "voice"}
                  tabId="comparison-voice-tab"
                />
              </div>
            </div>

            <div className="mt-10 text-center md:mt-12" data-section-item>
              <Text as="p" variant="display-sm" className="mb-3 text-deep-blue">
                {comparison.verdict}
              </Text>
              <Text as="p" variant="margem" className="text-terracotta">
                {comparison.signature}
              </Text>
            </div>
          </div>
        </Container>
      </CartographySurface>
    </section>
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

function ComparisonMeridianPanel({
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
  readonly note: string;
  readonly mobileActive: boolean;
  readonly tabId: string;
}) {
  const isVoice = kind === "voice";

  return (
    <div
      role="tabpanel"
      aria-labelledby={tabId}
      className={cn(
        "p-5 md:p-6",
        isVoice ? "bg-cream md:bg-cream/60" : "bg-off-white",
        !mobileActive && "hidden md:block"
      )}
    >
      <span
        className={cn(
          "mb-3 block ui-type-mono text-[0.625rem] uppercase tracking-widest",
          isVoice ? "text-terracotta" : "text-ink-muted"
        )}
      >
        {label}
      </span>
      <p
        className={cn(
          "text-sm leading-relaxed",
          isVoice ? "ui-type-logbook text-ink" : "font-inter text-ink-muted/80 italic"
        )}
      >
        {line1}
        <br />
        {line2}
      </p>
      <Text as="p" variant="margem" className={cn("mt-4", isVoice ? "text-terracotta" : "text-ink-muted")}>
        {note}
      </Text>
    </div>
  );
}
