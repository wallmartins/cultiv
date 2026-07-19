import type { KeyboardEvent } from "react";
import { Mono, Panel, Serif } from "../primitives/index.js";
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
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim()) onSubmit();
    }
  }

  return (
    <div className="generate-hero">
      <div className="generate-hero-inner">
        <Mono eyebrow>escreve como você pensa</Mono>
        <Serif as="h1" size="40px" lineHeight={1.12} style={{ letterSpacing: "-0.01em", margin: 0 }}>
          Sobre o que você quer <em>escrever</em>?
        </Serif>
        <Panel className="generate-theme-field">
          <textarea
            autoFocus
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={onPaste ? (event) => onPaste(event.clipboardData.getData("text")) : undefined}
            placeholder="Cole uma ideia, uma inquietação, um tema…"
            rows={3}
          />
          <div className="generate-theme-footer">
            <Mono style={{ color: "var(--dim)" }}>a sessão guiada vem depois · pulável</Mono>
            <button
              type="button"
              className="generate-submit-ring"
              onClick={onSubmit}
              disabled={!value.trim()}
              aria-label="Continuar"
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
