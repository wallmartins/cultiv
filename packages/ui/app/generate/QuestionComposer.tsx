import type { KeyboardEvent } from "react";
import { Mono, Panel, Pill, Serif } from "../primitives/index.js";

export interface QuestionComposerProps {
  readonly eyebrow: string;
  readonly prompt: string;
  readonly note?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onSkip: () => void;
}

// showComposer (design L197–207) — one question at a time; also serves the ambiguity question
// (same chrome, note carries the impact line).
export function QuestionComposer({ eyebrow, prompt, note, value, onChange, onSubmit, onSkip }: QuestionComposerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <Panel className="generate-question-panel">
      <Mono eyebrow style={{ color: "var(--dim)", marginBottom: 5 }}>
        {eyebrow}
      </Mono>
      <Serif size="1.15rem" lineHeight={1.35} style={{ display: "block", marginBottom: note ? 4 : 10 }}>
        {prompt}
      </Serif>
      {note ? <div className="generate-system-note" style={{ marginBottom: 10 }}>{note}</div> : null}
      <textarea
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Responda com uma ou duas frases…"
        rows={2}
      />
      <div className="generate-question-footer">
        <button type="button" onClick={onSkip} className="mono generate-skip-link">
          pular pergunta →
        </button>
        <Pill variant="primary" onClick={onSubmit} disabled={!value.trim()}>
          Responder →
        </Pill>
      </div>
    </Panel>
  );
}
