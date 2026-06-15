import { cn, Text } from "@my-ai-orchestrator/ui";
import { useEffect, useId, useState } from "react";

export type VoiceConfidenceLevel = "none" | "low" | "medium" | "high";

const progressByLevel: Record<VoiceConfidenceLevel, number> = {
  none: 0.08,
  low: 0.33,
  medium: 0.66,
  high: 1
};

export interface VoiceConfidenceRingProps {
  readonly level: VoiceConfidenceLevel;
  readonly label: string;
  readonly description?: string;
  readonly className?: string;
}

export function VoiceConfidenceRing({ level, label, description, className }: VoiceConfidenceRingProps) {
  const labelId = useId();
  const gradientId = useId();
  const targetProgress = progressByLevel[level];
  const circumference = 2 * Math.PI * 42;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);

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
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative size-28 shrink-0" aria-labelledby={labelId}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-hidden>
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
              <stop offset="0%" stopColor="var(--color-moss)" />
              <stop offset="100%" stopColor="var(--color-golden)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="min-w-0">
        <Text id={labelId} as="p" variant="h2" className="mb-1">
          {label}
        </Text>
        {description ? (
          <Text variant="meta" className="text-muted-foreground">
            {description}
          </Text>
        ) : null}
      </div>
    </div>
  );
}

export function toVoiceConfidenceLevel(value: string | undefined): VoiceConfidenceLevel {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "none";
}
