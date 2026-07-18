import { Mono, Pill, Serif } from "../primitives/index.js";

export interface DetailFailedProps {
  readonly reason: string;
  readonly onRedo: () => void;
}

// dFailed (design L~978) — credits were never debited for a failed run; the copy says so explicitly.
export function DetailFailed({ reason, onRedo }: DetailFailedProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "40px 0", alignItems: "center", textAlign: "center" }}>
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--r-pill)",
          border: "2px solid var(--danger)",
          color: "var(--danger)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18
        }}
      >
        ×
      </span>
      <Serif size="1.5rem">Esta geração falhou</Serif>
      <p style={{ fontSize: "0.9rem", color: "var(--muted)", maxWidth: 400, lineHeight: 1.6, margin: 0 }}>{reason}</p>
      <Mono style={{ color: "var(--muted)" }}>seus créditos não foram cobrados</Mono>
      <Pill variant="primary" onClick={onRedo}>
        Refazer geração →
      </Pill>
    </div>
  );
}
