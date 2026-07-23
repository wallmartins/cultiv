import { Chip, Mono, Ring } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

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
  const t = useMessages();
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
          <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{t.detail.voiceAlignment}</span>
        </span>
        <Mono style={{ color: "var(--muted)" }}>{open ? t.detail.bandClose : t.detail.bandOpen}</Mono>
      </button>
      {open ? (
        <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 14, borderTop: "1px solid var(--line)" }}>
          <div>
            <Mono
              as="div"
              style={{ textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--dim)", fontSize: 10, marginBottom: 8 }}
            >
              {t.detail.appliedTraits}
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
              {t.detail.respectedRules}
            </Mono>
            <div style={{ fontSize: "0.86rem", color: "var(--muted)", lineHeight: 1.6 }}>{rules.join(" · ")}</div>
          </div>
          <div>
            <Mono
              as="div"
              style={{ textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--dim)", fontSize: 10, marginBottom: 8 }}
            >
              {t.detail.antiPatterns}
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
            {t.detail.fullVoiceProfile}
          </button>
        </div>
      ) : null}
    </div>
  );
}
