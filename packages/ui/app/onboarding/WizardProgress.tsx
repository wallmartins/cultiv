import { StatusDot } from "../primitives/index.js";
import type { WizardStepVM } from "./types.js";

export interface WizardProgressProps {
  readonly steps: readonly WizardStepVM[];
}

export function WizardProgress({ steps }: WizardProgressProps) {
  return (
    <div className="wizard-progress" role="list" aria-label="progresso da calibração">
      {steps.map((step) => (
        <div key={step.id} role="listitem" className={`wizard-progress-step is-${step.status}`}>
          <StatusDot tone={step.status === "upcoming" ? "neutral" : "accent"} size={7} />
          <span className="wizard-progress-label">{step.label}</span>
        </div>
      ))}
    </div>
  );
}
