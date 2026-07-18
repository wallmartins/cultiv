import { Banner, Pill } from "../primitives/index.js";
import { VoicePreview } from "./VoicePreview.js";
import type { VoicePreviewVM } from "./types.js";

export interface LowConfidenceReviewProps {
  readonly preview: VoicePreviewVM;
  readonly weakStepLabel: string;
  readonly onRewrite: () => void;
  readonly onContinueAnyway: () => void;
}

// Variante de confiança baixa (~40%, breakdown-11 §1.1) — aponta a amostra fraca em vez de só
// mostrar um número baixo sem saída.
export function LowConfidenceReview({ preview, weakStepLabel, onRewrite, onContinueAnyway }: LowConfidenceReviewProps) {
  return (
    <div className="wizard-low-confidence">
      <VoicePreview preview={preview} />
      <Banner tone="warning" className="wizard-low-confidence-banner">
        a amostra "{weakStepLabel}" ficou curta pra sua voz — reescrever ela ajuda bastante a confiança.
      </Banner>
      <div className="wizard-step-footer">
        <Pill variant="secondary" onClick={onContinueAnyway}>
          Continuar assim mesmo
        </Pill>
        <Pill variant="primary" onClick={onRewrite}>
          Reescrever esta amostra
        </Pill>
      </div>
    </div>
  );
}
