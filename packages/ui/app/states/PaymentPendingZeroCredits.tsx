import { Mono, Pill, Ring } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface PaymentPendingZeroCreditsProps {
  readonly planName: string;
  readonly cycleCredits: number;
  readonly onRegularize: () => void;
}

// 1d — billing card + generation paywall when payment is pending and credits hit zero.
export function PaymentPendingZeroCredits({ planName, cycleCredits, onRegularize }: PaymentPendingZeroCreditsProps) {
  const t = useMessages();
  return (
    <div
      style={{
        width: 680,
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--font-body)",
        padding: 44,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        textAlign: "center"
      }}
    >
      <Ring value={0} size={84} width={4} tone="danger">
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "1.5rem", lineHeight: 1 }}>0</span>
        <Mono style={{ color: "var(--muted)", marginTop: 2 }}>{t.states.paymentPendingZeroCredits.creditsLabel}</Mono>
      </Ring>

      <h1
        style={{
          fontFamily: "var(--font-headline)",
          fontWeight: 400,
          fontSize: 30,
          lineHeight: 1.15,
          margin: 0,
          maxWidth: 420
        }}
      >
        {t.states.paymentPendingZeroCredits.title}
      </h1>

      <div style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.6, maxWidth: 420 }}>
        {t.states.paymentPendingZeroCredits.body(planName, t.common.credits(cycleCredits))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <Pill variant="danger" onClick={onRegularize}>{t.states.paymentPendingZeroCredits.regularize}</Pill>
        <Pill variant="secondary" disabled style={{ padding: "10px 20px", fontSize: "0.86rem" }}>
          {t.states.paymentPendingZeroCredits.buyExtra}
        </Pill>
      </div>

      <Mono style={{ color: "var(--dim)" }}>
        {t.states.paymentPendingZeroCredits.footnote}
      </Mono>
    </div>
  );
}
