import "./onboarding.css";
import { Mono } from "../primitives/index.js";
import { ReviewStep, type ReviewStepProps } from "./ReviewStep.js";
import { ResultStep, type ResultStepProps } from "./ResultStep.js";
import { Step1Context, type Step1ContextProps } from "./Step1Context.js";
import { WelcomeBridge, type WelcomeBridgeProps } from "./WelcomeBridge.js";
import { WizardProgress } from "./WizardProgress.js";
import { WritingStep, type WritingStepProps } from "./WritingStep.js";
import type { WizardStepVM } from "./types.js";

export type WizardStepContent =
  | { readonly kind: "context"; readonly props: Step1ContextProps }
  | { readonly kind: "writing"; readonly props: WritingStepProps }
  | { readonly kind: "review"; readonly props: ReviewStepProps }
  | { readonly kind: "result"; readonly props: ResultStepProps }
  | { readonly kind: "bridge"; readonly props: WelcomeBridgeProps };

export interface CalibrationWizardProps {
  readonly variant: "full" | "light";
  readonly progress: readonly WizardStepVM[];
  readonly content: WizardStepContent;
  /** Light-only — the overlay's × close. */
  readonly onClose?: () => void;
}

function renderContent(content: WizardStepContent) {
  switch (content.kind) {
    case "context":
      return <Step1Context {...content.props} />;
    case "writing":
      return <WritingStep {...content.props} />;
    case "review":
      return <ReviewStep {...content.props} />;
    case "result":
      return <ResultStep {...content.props} />;
    case "bridge":
      return <WelcomeBridge {...content.props} />;
  }
}

// Um só motor de passos, dois chromes (breakdown-11 §0/§1.2) — mesmos componentes de conteúdo,
// só a casca muda entre tela cheia (full, primeira calibração) e overlay (light, recalibrar).
export function CalibrationWizard({ variant, progress, content, onClose }: CalibrationWizardProps) {
  const showProgress = content.kind !== "bridge";

  if (variant === "light") {
    return (
      <div className="wizard-overlay-backdrop">
        <div className="wizard-overlay-panel">
          <div className="wizard-overlay-header">
            <Mono eyebrow>recalibrar sua voz</Mono>
            <button type="button" className="wizard-overlay-close close" onClick={onClose} aria-label="fechar">
              ×
            </button>
          </div>
          {showProgress ? <WizardProgress steps={progress} /> : null}
          <div className="wizard-overlay-body">{renderContent(content)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-full-screen">
      <div className="wizard-full-inner">
        {showProgress ? <WizardProgress steps={progress} /> : null}
        <div className="wizard-full-body">{renderContent(content)}</div>
      </div>
    </div>
  );
}
