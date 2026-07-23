import { Mono } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import { BuildingVoice } from "./BuildingVoice.js";
import { ConsentAuthorization, type ConsentAuthorizationProps } from "./ConsentAuthorization.js";

// completeReview é a única chamada que "constrói" a voz (não existe endpoint de preview
// separado) — por isso passo 6 só tem dois estados reais: pedir consentimento, ou aguardar a
// mutação. O resultado (confiança/prosa/traços) só existe depois que ela resolve, então
// VoicePreview/LowConfidenceReview vivem no passo 7 (ResultStep), não aqui.
export type ReviewStepState = { readonly kind: "consent"; readonly consent: ConsentAuthorizationProps } | { readonly kind: "building" };

export interface ReviewStepProps {
  readonly state: ReviewStepState;
}

export function ReviewStep({ state }: ReviewStepProps) {
  const t = useMessages();
  if (state.kind === "building") {
    return <BuildingVoice />;
  }

  return (
    <div className="wizard-review-step">
      <Mono eyebrow className="wizard-step-eyebrow">
        {t.onboarding.review.eyebrow}
      </Mono>
      <ConsentAuthorization {...state.consent} />
    </div>
  );
}
