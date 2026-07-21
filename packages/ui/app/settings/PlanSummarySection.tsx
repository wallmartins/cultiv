import { Mono, Panel } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface PlanSummarySectionProps {
  readonly planName: string;
  readonly credits: number;
  readonly onGoBilling: () => void;
}

export function PlanSummarySection({ planName, credits, onGoBilling }: PlanSummarySectionProps) {
  const t = useMessages();
  return (
    <Panel className="settings-section settings-plan-row">
      <div>
        <Mono as="div" className="settings-section-eyebrow">
          {t.settings.planEyebrow}
        </Mono>
        <div className="settings-plan-value">
          {planName} · <span style={{ fontFamily: "var(--font-ui)" }}>{t.common.credits(credits)}</span>
        </div>
      </div>
      <button type="button" className="settings-deep-link" onClick={onGoBilling}>
        {t.settings.manageInBilling}
      </button>
    </Panel>
  );
}
