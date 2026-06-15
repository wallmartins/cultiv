const METRIC_WIDTH = 220;

export interface PreviewMetricCardProps {
  readonly x: number;
  readonly y: number;
  readonly value: string;
  readonly caption: string;
  readonly accent?: "moss" | "golden";
}

export function PreviewMetricCard({ x, y, value, caption, accent = "moss" }: PreviewMetricCardProps) {
  const accentColor = accent === "golden" ? "var(--color-golden)" : "var(--color-moss)";

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={METRIC_WIDTH}
        height="72"
        fill="var(--color-surface)"
        stroke="var(--color-border-subtle)"
        strokeWidth="1"
      />
      <rect width="4" height="72" fill={accentColor} opacity="0.85" />
      <text x="18" y="30" fontFamily="var(--font-body)" fontSize="18" fontWeight="600" fill="var(--color-foreground)">
        {value}
      </text>
      <text x="18" y="52" fontFamily="var(--font-body)" fontSize="10" fill="var(--color-muted)">
        {caption}
      </text>
    </g>
  );
}

export interface PreviewMatchCardProps {
  readonly x: number;
  readonly y: number;
  readonly badge: string;
  readonly caption: string;
}

export function PreviewMatchCard({ x, y, badge, caption }: PreviewMatchCardProps) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={METRIC_WIDTH}
        height="72"
        fill="var(--color-surface)"
        stroke="var(--color-border-subtle)"
        strokeWidth="1"
      />
      <circle cx="22" cy="30" r="7" fill="var(--color-moss)" opacity="0.16" />
      <circle cx="22" cy="30" r="4" fill="var(--color-moss)" opacity="0.9" />
      <text x="38" y="34" fontFamily="var(--font-body)" fontSize="15" fontWeight="600" fill="var(--color-foreground)">
        {badge}
      </text>
      <text x="18" y="54" fontFamily="var(--font-body)" fontSize="10" fill="var(--color-muted)">
        {caption}
      </text>
    </g>
  );
}

export interface PreviewDraftPanelProps {
  readonly y: number;
  readonly label: string;
  readonly lines: readonly string[];
  readonly assurance: string;
}

export function PreviewDraftPanel({ y, label, lines, assurance }: PreviewDraftPanelProps) {
  return (
    <g transform={`translate(32 ${y})`}>
      <text
        x="0"
        y="0"
        fontFamily="var(--font-mono)"
        fontSize="9"
        fill="var(--color-muted)"
        letterSpacing="0.12em"
      >
        {label}
      </text>
      <rect
        y="12"
        width="456"
        height="132"
        fill="var(--color-surface)"
        stroke="var(--color-moss)"
        strokeWidth="1.1"
      />
      <rect y="12" width="4" height="132" fill="var(--color-golden)" opacity="0.9" />
      {lines.map((line, index) => (
        <text
          key={line}
          x="18"
          y={36 + index * 22}
          fontFamily="var(--font-body)"
          fontSize="11.5"
          fill={index === lines.length - 1 ? "var(--color-foreground)" : "var(--color-muted)"}
        >
          {line}
        </text>
      ))}
      <line x1="18" y1="108" x2="438" y2="108" stroke="var(--color-border-subtle)" strokeWidth="1" />
      <circle cx="26" cy="124" r="3.5" fill="var(--color-moss)" opacity="0.85" />
      <text x="38" y="128" fontFamily="var(--font-body)" fontSize="10" fill="var(--color-muted)">
        {assurance}
      </text>
    </g>
  );
}

export interface PreviewFormFooterProps {
  readonly footnote: string;
  readonly backAction: string;
  readonly confirmAction: string;
}

export function PreviewFormFooter({ footnote, backAction, confirmAction }: PreviewFormFooterProps) {
  return (
    <>
      <line x1="32" y1="392" x2="488" y2="392" stroke="var(--color-border-subtle)" strokeWidth="1" />
      <text
        x="260"
        y="414"
        textAnchor="middle"
        fontFamily="var(--font-body)"
        fontSize="10"
        fill="var(--color-muted)"
      >
        {footnote}
      </text>
      <rect x="32" y="428" width="112" height="36" fill="var(--color-surface)" stroke="var(--color-border-subtle)" strokeWidth="1" />
      <text
        x="88"
        y="451"
        textAnchor="middle"
        fontFamily="var(--font-body)"
        fontSize="11"
        fill="var(--color-muted)"
      >
        {backAction}
      </text>
      <rect x="292" y="428" width="196" height="36" fill="var(--color-rich-soil)" />
      <text
        x="390"
        y="451"
        textAnchor="middle"
        fontFamily="var(--font-body)"
        fontSize="11"
        fontWeight="600"
        fill="var(--color-surface-elevated)"
        letterSpacing="0.04em"
      >
        {confirmAction}
      </text>
      <path
        d="M468 444 L474 450 L468 456"
        stroke="var(--color-surface-elevated)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}
