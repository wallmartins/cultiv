import { Banner, Mono, Panel, Pill, Serif } from "../primitives/index.js";

export interface Step1ContextProps {
  readonly domain: string;
  readonly onDomainChange: (value: string) => void;
  readonly audience: string;
  readonly onAudienceChange: (value: string) => void;
  readonly strength: string;
  readonly onStrengthChange: (value: string) => void;
  readonly onContinue: () => void;
  readonly pending?: boolean;
  /** Omitted in the light (recalibrate) chrome — the × close covers that escape there. */
  readonly onSkipForNow?: () => void;
}

export function Step1Context({
  domain,
  onDomainChange,
  audience,
  onAudienceChange,
  strength,
  onStrengthChange,
  onContinue,
  pending = false,
  onSkipForNow
}: Step1ContextProps) {
  const canContinue = domain.trim().length > 0 && audience.trim().length > 0;

  return (
    <Panel className="wizard-step-panel">
      <Mono eyebrow className="wizard-step-eyebrow">
        antes de começar
      </Mono>
      <Serif as="h1" size="1.7rem" lineHeight={1.3} className="wizard-step-heading">
        vamos te conhecer
      </Serif>
      <div className="wizard-field">
        <label className="wizard-field-label" htmlFor="wizard-domain">
          sobre o que você mais escreve?
        </label>
        <input
          id="wizard-domain"
          className="wizard-field-input"
          value={domain}
          onChange={(event) => onDomainChange(event.target.value)}
          placeholder="ex.: produto, carreira, tecnologia…"
        />
      </div>
      <div className="wizard-field">
        <label className="wizard-field-label" htmlFor="wizard-audience">
          pra quem você escreve?
        </label>
        <input
          id="wizard-audience"
          className="wizard-field-input"
          value={audience}
          onChange={(event) => onAudienceChange(event.target.value)}
          placeholder="ex.: outros fundadores, meu time…"
        />
      </div>
      <div className="wizard-field">
        <label className="wizard-field-label" htmlFor="wizard-strength">
          o que você acha que já funciona bem no seu jeito de escrever? <span className="wizard-field-optional">(opcional)</span>
        </label>
        <textarea
          id="wizard-strength"
          className="wizard-field-textarea"
          value={strength}
          onChange={(event) => onStrengthChange(event.target.value)}
          placeholder="qualquer pista ajuda — ou deixe em branco"
          rows={2}
        />
      </div>
      <Banner tone="accent" className="wizard-consent-notice">
        vamos usar seus textos pra construir seu perfil de voz
      </Banner>
      <div className="wizard-step-footer">
        {onSkipForNow ? (
          <button type="button" className="wizard-skip-link" onClick={onSkipForNow}>
            <Mono as="span">Calibrar depois →</Mono>
          </button>
        ) : (
          <span />
        )}
        <Pill variant="primary" onClick={onContinue} disabled={!canContinue || pending}>
          Continuar
        </Pill>
      </div>
    </Panel>
  );
}
