import { Mono, Panel, Pill, Serif } from "../primitives/index.js";

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
  return (
    <Panel className="wizard-consent-authorization">
      <Mono eyebrow className="wizard-step-eyebrow">
        autorização formal
      </Mono>
      <Serif as="h2" size="1.25rem" lineHeight={1.35} className="wizard-consent-heading">
        posso usar essas amostras pra construir a sua voz?
      </Serif>
      <p className="wizard-consent-body">
        seus textos são analisados só pra modelar o seu perfil de voz. você pode revogar a qualquer
        momento em "sua voz".
      </p>
      <label className="wizard-consent-toggle">
        <input
          type="checkbox"
          checked={granted}
          onChange={(event) => onToggle(event.target.checked)}
          disabled={pending}
        />
        <span>autorizo o uso das minhas amostras</span>
      </label>
      {trialLine ? (
        <Mono as="p" className="wizard-trial-line">
          {trialLine}
        </Mono>
      ) : null}
      <Pill variant="primary" className="wide" onClick={onCreateVoice} disabled={!granted || pending}>
        Criar minha voz
      </Pill>
      {onSkipForNow ? (
        <button type="button" className="wizard-skip-link wizard-consent-skip" onClick={onSkipForNow} disabled={pending}>
          <Mono as="span">Calibrar depois →</Mono>
        </button>
      ) : null}
    </Panel>
  );
}
