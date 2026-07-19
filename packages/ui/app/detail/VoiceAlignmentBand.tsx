import { Chip, Mono, Ring } from "../primitives/index.js";

export interface VoiceAlignmentBandProps {
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly confidenceValue: number;
  readonly traits: readonly string[];
  readonly rules: readonly string[];
  readonly antiPatterns: readonly string[];
  readonly onSeeProfile: () => void;
}

// Collapsible, starts closed (design `alignOpen` default false). The deep voice profile
// (traits confirm/contest, material-base, coverage) is the SEAM → S5 (`/app/voice`); this band
// only summarizes what this one generation applied.
export function VoiceAlignmentBand({
  open,
  onToggle,
  confidenceValue,
  traits,
  rules,
  antiPatterns,
  onSeeProfile
}: VoiceAlignmentBandProps) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "13px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "inherit",
          font: "inherit"
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Ring value={confidenceValue} size={18} width={2} tone="accent" />
          <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>Alinhamento de voz</span>
        </span>
        <Mono style={{ color: "var(--muted)" }}>{open ? "fechar ×" : "abrir →"}</Mono>
      </button>
      {open ? (
        <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 14, borderTop: "1px solid var(--line)" }}>
          <div>
            <Mono
              as="div"
              style={{ textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--dim)", fontSize: 10, marginBottom: 8 }}
            >
              Traços aplicados
            </Mono>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {traits.map((trait) => (
                <Chip key={trait} tabIndex={-1}>
                  {trait}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <Mono
              as="div"
              style={{ textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--dim)", fontSize: 10, marginBottom: 8 }}
            >
              Regras respeitadas
            </Mono>
            <div style={{ fontSize: "0.86rem", color: "var(--muted)", lineHeight: 1.6 }}>{rules.join(" · ")}</div>
          </div>
          <div>
            <Mono
              as="div"
              style={{ textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--dim)", fontSize: 10, marginBottom: 8 }}
            >
              Anti-padrões evitados
            </Mono>
            <div style={{ fontSize: "0.86rem", color: "var(--muted)", lineHeight: 1.6 }}>{antiPatterns.join(" · ")}</div>
          </div>
          <button
            type="button"
            onClick={onSeeProfile}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--accent)",
              cursor: "pointer",
              font: "inherit",
              fontSize: "0.84rem",
              textAlign: "left"
            }}
          >
            Ver perfil de voz completo →
          </button>
        </div>
      ) : null}
    </div>
  );
}
