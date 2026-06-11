import { cn } from "@my-ai-orchestrator/ui";

export interface BotanicalTreeProps {
  readonly className?: string;
}

export function BotanicalTree({ className }: BotanicalTreeProps) {
  return (
    <svg
      viewBox="0 0 360 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden
      preserveAspectRatio="xMidYMax meet"
    >
      <path
        data-draw-stroke
        d="M180 500 C174 440 186 382 180 324 C174 266 184 208 178 150 C172 102 176 54 172 16"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
      <path
        data-draw-stroke
        d="M180 360 C132 338 92 308 58 272 M180 360 C228 338 268 308 302 272 M178 280 C146 262 118 238 94 212 M182 280 C214 262 242 238 266 212 M176 204 C150 186 128 164 108 142 M184 204 C210 186 232 164 252 142 M174 128 C154 112 136 92 122 74 M186 128 C206 112 224 92 238 74"
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinecap="round"
        opacity="0.72"
      />
      <path
        data-draw-stroke
        d="M180 420 C210 404 236 382 258 356 M180 420 C150 404 124 382 102 356"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="58" cy="272" r="2.4" fill="currentColor" opacity="0.75" />
      <circle cx="302" cy="272" r="2.4" fill="currentColor" opacity="0.75" />
      <circle cx="94" cy="212" r="2" fill="currentColor" opacity="0.65" />
      <circle cx="266" cy="212" r="2" fill="currentColor" opacity="0.65" />
      <circle cx="108" cy="142" r="1.8" fill="currentColor" opacity="0.55" />
      <circle cx="252" cy="142" r="1.8" fill="currentColor" opacity="0.55" />
      <circle cx="122" cy="74" r="1.6" fill="currentColor" opacity="0.45" />
      <circle cx="238" cy="74" r="1.6" fill="currentColor" opacity="0.45" />
      <path
        data-botanical-upright
        d="M172 16 C164 6 156 0 146 4 C156 8 164 14 172 24 C180 14 188 8 198 4 C188 0 180 6 172 16 Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.9"
        style={{ transformOrigin: "172px 16px" }}
      />
      <path
        data-botanical-upright
        d="M122 74 C118 66 120 58 126 52 C132 58 134 66 128 74 C122 78 118 78 122 74 Z"
        stroke="currentColor"
        strokeWidth="0.85"
        fill="none"
        opacity="0.72"
        style={{ transformOrigin: "126px 62px" }}
      />
      <path
        data-botanical-upright
        d="M238 74 C234 66 236 58 242 52 C248 58 250 66 244 74 C238 78 234 78 238 74 Z"
        stroke="currentColor"
        strokeWidth="0.85"
        fill="none"
        opacity="0.72"
        style={{ transformOrigin: "242px 62px" }}
      />
      <path
        data-botanical-upright
        d="M108 142 C104 134 106 126 112 120 C118 126 120 134 114 142 C108 146 104 146 108 142 Z"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.62"
        style={{ transformOrigin: "112px 130px" }}
      />
      <path
        data-botanical-upright
        d="M252 142 C248 134 250 126 256 120 C262 126 264 134 258 142 C252 146 248 146 252 142 Z"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.62"
        style={{ transformOrigin: "256px 130px" }}
      />
    </svg>
  );
}
