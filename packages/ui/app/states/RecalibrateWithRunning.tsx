import { Mono, Panel, Pill, Ring, Serif } from "../primitives/index.js";

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
  return (
    <Panel dialog style={{ padding: 26, maxWidth: 440, width: "100%" }}>
      <Mono eyebrow style={{ marginBottom: 10 }}>
        recalibrar · voz v{fromVersion} → v{toVersion}
      </Mono>

      <Serif size="1.5rem" lineHeight={1.25} style={{ marginBottom: 12 }}>
        Você tem {running.length} texto{running.length === 1 ? "" : "s"} sendo escrito{running.length === 1 ? "" : "s"} agora.
      </Serif>

      <div style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
        Eles terminam com a voz atual (v{fromVersion}) — nada é interrompido. Tudo o que você gerar depois
        da recalibração usa a v{toVersion}. O histórico marca a versão de cada texto.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {running.map((item) => (
          <div key={item.topic} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "0.82rem", color: "var(--muted)" }}>
            <Ring size={14} width={2} value={item.progress} />
            {item.topic}
            <Mono style={{ marginLeft: "auto", color: "var(--dim)" }}>termina na v{fromVersion}</Mono>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <Pill variant="secondary" onClick={onWait}>Esperar terminarem</Pill>
        <Pill variant="primary" onClick={onProceed}>Recalibrar agora →</Pill>
      </div>
    </Panel>
  );
}
