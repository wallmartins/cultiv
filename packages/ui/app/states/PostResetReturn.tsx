import { Pill, Ring, StatusDot } from "../primitives/index.js";
import { useFormat, useMessages } from "../i18n/index.js";

export interface PostResetReturnPriorContext {
  readonly topic: string;
  readonly audience: string;
}

export interface PostResetReturnProps {
  readonly name: string;
  // ISO date string — rendered through format.date, not pre-formatted by the caller.
  readonly resetDate: string;
  readonly priorContext: PostResetReturnPriorContext;
  readonly onResume: () => void;
  readonly onFresh: () => void;
}

// 1e — onboarding return screen after an account reset (trigger lives in config/14).
export function PostResetReturn({ name, resetDate, priorContext, onResume, onFresh }: PostResetReturnProps) {
  const t = useMessages();
  const format = useFormat();
  return (
    <div
      style={{
        width: 680,
        background: "var(--frame)",
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
      <Ring size={44} width={3} value={0.72} />

      <h1
        style={{
          fontFamily: "var(--font-headline)",
          fontWeight: 400,
          fontSize: 32,
          lineHeight: 1.15,
          margin: 0,
          maxWidth: 440
        }}
      >
        {t.states.postResetReturn.title(name)}
      </h1>

      <div style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.6, maxWidth: 420 }}>
        {t.states.postResetReturn.body(format.date(resetDate))}
      </div>

      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "14px 18px",
          maxWidth: 420,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          textAlign: "left"
        }}
      >
        <StatusDot tone="accent" size={7} style={{ marginTop: 6 }} />
        <div style={{ fontSize: "0.84rem", color: "var(--muted)", lineHeight: 1.6 }}>
          {t.states.postResetReturn.priorContextIntro}{" "}
          <span style={{ color: "var(--ink)" }}>{priorContext.topic}</span>, {t.states.postResetReturn.priorContextFor}{" "}
          <span style={{ color: "var(--ink)" }}>{priorContext.audience}</span>. {t.states.postResetReturn.priorContextQuestion}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <Pill variant="secondary" onClick={onFresh} style={{ padding: "10px 20px", fontSize: "0.86rem" }}>
          {t.states.postResetReturn.startFresh}
        </Pill>
        <Pill variant="primary" onClick={onResume} style={{ padding: "10px 22px", fontSize: "0.9rem" }}>
          {t.states.postResetReturn.recalibrateWithContext}
        </Pill>
      </div>
    </div>
  );
}
