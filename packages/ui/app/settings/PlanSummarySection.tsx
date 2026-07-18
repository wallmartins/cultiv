import { Mono, Panel } from "../primitives/index.js";

export interface PlanSummarySectionProps {
  readonly planName: string;
  readonly credits: number;
  readonly onGoBilling: () => void;
}

export function PlanSummarySection({ planName, credits, onGoBilling }: PlanSummarySectionProps) {
  return (
    <Panel className="settings-section settings-plan-row">
      <div>
        <Mono as="div" className="settings-section-eyebrow">
          Plano
        </Mono>
        <div className="settings-plan-value">
          {planName} · <span style={{ fontFamily: "var(--font-ui)" }}>{credits} créditos</span>
        </div>
      </div>
      <button type="button" className="settings-deep-link" onClick={onGoBilling}>
        gerenciar no billing →
      </button>
    </Panel>
  );
}
