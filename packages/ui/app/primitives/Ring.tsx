import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type RingTone = "accent" | "warning" | "danger";

export interface RingProps {
  value: number;
  size?: number;
  width?: number;
  tone?: RingTone;
  pulse?: boolean;
  className?: string;
  style?: ComponentPropsWithoutRef<"div">["style"];
  children?: ReactNode;
}

const TONE_VAR: Record<RingTone, string> = {
  accent: "var(--accent)",
  warning: "var(--warning)",
  danger: "var(--danger)"
};

export function Ring({
  value,
  size = 48,
  width = 3,
  tone = "accent",
  pulse = false,
  className,
  style,
  children
}: RingProps) {
  const r = (size - width) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(1, value)));

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        animation: pulse ? "breathe 1.6s var(--ease-standard) infinite" : undefined,
        ...style
      }}
    >
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={width} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE_VAR[tone]}
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {children}
    </div>
  );
}
