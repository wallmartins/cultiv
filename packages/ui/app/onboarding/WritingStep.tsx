import { Mono, Panel, Pill, Serif } from "../primitives/index.js";

export interface WritingStepProps {
  readonly eyebrow: string;
  readonly prompt: string;
  readonly helperCopy?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly minWords: number;
  readonly targetWords: number;
  readonly maxWords: number;
  readonly onContinue: () => void;
  readonly onBack: () => void;
  /** Skip is available but discouraged (breakdown-11 §1.1) — can lower voice confidence. */
  readonly onSkip?: () => void;
  readonly pending?: boolean;
  /**
   * True when this step already has a submitted answer and isn't the session's current step —
   * the backend has no "reopen a past step" transition, so editing/resubmitting here would always
   * 400. Renders as review-only; onContinue should just resume at the real current step.
   */
  readonly readOnly?: boolean;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

// "acima" never blocks — só o campo vazio bloqueia Continuar (breakdown-11 §3.2).
function counterState(count: number, minWords: number, maxWords: number): "below" | "in-range" | "over" {
  if (count > maxWords) return "over";
  if (count < minWords) return "below";
  return "in-range";
}

export function WritingStep({
  eyebrow,
  prompt,
  helperCopy,
  value,
  onChange,
  minWords,
  targetWords,
  maxWords,
  onContinue,
  onBack,
  onSkip,
  pending = false,
  readOnly = false
}: WritingStepProps) {
  const count = countWords(value);
  const state = counterState(count, minWords, maxWords);

  return (
    <Panel className="wizard-step-panel">
      <Mono eyebrow className="wizard-step-eyebrow">
        {eyebrow}
      </Mono>
      <Serif as="h1" size="1.5rem" lineHeight={1.35} className="wizard-step-heading">
        {prompt}
      </Serif>
      {readOnly ? (
        <p className="wizard-writing-helper">essa amostra já foi enviada — dá pra reler, mas não editar aqui.</p>
      ) : helperCopy ? (
        <p className="wizard-writing-helper">{helperCopy}</p>
      ) : null}
      <textarea
        autoFocus={!readOnly}
        className={readOnly ? "wizard-writing-textarea is-read-only" : "wizard-writing-textarea"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        placeholder="escreva com as suas palavras — não precisa ser perfeito"
        rows={8}
      />
      {readOnly ? null : (
        <Mono as="div" className={`wizard-word-counter is-${state}`}>
          {count} / {minWords}–{maxWords} palavras
          {state === "below" ? ` · mais um pouco — cerca de ${targetWords} é o ideal` : null}
          {state === "in-range" ? " · boa faixa" : null}
          {state === "over" ? " · tudo bem, pode manter" : null}
        </Mono>
      )}
      <div className="wizard-step-footer">
        <Pill variant="secondary" onClick={onBack} disabled={pending}>
          Voltar
        </Pill>
        <div className="wizard-writing-forward">
          {!readOnly && onSkip ? (
            <button type="button" className="wizard-skip-link" onClick={onSkip} disabled={pending}>
              <Mono as="span">pular esta amostra →</Mono>
            </button>
          ) : null}
          <Pill variant="primary" onClick={onContinue} disabled={pending || (!readOnly && value.trim() === "")}>
            {readOnly ? "Voltar para onde parei" : "Continuar"}
          </Pill>
        </div>
      </div>
    </Panel>
  );
}
