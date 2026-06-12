import type { ReactNode } from "react";

export interface ChatWindowChromeProps {
  readonly title: string;
  readonly height?: number;
  readonly children: ReactNode;
}

export function ChatWindowChrome({ title, height = 400, children }: ChatWindowChromeProps) {
  return (
    <>
      <rect
        x="0"
        y="0"
        width="480"
        height={height}
        fill="var(--color-surface-elevated)"
        stroke="currentColor"
        strokeWidth="1"
      />
      <rect x="0" y="0" width="480" height="48" fill="var(--color-surface)" stroke="currentColor" strokeWidth="1" />
      <circle cx="20" cy="24" r="4.5" fill="var(--color-ghost)" />
      <circle cx="34" cy="24" r="4.5" fill="var(--color-ghost)" opacity="0.85" />
      <circle cx="48" cy="24" r="4.5" fill="var(--color-ghost)" opacity="0.7" />
      <text
        x="68"
        y="30"
        fontFamily="var(--font-body)"
        fontSize="12"
        fontWeight="500"
        fill="var(--color-foreground)"
      >
        {title}
      </text>
      <line x1="0" y1="48" x2="480" y2="48" stroke="var(--color-border-subtle)" strokeWidth="1" />
      {children}
    </>
  );
}

export interface AssistantMessageBubbleProps {
  readonly y: number;
  readonly assistantName: string;
  readonly line: string;
}

export function AssistantMessageBubble({ y, assistantName, line }: AssistantMessageBubbleProps) {
  return (
    <g>
      <circle cx="36" cy={y + 20} r="14" fill="var(--color-moss)" opacity="0.18" />
      <text
        x="36"
        y={y + 24}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="8"
        fontWeight="500"
        fill="var(--color-moss)"
      >
        {assistantName}
      </text>
      <rect
        x="60"
        y={y}
        width="396"
        height="56"
        fill="var(--color-surface)"
        stroke="var(--color-border-subtle)"
        strokeWidth="1"
      />
      <text
        x="76"
        y={y + 22}
        fontFamily="var(--font-body)"
        fontSize="11"
        fill="var(--color-muted)"
        fontStyle="italic"
      >
        {line}
      </text>
      <rect x="76" y={y + 32} width="220" height="5" fill="var(--color-ghost)" opacity="0.9" />
      <rect x="76" y={y + 42} width="160" height="5" fill="var(--color-ghost)" opacity="0.55" />
    </g>
  );
}
