import { Banner, Mono, Pill, Ring, StatusDot } from "../primitives/index.js";
import { useMessages, type AppMessages } from "../i18n/index.js";

export interface ReconnectionReadyItem {
  readonly topic: string;
  readonly meta: string;
}

export interface ReconnectionResumedItem {
  readonly topic: string;
  readonly progress: number;
}

export interface ReconnectionReconcileProps {
  readonly offlineMins: number;
  readonly ready: readonly ReconnectionReadyItem[];
  readonly resumed: readonly ReconnectionResumedItem[];
  readonly onView: () => void;
}

function reconcileBody(
  t: AppMessages,
  offlineMins: number,
  ready: readonly ReconnectionReadyItem[],
  resumed: readonly ReconnectionResumedItem[]
): string {
  const s = t.states.reconnectionReconcile;
  const intro = s.offlineIntro(offlineMins);
  const events: string[] = [];
  if (ready[0]) events.push(s.readyEvent(ready[0].topic));
  if (resumed[0]) events.push(s.resumedEvent(resumed[0].topic, Math.round(resumed[0].progress * 100)));
  return events.length === 0 ? intro : s.sinceThen(intro, events.join(` ${s.and} `));
}

// 2a — resiliência do useExecutionWatch: banner ambiente do shell ao reconectar do offline.
export function ReconnectionReconcile({ offlineMins, ready, resumed, onView }: ReconnectionReconcileProps) {
  const t = useMessages();
  return (
    <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
      <Banner
        tone="accent"
        glow
        icon={<StatusDot tone="accent" size={7} style={{ marginTop: 6 }} />}
        action={
          <Pill variant="outline" tone="accent" onClick={onView} style={{ padding: "7px 14px", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
            {t.states.reconnectionReconcile.viewReady}
          </Pill>
        }
      >
        <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>{t.states.reconnectionReconcile.title}</div>
        <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 3, lineHeight: 1.55 }}>
          {reconcileBody(t, offlineMins, ready, resumed)}
        </div>
      </Banner>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {ready.map((item) => (
          <div
            key={item.topic}
            style={{
              padding: "9px 10px",
              borderRadius: 12,
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
              background: "color-mix(in oklch, var(--ink) 4%, transparent)"
            }}
          >
            <StatusDot tone="accent" size={8} style={{ marginTop: 5 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "0.855rem" }}>{item.topic}</div>
              <Mono style={{ display: "block", marginTop: 4 }}>{item.meta}</Mono>
            </div>
            <StatusDot tone="accent" size={7} style={{ marginTop: 5 }} />
          </div>
        ))}

        {resumed.map((item) => (
          <div key={item.topic} style={{ padding: "9px 10px", borderRadius: 12, display: "flex", gap: 9, alignItems: "flex-start" }}>
            <Ring size={16} width={2} value={item.progress} style={{ marginTop: 2 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.855rem" }}>{item.topic}</div>
              <Mono style={{ display: "block", marginTop: 4, color: "var(--accent)", animation: "breathe 1.6s var(--ease-standard) infinite" }}>
                {t.states.reconnectionReconcile.resumedStatus(Math.round(item.progress * 100))}
              </Mono>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
