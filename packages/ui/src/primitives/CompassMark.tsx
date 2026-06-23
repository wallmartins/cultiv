import type { HTMLAttributes, SVGProps } from "react";
import { cn } from "../lib/cn.js";
import {
  CARDINAL_ORDER,
  CARDINAL_PATHS,
  CENTER_CROSS,
  CENTER_RING,
  COLOR_VALUES,
  RING_PATH,
  RING_STROKE_WIDTH,
  STROKE_WIDTH,
  VIEWBOX,
  type CompassMarkColor,
  type CompassMarkVariant
} from "./compass-mark-geometry.js";

export interface CompassMarkProps extends Omit<HTMLAttributes<HTMLElement>, "color"> {
  readonly size?: number;
  readonly variant?: CompassMarkVariant;
  readonly color?: CompassMarkColor;
  readonly animate?: boolean;
}

function CompassSymbol({
  size,
  color,
  className,
  animate,
  ...props
}: {
  readonly size: number;
  readonly color: CompassMarkColor;
  readonly className?: string;
  readonly animate?: boolean;
} & SVGProps<SVGSVGElement>) {
  const stroke = COLOR_VALUES[color];

  return (
    <svg
      width={size}
      height={size}
      viewBox={VIEWBOX}
      data-compass-color={color}
      data-animate-breath={animate ? "true" : undefined}
      className={cn("shrink-0", className)}
      {...props}
    >
      <circle
        cx={32}
        cy={32}
        r={22}
        fill="none"
        stroke={stroke}
        strokeWidth={RING_STROKE_WIDTH}
        opacity={0.35}
      />
      <path d={RING_PATH} fill="none" stroke={stroke} strokeWidth={RING_STROKE_WIDTH} />

      {CARDINAL_ORDER.map((direction) => (
        <path
          key={direction}
          d={CARDINAL_PATHS[direction]}
          data-cardinal={direction}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
      ))}

      <path
        d={CENTER_RING}
        fill="none"
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <path
        d={CENTER_CROSS}
        fill="none"
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Cultiv Compass Mark — signature cartography logo.
 * Pen-stroke cardinals on a modernist ring; wordmark stays quiet.
 */
export function CompassMark({
  size = 48,
  variant = "symbol",
  color = "deep-blue",
  className,
  animate = false,
  ...props
}: CompassMarkProps) {
  if (variant === "symbol") {
    return (
      <CompassSymbol
        size={size}
        color={color}
        animate={animate}
        className={className}
        role="img"
        aria-label="Cultiv"
        {...props}
      />
    );
  }

  const isHorizontal = variant === "horizontal";
  const wordmarkSize = Math.max(14, Math.round(size * 0.55));

  return (
    <span
      role="img"
      aria-label="Cultiv"
      data-compass-color={color}
      data-animate-breath={animate ? "true" : undefined}
      className={cn(
        "inline-flex items-center",
        isHorizontal ? "flex-row gap-2.5" : "flex-col gap-1.5",
        className
      )}
      {...props}
    >
      <CompassSymbol size={size} color={color} aria-hidden="true" />
      <span
        className="ui-type-autoridade leading-none tracking-tight"
        style={{ fontSize: wordmarkSize, color: COLOR_VALUES[color] }}
      >
        Cultiv
      </span>
    </span>
  );
}
