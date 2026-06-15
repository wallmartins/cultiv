import { cn } from "@my-ai-orchestrator/ui";

export interface BotanicalStemProps {
  readonly className?: string;
  readonly variant?: "default" | "hero";
}

export function BotanicalStem({ className, variant = "default" }: BotanicalStemProps) {
  if (variant === "hero") {
    return (
      <svg
        viewBox="0 0 320 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden
        preserveAspectRatio="xMinYMax meet"
      >
        <path
          data-draw-stroke
          d="M108 460 C98 412 112 364 100 316 C88 264 118 214 104 166 C92 122 110 78 100 32"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <path
          data-draw-stroke
          d="M104 280 C72 260 48 232 28 204 M106 214 C142 192 172 166 198 138 M100 150 C74 132 52 108 34 84 M98 98 C126 78 154 56 182 34 M102 360 C68 344 42 318 18 292"
          stroke="currentColor"
          strokeWidth="0.95"
          strokeLinecap="round"
          opacity="0.72"
        />
        <path
          data-draw-stroke
          d="M104 392 C138 376 168 348 192 318 M100 188 C132 170 160 146 186 118 M96 118 C118 102 138 82 158 62"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="28" cy="204" r="2.6" fill="currentColor" opacity="0.85" />
        <circle cx="198" cy="138" r="2.2" fill="currentColor" opacity="0.75" />
        <circle cx="34" cy="84" r="2" fill="currentColor" opacity="0.7" />
        <circle cx="182" cy="34" r="1.8" fill="currentColor" opacity="0.65" />
        <circle cx="18" cy="292" r="2.2" fill="currentColor" opacity="0.6" />
        <circle cx="192" cy="318" r="1.8" fill="currentColor" opacity="0.55" />
        <circle cx="186" cy="118" r="1.6" fill="currentColor" opacity="0.5" />
        <path
          d="M28 204 L18 198 M198 138 L208 132 M34 84 L24 78 M182 34 L192 28"
          stroke="currentColor"
          strokeWidth="0.55"
          opacity="0.4"
        />
        <path
          data-botanical-upright
          d="M100 32 C92 18 84 8 74 2 C84 6 92 14 100 24 C108 14 116 6 126 2 C116 8 108 18 100 32 Z"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.92"
          style={{ transformOrigin: "100px 32px" }}
        />
        <path
          data-botanical-upright
          d="M182 34 C176 24 178 16 184 8 C190 16 192 24 186 34 C180 38 176 38 182 34 Z"
          stroke="currentColor"
          strokeWidth="0.9"
          fill="none"
          opacity="0.78"
          style={{ transformOrigin: "184px 20px" }}
        />
        <path
          data-botanical-upright
          d="M158 62 C154 54 156 46 162 40 C168 46 170 54 164 62 C158 66 154 66 158 62 Z"
          stroke="currentColor"
          strokeWidth="0.8"
          fill="none"
          opacity="0.65"
          style={{ transformOrigin: "162px 50px" }}
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 120 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden
    >
      <path
        data-draw-stroke
        d="M58 300 C52 268 61 238 54 206 C47 172 63 142 56 110 C50 82 58 52 52 24"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        data-draw-stroke
        d="M56 180 C38 168 28 152 18 138 M56 140 C72 128 86 114 98 98 M54 88 C40 78 30 64 22 50"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.65"
      />
      <circle cx="18" cy="138" r="2.5" fill="currentColor" opacity="0.9" />
      <circle cx="98" cy="98" r="2" fill="currentColor" opacity="0.75" />
      <circle cx="22" cy="50" r="1.8" fill="currentColor" opacity="0.7" />
      <path
        d="M18 138 L12 134 M98 98 L104 94"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.5"
      />
      <path
        data-botanical-upright
        d="M52 24 C48 14 44 8 40 4 C46 6 50 10 54 16 C58 10 62 6 68 4 C64 8 60 14 56 24 Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.9"
        style={{ transformOrigin: "52px 24px" }}
      />
    </svg>
  );
}
