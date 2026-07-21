import { Banner, Pill } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import { VoicePreview } from "./VoicePreview.js";
import type { VoicePreviewVM } from "./types.js";

export interface LowConfidenceReviewProps {
  readonly preview: VoicePreviewVM;
  readonly weakStepLabel: string;
  readonly onViewSample: () => void;
  readonly onContinueAnyway: () => void;
}

// Variante de confiança baixa (~40%, breakdown-11 §1.1) — aponta a amostra fraca em vez de só
// mostrar um número baixo sem saída. Editar em v1 não reabre o passo (GAP #12: sem transição de
// reabertura no backend), então a amostra é só revista; recalibrar é o caminho de reforço.
export function LowConfidenceReview({ preview, weakStepLabel, onViewSample, onContinueAnyway }: LowConfidenceReviewProps) {
  const t = useMessages();
  return (
    <div className="wizard-low-confidence">
      <VoicePreview preview={preview} />
      <Banner tone="warning" className="wizard-low-confidence-banner">
        {t.onboarding.lowConfidence.banner(weakStepLabel)}
      </Banner>
      <div className="wizard-step-footer">
        <Pill variant="secondary" onClick={onContinueAnyway}>
          {t.onboarding.lowConfidence.continueAnyway}
        </Pill>
        <Pill variant="primary" onClick={onViewSample}>
          {t.onboarding.lowConfidence.viewSample}
        </Pill>
      </div>
    </div>
  );
}
