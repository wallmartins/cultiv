import { cn } from "@my-ai-orchestrator/ui";
import type { LocaleMessages } from "~/i18n/marketing/types";

export interface TeachVoiceSceneProps {
  readonly className?: string;
  readonly copy: LocaleMessages["scenes"]["teachVoice"];
  readonly size?: "default" | "large";
}

const exampleLayouts = [
  { x: 56, y: 64, width: 196, height: 88, opacity: 1 },
  { x: 276, y: 40, width: 204, height: 88, opacity: 0.92 },
  { x: 104, y: 268, width: 212, height: 88, opacity: 0.85 }
] as const;

export function TeachVoiceScene({ className, copy, size = "large" }: TeachVoiceSceneProps) {
  return (
    <svg
      viewBox="0 0 520 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "h-auto w-full text-ink",
        size === "large" ? "max-w-[min(40rem,100%)]" : "max-w-[min(28rem,100%)]",
        className
      )}
      aria-hidden
    >
      <circle cx="260" cy="200" r="72" stroke="var(--color-ink-ghost)" strokeWidth="1" strokeDasharray="4 6" opacity="0.6" />
      <circle cx="260" cy="200" r="10" fill="var(--color-pigment-terracotta)" opacity="0.35" />
      <text x="260" y="205" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--color-pigment-terracotta)">
        {copy.centerLabel}
      </text>
      {copy.examples.map((example, index) => {
        const layout = exampleLayouts[index];

        return (
          <g
            key={example.title}
            transform={`translate(${layout.x} ${layout.y})`}
            opacity={layout.opacity}
          >
            <rect
              width={layout.width}
              height={layout.height}
              fill="var(--color-paper-elevated)"
              stroke="currentColor"
              strokeWidth="1"
            />
            <text x="14" y="28" fontFamily="var(--font-mono)" fontSize="10" fill="var(--color-pigment-terracotta)">
              [{String(index + 1).padStart(2, "0")}]
            </text>
            <text x="14" y="52" fontFamily="var(--font-body)" fontSize="14" fill="currentColor">
              {example.title}
            </text>
            <text x="14" y="72" fontFamily="var(--font-body)" fontSize="11" fill="var(--color-ink-muted)">
              {example.meta}
            </text>
          </g>
        );
      })}
      <path d="M148 168 Q204 188 236 144" stroke="var(--color-pigment-terracotta)" strokeWidth="0.75" opacity="0.35" />
      <path d="M324 144 Q280 184 260 200" stroke="var(--color-pigment-terracotta)" strokeWidth="0.75" opacity="0.35" />
      <path d="M188 304 Q216 248 260 210" stroke="var(--color-pigment-terracotta)" strokeWidth="0.75" opacity="0.35" />
    </svg>
  );
}
