import { Mono, Pill, Ring, Serif, StatusDot } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface QueueAndTrialGateProps {
  readonly runningCount: number;
  readonly queueEta: string;
  readonly onUseLast: () => void;
  readonly onSaveForLater: () => void;
  readonly onViewPlans?: () => void;
}

// 2b — last trial generation + ≥2 already running: single card, never a modal.
export function QueueAndTrialGate({ runningCount, queueEta, onUseLast, onSaveForLater, onViewPlans }: QueueAndTrialGateProps) {
  const t = useMessages();
  return (
    <div style={{ maxWidth: 560, width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--accent)",
          borderRadius: 16,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Ring size={34} width={3} value={0.8}>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem" }}>1</span>
          </Ring>
          <Serif size="1.25rem" lineHeight={1.3}>
            {t.states.queueAndTrialGate.lastGeneration}
          </Serif>
        </div>

        <div style={{ fontSize: "0.84rem", color: "var(--muted)", lineHeight: 1.6 }}>
          {t.states.queueAndTrialGate.explanation}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderTop: "1px solid var(--line)",
            paddingTop: 12
          }}
        >
          <StatusDot tone="accent" size={6} pulse />
          <Mono>{t.states.queueAndTrialGate.queueStatus(t.common.generations(runningCount), queueEta)}</Mono>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Pill variant="secondary" onClick={onSaveForLater}>{t.states.queueAndTrialGate.saveForLater}</Pill>
          <Pill variant="primary" onClick={onUseLast}>{t.states.queueAndTrialGate.useLast}</Pill>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={onViewPlans}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <Mono style={{ color: "var(--accent)" }}>{t.states.queueAndTrialGate.viewPlans}</Mono>
        </button>
      </div>
    </div>
  );
}
