import { Mono, Pill, Serif } from "../primitives/index.js";
import { LowConfidenceReview } from "./LowConfidenceReview.js";
import { VoicePreview } from "./VoicePreview.js";
import type { VoicePreviewVM } from "./types.js";

export type ResultStepState =
  | {
      readonly kind: "success";
      readonly preview: VoicePreviewVM;
      readonly lowConfidence?: { readonly weakStepLabel: string; readonly onRewrite: () => void };
      readonly trialLine?: string;
      readonly onContinue: () => void;
    }
  | { readonly kind: "error"; readonly message: string; readonly onRetry: () => void };

export interface ResultStepProps {
  readonly state: ResultStepState;
}

export function ResultStep({ state }: ResultStepProps) {
  if (state.kind === "error") {
    return (
      <div className="wizard-result-step is-error">
        <Mono eyebrow className="wizard-step-eyebrow">
          algo deu errado
        </Mono>
        <Serif as="h2" size="1.3rem" lineHeight={1.35}>
          não deu pra construir sua voz agora
        </Serif>
        <p className="wizard-result-error-message">{state.message}</p>
        <Pill variant="primary" onClick={state.onRetry}>
          Refazer
        </Pill>
      </div>
    );
  }

  return (
    <div className="wizard-result-step is-success">
      <Mono eyebrow className="wizard-step-eyebrow">
        sua voz está pronta
      </Mono>
      {state.lowConfidence ? (
        <LowConfidenceReview
          preview={state.preview}
          weakStepLabel={state.lowConfidence.weakStepLabel}
          onRewrite={state.lowConfidence.onRewrite}
          onContinueAnyway={state.onContinue}
        />
      ) : (
        <>
          <VoicePreview preview={state.preview} />
          {state.trialLine ? (
            <Mono as="p" className="wizard-trial-line">
              {state.trialLine}
            </Mono>
          ) : null}
          <Pill variant="primary" className="wide" onClick={state.onContinue}>
            Continuar
          </Pill>
        </>
      )}
    </div>
  );
}
