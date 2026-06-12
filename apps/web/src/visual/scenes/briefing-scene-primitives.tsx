import type { ReactNode } from "react";

const FORM_WIDTH = 456;

export interface BriefingWindowChromeProps {
  readonly sceneId: string;
  readonly productLabel: string;
  readonly breadcrumb: string;
  readonly screenTitle: string;
  readonly stepIndicator: string;
  readonly children: ReactNode;
}

export function BriefingWindowChrome({
  sceneId,
  productLabel,
  breadcrumb,
  screenTitle,
  stepIndicator,
  children
}: BriefingWindowChromeProps) {
  const shadowId = `${sceneId}-ui-shadow`;
  const headerId = `${sceneId}-ui-header`;

  return (
    <>
      <defs>
        <filter id={shadowId} x="-8%" y="-6%" width="116%" height="118%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="var(--color-rich-soil)" floodOpacity="0.1" />
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--color-rich-soil)" floodOpacity="0.06" />
        </filter>
        <linearGradient id={headerId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-surface)" />
          <stop offset="100%" stopColor="var(--color-surface-elevated)" />
        </linearGradient>
      </defs>
      <rect
        width="520"
        height="480"
        fill="var(--color-surface-elevated)"
        stroke="var(--color-border-subtle)"
        strokeWidth="1"
        filter={`url(#${shadowId})`}
      />
      <rect width="520" height="56" fill={`url(#${headerId})`} />
      <line x1="0" y1="56" x2="520" y2="56" stroke="var(--color-border-subtle)" strokeWidth="1" />
      <circle cx="28" cy="28" r="7" fill="var(--color-moss)" opacity="0.18" />
      <circle cx="28" cy="28" r="3.5" fill="var(--color-moss)" />
      <text x="44" y="33" fontFamily="var(--font-body)" fontSize="12" fontWeight="600" fill="var(--color-foreground)">
        {productLabel}
      </text>
      <text x="100" y="33" fontFamily="var(--font-body)" fontSize="11">
        <tspan fill="var(--color-muted)">{breadcrumb}</tspan>
        <tspan dx="6" fill="var(--color-ghost)">
          /
        </tspan>
        <tspan dx="6" fill="var(--color-foreground)">
          {screenTitle}
        </tspan>
      </text>
      <rect x="418" y="18" width="82" height="24" fill="var(--color-surface)" stroke="var(--color-border-subtle)" strokeWidth="1" />
      <text
        x="459"
        y="34"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="9"
        fill="var(--color-muted)"
        letterSpacing="0.08em"
      >
        {stepIndicator}
      </text>
      {children}
    </>
  );
}

export interface BriefingStatusStripProps {
  readonly draftSaved: string;
  readonly progress: number;
}

export function BriefingStatusStrip({ draftSaved, progress }: BriefingStatusStripProps) {
  const barWidth = Math.round((FORM_WIDTH - 32) * progress);

  return (
    <g transform="translate(32 68)">
      <circle cx="6" cy="6" r="4" fill="var(--color-moss)" opacity="0.85" />
      <path
        d="M3.5 6 L5.2 7.6 L8.8 4.2"
        stroke="var(--color-surface-elevated)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="18" y="10" fontFamily="var(--font-body)" fontSize="10" fill="var(--color-muted)">
        {draftSaved}
      </text>
      <rect x="0" y="22" width={FORM_WIDTH - 32} height="3" fill="var(--color-ghost)" opacity="0.55" />
      <rect x="0" y="22" width={barWidth} height="3" fill="var(--color-moss)" opacity="0.75" />
    </g>
  );
}

export interface BriefingFieldLabelProps {
  readonly y: number;
  readonly label: string;
}

export function BriefingFieldLabel({ y, label }: BriefingFieldLabelProps) {
  return (
    <text
      x="32"
      y={y}
      fontFamily="var(--font-mono)"
      fontSize="9"
      fill="var(--color-muted)"
      letterSpacing="0.12em"
    >
      {label}
    </text>
  );
}

export interface BriefingSelectFieldProps {
  readonly y: number;
  readonly value: string;
}

