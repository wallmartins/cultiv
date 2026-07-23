import type { KeyboardEvent } from "react";
import { Mono, Panel, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import { TrialLine } from "./TrialLine.js";

export interface ThemeHeroProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onPaste?: (pastedText: string) => void;
  readonly trialLine?: string;
}

// showHero (design L152–167) — the first "message" of the thread; identity is always the
// theme, never a format picker.
export function ThemeHero({ value, onChange, onSubmit, onPaste, trialLine }: ThemeHeroProps) {
  const t = useMessages();
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim()) onSubmit();
    }
  }

  return (
    <div className="generate-hero">
      <div className="generate-hero-inner">
        <Mono eyebrow>{t.generate.hero.eyebrow}</Mono>
        <Serif as="h1" size="40px" lineHeight={1.12} style={{ letterSpacing: "-0.01em", margin: 0 }}>
          {t.generate.hero.headlinePrefix}
          <em>{t.generate.hero.headlineEmphasis}</em>
          {t.generate.hero.headlineSuffix}
        </Serif>
        <Panel className="generate-theme-field">
          <textarea
            autoFocus
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={onPaste ? (event) => onPaste(event.clipboardData.getData("text")) : undefined}
            placeholder={t.generate.hero.placeholder}
            rows={3}
          />
          <div className="generate-theme-footer">
            <Mono style={{ color: "var(--dim)" }}>{t.generate.hero.footerNote}</Mono>
            <button
              type="button"
              className="generate-submit-ring"
              onClick={onSubmit}
              disabled={!value.trim()}
              aria-label={t.common.continue}
            >
              →
            </button>
          </div>
        </Panel>
        {trialLine ? <TrialLine label={trialLine} /> : null}
      </div>
    </div>
  );
}
