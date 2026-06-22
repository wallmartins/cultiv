import type { SVGProps } from "react";
import { cn } from "../lib/cn.js";

export interface PressMarkProps extends SVGProps<SVGSVGElement> {
  readonly size?: number;
}

export function PressMark({ size = 48, className, ...props }: PressMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Cultiv"
      className={cn("press-edge", className)}
      {...props}
    >
      <path
        d="M4 6 L44 5 L46 43 L5 44 Z"
        fill="var(--color-paper-elevated)"
        stroke="var(--color-ink-ghost)"
        strokeWidth="0.5"
      />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fontFamily="var(--font-conducao)"
        fontSize="22"
        fontWeight="600"
        fill="var(--color-ink)"
      >
        C
      </text>
    </svg>
  );
}
