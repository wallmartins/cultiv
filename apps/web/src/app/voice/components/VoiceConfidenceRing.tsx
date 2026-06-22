import { cn, Text } from "@my-ai-orchestrator/ui";
import { useEffect, useId, useState } from "react";

export type VoiceConfidenceLevel = "none" | "low" | "medium" | "high";

export const voiceConfidenceProgressByLevel: Record<VoiceConfidenceLevel, number> = {
  none: 0.08,
  low: 0.33,
  medium: 0.66,
  high: 1
};

const progressByLevel = voiceConfidenceProgressByLevel;

export interface VoiceConfidenceRingProps {
  readonly level: VoiceConfidenceLevel;
  readonly label: string;
  readonly description?: string;
  readonly className?: string;
  readonly size?: "default" | "compact" | "panel" | "hero";
  readonly hideLabel?: boolean;
  readonly centerLabel?: string;
}

const ringSizeClasses = {
  default: "size-28",
  compact: "size-16",
  panel: "size-24 sm:size-28",
  hero: "size-32 sm:size-40"
} as const;

const centerLabelClasses = {
  default: "text-base",
  compact: "text-xs",
  panel: "text-sm sm:text-base",
  hero: "text-base font-semibold sm:text-lg"
} as const;

export function VoiceConfidenceRing({
  level,
  label,
  description,
  className,
  size = "default",
  hideLabel = false,
  centerLabel
}: VoiceConfidenceRingProps) {
  const labelId = useId();
  const gradientId = useId();
  const targetProgress = progressByLevel[level];
  const circumference = 2 * Math.PI * 42;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);
  const showExternalLabel = !hideLabel && !centerLabel;
  const accessibleLabel = centerLabel ? `${centerLabel}. ${label}` : label;

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetOffset = circumference * (1 - targetProgress);

    if (reducedMotion) {
      setAnimatedOffset(targetOffset);
      return;
    }

    const frame = window.requestAnimationFrame(() => setAnimatedOffset(targetOffset));
    return () => window.cancelAnimationFrame(frame);
  }, [circumference, targetProgress]);

  return (
    <div
      className={cn(
        "flex items-center gap-5",
        size === "compact" && "gap-3",
        centerLabel && "shrink-0",
        className
      )}
    >
      <div
        className={cn("relative shrink-0", ringSizeClasses[size])}
        aria-labelledby={showExternalLabel ? labelId : undefined}
        aria-label={!showExternalLabel ? accessibleLabel : undefined}
        role={!showExternalLabel ? "img" : undefined}
      >
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="color-mix(in srgb, var(--color-soft-loam) 90%, transparent)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
            style={{
              transition: "stroke-dashoffset 600ms var(--workspace-motion-ease)"
            }}
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-pigment-terracotta)" />
              <stop offset="100%" stopColor="var(--color-pigment-ochre)" />
            </linearGradient>
          </defs>
        </svg>
        {centerLabel ? (
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center font-body font-semibold leading-none text-foreground",
              centerLabelClasses[size]
            )}
          >
            {centerLabel}
          </span>
        ) : null}
      </div>
      {showExternalLabel ? (
        <div className="min-w-0">
          <Text
            id={labelId}
            as="p"
            variant={size === "compact" ? "body" : "h2"}
            className={cn("mb-1", size === "compact" && "font-semibold")}
          >
            {label}
          </Text>
          {description ? (
            <Text variant="meta" className="text-muted-foreground">
              {description}
            </Text>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function toVoiceConfidenceLevel(value: string | undefined): VoiceConfidenceLevel {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "none";
}
