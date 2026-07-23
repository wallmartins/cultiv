import { Mono, Panel, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface ConsentAuthorizationProps {
  readonly granted: boolean;
  readonly onToggle: (granted: boolean) => void;
  readonly onCreateVoice: () => void;
  readonly pending?: boolean;
  readonly trialLine?: string;
  /** Passo 6 também tem a saída "Calibrar depois" (breakdown-11 §3) — omitida na recalibração
   * (light chrome), onde já existe uma voz, mesma convenção do Step1Context. */
  readonly onSkipForNow?: () => void;
}

// Gate duro (ADR 0005 §3): "Criar minha voz" só habilita com o switch marcado — recusar aqui
// significa nenhuma chamada de completeReview/grantConsent acontece.
export function ConsentAuthorization({ granted, onToggle, onCreateVoice, pending = false, trialLine, onSkipForNow }: ConsentAuthorizationProps) {
  const t = useMessages();
  return (
    <Panel className="wizard-consent-authorization">
      <Mono eyebrow className="wizard-step-eyebrow">
        {t.onboarding.consent.eyebrow}
      </Mono>
      <Serif as="h2" size="1.25rem" lineHeight={1.35} className="wizard-consent-heading">
        {t.onboarding.consent.heading}
      </Serif>
      <p className="wizard-consent-body">{t.onboarding.consent.body}</p>
      <label className="wizard-consent-toggle">
        <input
          type="checkbox"
          checked={granted}
          onChange={(event) => onToggle(event.target.checked)}
          disabled={pending}
        />
        <span>{t.onboarding.consent.checkboxLabel}</span>
      </label>
      {trialLine ? (
        <Mono as="p" className="wizard-trial-line">
          {trialLine}
        </Mono>
      ) : null}
      <Pill variant="primary" className="wide" onClick={onCreateVoice} disabled={!granted || pending}>
        {t.onboarding.consent.createVoice}
      </Pill>
      {onSkipForNow ? (
        <button type="button" className="wizard-skip-link wizard-consent-skip" onClick={onSkipForNow} disabled={pending}>
          <Mono as="span">{t.onboarding.skipForNow}</Mono>
        </button>
      ) : null}
    </Panel>
  );
}
