import { Chip, Pill, c, f, accentA, inkA } from "../primitives";

export function LongHistoryRail() {
  return (
    <div
      data-screen-label="2f Histórico longo"
      style={{
        width: 560,
        background: c.frame,
        color: c.ink,
        fontFamily: f.body,
        padding: 24,
        boxSizing: "border-box",
        display: "flex",
        gap: 24
      }}
    >
      {/* Rail — 247 gerações */}
      <div style={{ width: 240, flex: "none", display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          style={{
            fontFamily: f.mono,
            fontSize: 10,
            letterSpacing: "0.1em",
            color: c.dim,
            textTransform: "uppercase",
            padding: "0 6px 8px"
          }}
        >
          rail · 247 gerações
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 10px",
            border: `1px solid ${c.line2}`,
            borderRadius: 8,
            color: c.dim,
            fontSize: "0.8rem",
            marginBottom: 8
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              border: `1.5px solid ${c.dim}`,
              borderRadius: 999,
              flex: "none"
            }}
          />
          buscar por tema…
        </div>

        <div
          style={{
            fontFamily: f.mono,
            fontSize: 10.5,
            letterSpacing: "0.14em",
            color: c.dim,
            textTransform: "uppercase",
            padding: "6px 6px 5px"
          }}
        >
          Este mês
        </div>
        <div style={{ padding: "8px 10px", borderRadius: 12, fontSize: "0.855rem", color: inkA(0.8) }}>
          O que aprendi migrando pra pnpm
        </div>
        <div style={{ padding: "8px 10px", borderRadius: 12, fontSize: "0.855rem", color: inkA(0.8) }}>
          Newsletter: edição sobre foco
        </div>

        <div
          style={{
            fontFamily: f.mono,
            fontSize: 10.5,
            letterSpacing: "0.14em",
            color: c.dim,
            textTransform: "uppercase",
            padding: "10px 6px 5px"
          }}
        >
          Junho
        </div>
        <div style={{ padding: "8px 10px", borderRadius: 12, fontSize: "0.855rem", color: inkA(0.8) }}>
          Documentação viva vs. wiki morta
        </div>
        <div style={{ padding: "8px 10px", borderRadius: 12, fontSize: "0.855rem", color: inkA(0.8) }}>
          O mito do dev 10x
        </div>

        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            border: `1px solid ${c.line2}`,
            borderRadius: 100,
            padding: "8px 14px",
            cursor: "pointer",
            fontFamily: f.mono,
            fontSize: 10.5,
            letterSpacing: "0.07em",
            color: c.muted
          }}
        >
          mostrar mais antigos · 233 <span style={{ transform: "rotate(90deg)" }}>→</span>
        </div>
      </div>

      {/* Painel — busca vazia + filtro ativo */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          borderLeft: `1px solid ${c.line2}`,
          paddingLeft: 24
        }}
      >
        <div
          style={{
            fontFamily: f.mono,
            fontSize: 10,
            letterSpacing: "0.1em",
            color: c.dim,
            textTransform: "uppercase"
          }}
        >
          busca vazia + filtro ativo
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 10px",
            border: `1px solid ${accentA(0.5)}`,
            borderRadius: 8,
            fontSize: "0.8rem"
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              border: `1.5px solid ${c.muted}`,
              borderRadius: 999,
              flex: "none"
            }}
          />
          roadmap
        </div>

        <div style={{ display: "flex", gap: 5 }}>
          <Chip tone="accent" mono>
            falhas
          </Chip>
        </div>

        <div style={{ padding: "14px 4px", display: "flex", flexDirection: "column", gap: 10 }}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke={c.line2}
              strokeWidth="2.5"
              strokeDasharray="4 7"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ fontSize: "0.84rem", color: c.muted, lineHeight: 1.6 }}>
            Nada com "roadmap" entre as <span style={{ color: c.ink }}>falhas</span> — mas existem{" "}
            <span style={{ color: c.accent }}>3 resultados</span> nos outros status.
          </div>
          <Pill
            variant="secondary"
            style={{
              borderColor: c.accent,
              color: c.accent,
              padding: "7px 14px",
              fontSize: "0.8rem",
              alignSelf: "flex-start"
            }}
          >
            Limpar filtro e mostrar os 3 →
          </Pill>
        </div>
      </div>
    </div>
  );
}
