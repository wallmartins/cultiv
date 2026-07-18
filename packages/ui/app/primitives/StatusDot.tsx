import type { ComponentPropsWithoutRef } from "react";

export type StatusDotTone = "live" | "accent" | "neutral" | "warning" | "danger";

export interface StatusDotProps {
  tone?: StatusDotTone;
  size?: number;
  pulse?: boolean;
  className?: string;
  style?: ComponentPropsWithoutRef<"span">["style"];
}

export function StatusDot({ tone = "neutral", size, pulse = false, className, style }: StatusDotProps) {
  const classes = ["status-dot", `is-${tone}`, pulse && tone !== "live" && "is-pulse", className]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      className={classes}
      style={{
        ...(size !== undefined ? { width: size, height: size } : {}),
        ...style
      }}
    />
  );
}
