import { Mono, Panel, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import { BuildingVoice } from "./BuildingVoice.js";

export interface ReviewConfirmProps {
  readonly onCreateVoice: () => void;
  readonly pending?: boolean;
  readonly trialLine?: string;
  /** Passo 6 também tem a saída "Calibrar depois" (breakdown-11 §3) — omitida na recalibração
   * (light chrome), onde já existe uma voz, mesma convenção do Step1Context. */
  readonly onSkipForNow?: () => void;
}

// completeReview é a única chamada que "constrói" a voz (não existe endpoint de preview separado) —
// por isso passo 6 só tem dois estados reais: confirmar a construção, ou aguardar a mutação. O
// consentimento já foi dado no passo de contexto (antes de qualquer amostra), então aqui é só o
// "criar minha voz" final. O resultado (confiança/prosa/traços) vive no passo 7 (ResultStep).
export type ReviewStepState =
  | { readonly kind: "confirm"; readonly confirm: ReviewConfirmProps }
  | { readonly kind: "building" };

export interface ReviewStepProps {
  readonly state: ReviewStepState;
}

export function ReviewStep({ state }: ReviewStepProps) {
  const t = useMessages();
  if (state.kind === "building") {
    return <BuildingVoice />;
  }

  const { onCreateVoice, pending = false, trialLine, onSkipForNow } = state.confirm;
  return (
    <Panel className="wizard-consent-authorization">
      <Mono eyebrow className="wizard-step-eyebrow">
        {t.onboarding.review.eyebrow}
      </Mono>
      <Serif as="h2" size="1.25rem" lineHeight={1.35} className="wizard-consent-heading">
        {t.onboarding.review.heading}
      </Serif>
      <p className="wizard-consent-body">{t.onboarding.consent.body}</p>
      {trialLine ? (
        <Mono as="p" className="wizard-trial-line">
          {trialLine}
        </Mono>
      ) : null}
      <Pill variant="primary" className="wide" onClick={onCreateVoice} disabled={pending}>
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
