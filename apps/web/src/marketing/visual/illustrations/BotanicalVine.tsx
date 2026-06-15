import { cn } from "@my-ai-orchestrator/ui";

export const TYPOGRAPHIC_VINE_VIEWBOX = { width: 520, height: 240 } as const;

/** Branch tips where typographic labels attach (viewBox coordinates). */
export const TYPOGRAPHIC_VINE_ANCHORS = [
  { x: 94, y: 128, variant: "display" as const },
  { x: 276, y: 44, variant: "handwritten" as const },
  { x: 426, y: 10, variant: "display" as const }
] as const;

export interface BotanicalVineProps {
  readonly className?: string;
  readonly variant?: "default" | "typographic";
}

export function BotanicalVine({ className, variant = "default" }: BotanicalVineProps) {
  if (variant === "typographic") {
    return (
      <svg
        viewBox={`0 0 ${TYPOGRAPHIC_VINE_VIEWBOX.width} ${TYPOGRAPHIC_VINE_VIEWBOX.height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden
      >
        <path
          data-draw-stroke
          d="M32 232 C24 236 14 232 8 222 M32 232 C42 226 48 216 52 204"
          stroke="currentColor"
          strokeWidth="0.85"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          data-draw-stroke
          d="M32 232 C58 212 82 188 104 168 C148 132 212 98 292 68 C368 40 438 24 504 12"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.88"
        />
        <path
          data-draw-stroke
          d="M104 168 C92 152 86 136 94 128 M292 68 C282 58 278 48 276 44 M438 24 C430 18 428 12 426 10"
          stroke="currentColor"
          strokeWidth="0.95"
          strokeLinecap="round"
          opacity="0.72"
        />
        <circle cx="8" cy="222" r="2" fill="currentColor" opacity="0.55" />
        <circle cx="104" cy="168" r="2.4" fill="currentColor" opacity="0.8" />
        <circle cx="292" cy="68" r="2.2" fill="currentColor" opacity="0.75" />
        <circle cx="438" cy="24" r="1.8" fill="currentColor" opacity="0.7" />
        <path
          d="M104 168 L98 164 M292 68 L286 64 M438 24 L432 20"
          stroke="currentColor"
          strokeWidth="0.55"
          opacity="0.4"
        />
        <path
          data-botanical-upright
          d="M94 128 C90 120 92 114 98 108 C104 114 106 120 102 128 C98 132 94 132 94 128 Z"
          stroke="currentColor"
          strokeWidth="0.85"
          fill="none"
          opacity="0.85"
          style={{ transformOrigin: "98px 118px" }}
        />
        <path
          data-botanical-upright
          d="M276 44 C272 36 274 30 280 24 C286 30 288 36 282 44 C276 48 272 48 276 44 Z"
          stroke="currentColor"
          strokeWidth="0.8"
          fill="none"
          opacity="0.75"
          style={{ transformOrigin: "280px 34px" }}
        />
        <path
          data-botanical-upright
          d="M426 10 C422 4 424 0 430 4 C436 0 438 4 432 10 C426 14 422 14 426 10 Z"
          stroke="currentColor"
          strokeWidth="0.75"
          fill="none"
          opacity="0.7"
          style={{ transformOrigin: "430px 6px" }}
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 400 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden
    >
      <path
        data-draw-stroke
        d="M8 88 C60 82 110 68 160 58 C210 48 260 38 310 28 C340 22 368 16 392 10"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        data-draw-stroke
        d="M160 58 C158 42 162 28 168 14 M260 38 C262 24 258 12 252 2"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="168" cy="14" r="2" fill="currentColor" />
      <circle cx="252" cy="2" r="1.6" fill="currentColor" opacity="0.8" />
    </svg>
  );
}
