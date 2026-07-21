import { useState } from "react";
import { Mono, Panel, Pill, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface PlanCardAction {
  readonly label: string;
  readonly onClick: () => void;
  readonly tone?: "danger";
  readonly pending?: boolean;
}

export interface PlanCardProps {
  readonly planName: string;
  readonly payMethod: string;
  readonly onSwitchPlan: () => void;
  // Single slot — container resolves which one (portal / cancel) the capability flags allow.
  // undefined means no in-app management action exists for this account today.
  readonly secondaryAction?: PlanCardAction;
}

// Zero enum de estado aqui — o container já resolveu label/handler; o card só desenha.
export function PlanCard({ planName, payMethod, onSwitchPlan, secondaryAction }: PlanCardProps) {
  const t = useMessages();
  const [confirming, setConfirming] = useState(false);
  const isDanger = secondaryAction?.tone === "danger";

  const handleSecondaryClick = () => {
    if (isDanger && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    secondaryAction?.onClick();
  };

  return (
    <Panel style={{ padding: "var(--sp-lg)", display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
      <Mono eyebrow>{t.billing.planEyebrow}</Mono>
      <Serif as="div" size="1.3rem">
        {planName}
      </Serif>
      <Mono style={{ color: "var(--muted)" }}>{payMethod}</Mono>
      <div style={{ display: "flex", gap: "var(--sp-sm)", marginTop: "var(--sp-sm)", flexWrap: "wrap" }}>
        <Pill variant="primary" onClick={onSwitchPlan}>
          {t.billing.switchPlan}
        </Pill>
        {secondaryAction ? (
          confirming ? (
            <>
              <Mono style={{ color: "var(--muted)", alignSelf: "center" }}>{t.billing.confirmCancel.prompt}</Mono>
              <Pill variant="danger" onClick={handleSecondaryClick} disabled={secondaryAction.pending}>
                {t.billing.confirmCancel.confirm}
              </Pill>
              <Pill variant="secondary" onClick={() => setConfirming(false)}>
                {t.billing.confirmCancel.keep}
              </Pill>
            </>
          ) : (
            <Pill
              variant="secondary"
              className={isDanger ? "is-danger" : undefined}
              onClick={handleSecondaryClick}
              disabled={secondaryAction.pending}
            >
              {secondaryAction.label}
            </Pill>
          )
        ) : null}
      </div>
    </Panel>
  );
}
