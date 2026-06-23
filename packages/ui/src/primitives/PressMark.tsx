import { useId, type SVGProps } from "react";
import { cn } from "../lib/cn.js";
import {
  ECHO,
  GHOST,
  INK_DROP,
  RING_PATH,
  RING_STROKE,
  SHOW_RING,
  STROKE_BY_VARIANT,
  STROKE_WIDTH,
  type PressMarkVariant
} from "./press-mark-geometry.js";

export interface PressMarkProps extends SVGProps<SVGSVGElement> {
  readonly size?: number;
  /** compact ≤32px favicon/header · balanced default · bold hero/OG */
  readonly variant?: PressMarkVariant;
}

/**
 * Cultiv Press Mark — Mark of Authorship.
 * Geometric ring + flowing signature stroke: your voice leaves a mark.
 */
export function PressMark({
  size = 48,
  variant,
  className,
  ...props
}: PressMarkProps) {
  const effectiveVariant: PressMarkVariant =
    variant ?? (size <= 32 ? "compact" : size >= 52 ? "bold" : "balanced");

  const uid = useId().replace(/:/g, "");
  const paperFillId = `cultiv-paper-${uid}`;
  const dropFillId = `cultiv-drop-${uid}`;
  const ringShadowId = `cultiv-ring-shadow-${uid}`;
  const inkBleedId = `cultiv-ink-bleed-${uid}`;

  const stroke = STROKE_BY_VARIANT[effectiveVariant];
  const strokeWidth = STROKE_WIDTH[effectiveVariant];
  const ghost = GHOST[effectiveVariant];
  const drop = INK_DROP[effectiveVariant];
  const echo = ECHO[effectiveVariant];
  const showRing = SHOW_RING[effectiveVariant];
  const ringStroke = RING_STROKE[effectiveVariant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Cultiv"
      className={cn("shrink-0", className)}
      {...props}
    >
      <defs>
        <filter id={inkBleedId} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="2" result="noise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="0.6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <linearGradient id={paperFillId} x1="0.15" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="var(--color-paper-elevated)" />
          <stop offset="100%" stopColor="var(--color-paper-pressed)" />
        </linearGradient>
        <radialGradient id={dropFillId} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="var(--color-pigment-ochre)" />
          <stop offset="55%" stopColor="var(--color-pigment-terracotta)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--color-pigment-terracotta) 75%, var(--color-ink))" />
        </radialGradient>
        <filter id={ringShadowId} x="-12%" y="-12%" width="124%" height="130%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="var(--color-ink)" floodOpacity="0.07" />
        </filter>
      </defs>

      {showRing ? (
        <path
          d={RING_PATH}
          fill="none"
          stroke="var(--color-ink-ghost)"
          strokeWidth={ringStroke}
          opacity="0.5"
          filter={`url(#${ringShadowId})`}
        />
      ) : null}

      {echo ? (
        <path
          d={echo.path}
          fill="none"
          stroke="var(--color-pigment-ochre)"
          strokeWidth={echo.width}
          strokeLinecap="round"
          opacity={echo.opacity}
        />
      ) : null}

      <path
        d={stroke}
        fill="none"
        stroke="var(--color-pigment-terracotta)"
        strokeWidth={ghost.width}
        strokeLinecap="round"
        opacity={ghost.opacity}
        transform={`translate(${ghost.x} ${ghost.y})`}
      />

      <path
        d={stroke}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        filter={`url(#${inkBleedId})`}
      />

      <circle cx={drop.cx} cy={drop.cy} r={drop.halo} fill="var(--color-pigment-terracotta)" opacity="0.12" />
      <circle cx={drop.cx} cy={drop.cy} r={drop.r} fill={`url(#${dropFillId})`} />
      <ellipse
        cx={drop.cx - 1}
        cy={drop.cy - 1.2}
        rx={drop.r * 0.32}
        ry={drop.r * 0.25}
        fill="var(--color-paper-elevated)"
        opacity="0.3"
      />
    </svg>
  );
}
