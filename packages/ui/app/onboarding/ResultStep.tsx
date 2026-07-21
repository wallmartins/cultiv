import { Mono, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import { LowConfidenceReview } from "./LowConfidenceReview.js";
import { VoicePreview } from "./VoicePreview.js";
import type { VoicePreviewVM } from "./types.js";

export type ResultStepState =
  | {
      readonly kind: "success";
      readonly preview: VoicePreviewVM;
      readonly lowConfidence?: { readonly weakStepLabel: string; readonly onViewSample: () => void };
      readonly trialLine?: string;
      readonly onContinue: () => void;
    }
  | { readonly kind: "error"; readonly message: string; readonly onRetry: () => void };

export interface ResultStepProps {
  readonly state: ResultStepState;
}

export function ResultStep({ state }: ResultStepProps) {
  const t = useMessages();

  if (state.kind === "error") {
    return (
      <div className="wizard-result-step is-error">
        <Mono eyebrow className="wizard-step-eyebrow">
          {t.onboarding.result.errorEyebrow}
        </Mono>
        <Serif as="h2" size="1.3rem" lineHeight={1.35}>
          {t.onboarding.result.errorHeading}
        </Serif>
        <p className="wizard-result-error-message">{state.message}</p>
        <Pill variant="primary" onClick={state.onRetry}>
          {t.onboarding.result.retry}
        </Pill>
      </div>
    );
  }

  return (
    <div className="wizard-result-step is-success">
      <Mono eyebrow className="wizard-step-eyebrow">
        {t.onboarding.voiceReady}
      </Mono>
      {state.lowConfidence ? (
        <LowConfidenceReview
          preview={state.preview}
          weakStepLabel={state.lowConfidence.weakStepLabel}
          onViewSample={state.lowConfidence.onViewSample}
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
            {t.common.continue}
          </Pill>
        </>
      )}
    </div>
  );
}
