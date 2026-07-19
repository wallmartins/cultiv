import { Mono, Panel, Pill, Serif } from "../primitives/index.js";

export interface SessionDoneCardProps {
  readonly onGenerate: () => void;
  readonly disabled?: boolean;
}

// sessionDone (design L220–228) — shown once qIndex reaches the end of the plan. disabled
// reflects entitlement.canGenerate (GAP #8) — CostPreviewBand carries the reason copy.
export function SessionDoneCard({ onGenerate, disabled = false }: SessionDoneCardProps) {
  return (
    <Panel className="generate-session-done">
      <div>
        <Mono eyebrow style={{ color: "var(--dim)", marginBottom: 5, display: "block" }}>
          sessão concluída
        </Mono>
        <Serif size="1.15rem" lineHeight={1.35}>
          Tudo pronto. É só gerar.
        </Serif>
      </div>
      <Pill variant="primary" onClick={onGenerate} disabled={disabled}>
        Gerar agora →
      </Pill>
    </Panel>
  );
}
