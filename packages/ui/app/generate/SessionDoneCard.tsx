import { Mono, Panel, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface SessionDoneCardProps {
  readonly onGenerate: () => void;
  readonly disabled?: boolean;
}

// sessionDone (design L220–228) — shown once qIndex reaches the end of the plan. disabled
// reflects entitlement.canGenerate (GAP #8) — CostPreviewBand carries the reason copy.
export function SessionDoneCard({ onGenerate, disabled = false }: SessionDoneCardProps) {
  const t = useMessages();
  return (
    <Panel className="generate-session-done">
      <div>
        <Mono eyebrow style={{ color: "var(--dim)", marginBottom: 5, display: "block" }}>
          {t.generate.sessionDoneEyebrow}
        </Mono>
        <Serif size="1.15rem" lineHeight={1.35}>
          {t.generate.sessionDoneMessage}
        </Serif>
      </div>
      <Pill variant="primary" onClick={onGenerate} disabled={disabled}>
        {t.generate.generateNow}
      </Pill>
    </Panel>
  );
}
