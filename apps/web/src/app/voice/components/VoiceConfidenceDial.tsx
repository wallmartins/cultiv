import { cn, Text } from "@my-ai-orchestrator/ui";
import { useEffect, useId, useState } from "react";
import {
  voiceConfidenceProgressByLevel,
  type VoiceConfidenceLevel
} from "~/app/voice/components/VoiceConfidenceRing";

const DIAL_RADIUS = 42;
const TICK_COUNT = 48;
const TICK_INNER_RADIUS = 37.5;
const TICK_OUTER_RADIUS = 40.5;
const CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

export interface VoiceConfidenceDialProps {
  readonly level: VoiceConfidenceLevel;
  readonly centerLabel: string;
  readonly accessibleLabel: string;
  readonly className?: string;
}

function progressToPoint(progress: number): { readonly cx: number; readonly cy: number } {
  const angle = -Math.PI / 2 + progress * 2 * Math.PI;

  return {
    cx: 50 + DIAL_RADIUS * Math.cos(angle),
    cy: 50 + DIAL_RADIUS * Math.sin(angle)
  };
}

export function VoiceConfidenceDial({
  level,
  centerLabel,
  accessibleLabel,
  className
}: VoiceConfidenceDialProps) {
  const gradientId = useId();
  const targetProgress = voiceConfidenceProgressByLevel[level];
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const strokeOffset = CIRCUMFERENCE * (1 - animatedProgress);
  const dot = progressToPoint(animatedProgress);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setAnimatedProgress(targetProgress);
      return;
    }

    const frame = window.requestAnimationFrame(() => setAnimatedProgress(targetProgress));
    return () => window.cancelAnimationFrame(frame);
  }, [targetProgress]);

  return (
    <div
      className={cn("relative size-36 sm:size-44", className)}
      role="img"
      aria-label={accessibleLabel}
    >
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r="33"
          fill="none"
          stroke="color-mix(in srgb, var(--color-paper-pressed) 85%, transparent)"
          strokeWidth="0.75"
        />
        {Array.from({ length: TICK_COUNT }, (_, index) => {
          const tickProgress = (index + 0.5) / TICK_COUNT;
          const angle = tickProgress * 2 * Math.PI - Math.PI / 2;
          const x1 = 50 + TICK_INNER_RADIUS * Math.cos(angle);
          const y1 = 50 + TICK_INNER_RADIUS * Math.sin(angle);
          const x2 = 50 + TICK_OUTER_RADIUS * Math.cos(angle);
          const y2 = 50 + TICK_OUTER_RADIUS * Math.sin(angle);
          const active = tickProgress <= animatedProgress;

          return (
            <line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={
                active
                  ? "color-mix(in srgb, var(--color-pigment-terracotta) 72%, transparent)"
                  : "color-mix(in srgb, var(--color-paper-pressed) 95%, transparent)"
              }
              strokeWidth={active ? 1.1 : 0.85}
              strokeLinecap="round"
            />
          );
        })}
        <circle
          cx="50"
          cy="50"
          r={DIAL_RADIUS}
          fill="none"
          stroke="color-mix(in srgb, var(--color-paper-pressed) 90%, transparent)"
          strokeWidth="5"
        />
        <g transform="rotate(-90 50 50)">
          <circle
            cx="50"
            cy="50"
            r={DIAL_RADIUS}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            style={{
              transition: "stroke-dashoffset 700ms var(--workspace-motion-ease, ease)"
            }}
          />
        </g>
        <circle
          cx={dot.cx}
          cy={dot.cy}
          r="3.25"
          fill="var(--color-pigment-ochre)"
          stroke="var(--color-paper-elevated)"
          strokeWidth="1.5"
          style={{
            transition: "cx 700ms var(--workspace-motion-ease, ease), cy 700ms var(--workspace-motion-ease, ease)"
          }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-pigment-terracotta)" />
            <stop offset="100%" stopColor="var(--color-pigment-ochre)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
        <Text
          variant="meta"
          className="max-w-[5.75rem] text-[0.625rem] font-semibold uppercase leading-snug tracking-editorial-wide text-pigment-terracotta text-balance sm:max-w-[6.5rem] sm:text-[0.6875rem]"
        >
          {centerLabel}
        </Text>
      </div>
    </div>
  );
}