export function BriefingSelectField({ y, value }: BriefingSelectFieldProps) {
  return (
    <g transform={`translate(32 ${y})`}>
      <rect
        width={FORM_WIDTH}
        height="40"
        fill="var(--color-surface)"
        stroke="var(--color-border-subtle)"
        strokeWidth="1"
      />
      <text x="14" y="25" fontFamily="var(--font-body)" fontSize="13" fill="var(--color-foreground)">
        {value}
      </text>
      <path
        d="M434 18 L440 24 L446 18"
        stroke="var(--color-muted)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export interface BriefingInputFieldProps {
  readonly y: number;
  readonly value: string;
}

export function BriefingInputField({ y, value }: BriefingInputFieldProps) {
  return (
    <g transform={`translate(32 ${y})`}>
      <rect
        width={FORM_WIDTH}
        height="40"
        fill="var(--color-surface)"
        stroke="var(--color-border-subtle)"
        strokeWidth="1"
      />
      <text x="14" y="25" fontFamily="var(--font-body)" fontSize="13" fill="var(--color-foreground)">
        {value}
      </text>
    </g>
  );
}

export interface BriefingChipGroupProps {
  readonly y: number;
  readonly chips: readonly string[];
  readonly addLabel: string;
}

export function BriefingChipGroup({ y, chips, addLabel }: BriefingChipGroupProps) {
  let offsetX = 0;

  return (
    <g transform={`translate(32 ${y})`}>
      {chips.map((chip) => {
        const chipWidth = Math.max(72, chip.length * 7 + 34);
        const group = (
          <g key={chip} transform={`translate(${offsetX} 0)`}>
            <rect width={chipWidth} height="30" fill="var(--color-moss)" opacity="0.08" />
            <rect
              width={chipWidth}
              height="30"
              fill="none"
              stroke="var(--color-moss)"
              strokeWidth="1"
              opacity="0.28"
            />
            <text x="12" y="19" fontFamily="var(--font-body)" fontSize="11" fill="var(--color-foreground)">
              {chip}
            </text>
            <text x={chipWidth - 14} y="17" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fill="var(--color-muted)">
              ×
            </text>
          </g>
        );
        offsetX += chipWidth + 8;

        return group;
      })}
      <g transform={`translate(${offsetX} 0)`}>
        <rect
          width="96"
          height="30"
          fill="transparent"
          stroke="var(--color-border-subtle)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <text x="48" y="19" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--color-muted)">
          {addLabel}
        </text>
      </g>
    </g>
  );
}

export interface BriefingTextareaFieldProps {
  readonly y: number;
  readonly value: string;
  readonly helper: string;
}

export function BriefingTextareaField({ y, value, helper }: BriefingTextareaFieldProps) {
  return (
    <g transform={`translate(32 ${y})`}>
      <rect width="4" height="72" fill="var(--color-golden)" opacity="0.9" />
      <rect
        x="4"
        width={FORM_WIDTH - 4}
        height="72"
        fill="var(--color-surface)"
        stroke="var(--color-moss)"
        strokeWidth="1.25"
      />
      <text x="18" y="28" fontFamily="var(--font-body)" fontSize="13" fill="var(--color-foreground)">
        {value}
      </text>
      <line x1="18" y1="40" x2="318" y2="40" stroke="var(--color-foreground)" strokeWidth="1.2" opacity="0.85" />
      <text x="18" y="60" fontFamily="var(--font-body)" fontSize="9.5" fill="var(--color-muted)">
        {helper}
      </text>
    </g>
  );
}

export interface BriefingFormFooterProps {
  readonly voiceStatus: string;
  readonly actionLabel: string;
}

export function BriefingFormFooter({ voiceStatus, actionLabel }: BriefingFormFooterProps) {
  return (
    <>
      <line x1="32" y1="408" x2="488" y2="408" stroke="var(--color-border-subtle)" strokeWidth="1" />
      <circle cx="44" cy="434" r="4" fill="var(--color-moss)" opacity="0.85" />
      <circle cx="44" cy="434" r="7" fill="var(--color-moss)" opacity="0.14" />
      <text x="58" y="438" fontFamily="var(--font-body)" fontSize="11" fill="var(--color-muted)">
        {voiceStatus}
      </text>
      <rect x="332" y="416" width="156" height="40" fill="var(--color-rich-soil)" />
      <text
        x="410"
        y="441"
        textAnchor="middle"
        fontFamily="var(--font-body)"
        fontSize="11"
        fontWeight="600"
        fill="var(--color-surface-elevated)"
        letterSpacing="0.06em"
      >
        {actionLabel}
      </text>
      <path
        d="M462 432 L468 438 L462 444"
        stroke="var(--color-surface-elevated)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}
