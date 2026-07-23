import { Mono, Panel, Pill, Ring, Serif } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface RecalibrateRunningItem {
  readonly topic: string;
  readonly progress: number;
}

export interface RecalibrateWithRunningProps {
  readonly running: readonly RecalibrateRunningItem[];
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly onProceed: () => void;
  readonly onWait: () => void;
}

// 2d — confirmation overlay when recalibration opens with generations already running.
export function RecalibrateWithRunning({ running, fromVersion, toVersion, onProceed, onWait }: RecalibrateWithRunningProps) {
  const t = useMessages();
  return (
    <Panel dialog style={{ padding: 26, maxWidth: 440, width: "100%" }}>
      <Mono eyebrow style={{ marginBottom: 10 }}>
        {t.states.recalibrateWithRunning.header(fromVersion, toVersion)}
      </Mono>

      <Serif size="1.5rem" lineHeight={1.25} style={{ marginBottom: 12 }}>
        {t.states.recalibrateWithRunning.runningNotice(running.length)}
      </Serif>

      <div style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
        {t.states.recalibrateWithRunning.explanation(fromVersion, toVersion)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {running.map((item) => (
          <div key={item.topic} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "0.82rem", color: "var(--muted)" }}>
            <Ring size={14} width={2} value={item.progress} />
            {item.topic}
            <Mono style={{ marginLeft: "auto", color: "var(--dim)" }}>{t.states.recalibrateWithRunning.finishesAtVersion(fromVersion)}</Mono>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <Pill variant="secondary" onClick={onWait}>{t.states.recalibrateWithRunning.wait}</Pill>
        <Pill variant="primary" onClick={onProceed}>{t.states.recalibrateNow}</Pill>
      </div>
    </Panel>
  );
}
