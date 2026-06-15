import { cn } from "@my-ai-orchestrator/ui";
import type { LocaleMessages } from "~/i18n/marketing/types";
import { ChatWindowChrome } from "./chat-scene-primitives";

export interface FragilePromptCollageProps {
  readonly className?: string;
  readonly copy: LocaleMessages["scenes"]["fragilePrompt"];
}

const fragmentStyles = [
  { font: "handwritten" as const, fontSize: 13 },
  { font: "mono" as const, fontSize: 10 },
  { font: "body" as const, fontSize: 11 },
  { font: "body" as const, fontSize: 10, italic: true }
] as const;

export function FragilePromptCollage({ className, copy }: FragilePromptCollageProps) {
  const composerTop = 248;

  return (
    <svg
      viewBox="0 0 480 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-auto w-full max-w-[440px] text-foreground", className)}
      aria-hidden
    >
      <ChatWindowChrome title={copy.chatTitle}>
        <rect
          x="60"
          y="72"
          width="280"
          height="36"
          fill="var(--color-surface)"
          stroke="var(--color-border-subtle)"
          strokeWidth="1"
        />
        <text x="76" y="94" fontFamily="var(--font-body)" fontSize="11" fill="var(--color-foreground)">
          {copy.userMessagePreview}
        </text>
        <circle cx="36" cy="90" r="14" fill="var(--color-foreground)" opacity="0.08" />
        <text
          x="36"
          y="94"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="8"
          fill="var(--color-muted)"
        >
          {copy.userAvatarLabel}
        </text>

        <text
          x="240"
          y="140"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="9"
          fill="var(--color-muted)"
          letterSpacing="0.1em"
        >
          {copy.newChatHint}
        </text>

        <rect
          x="16"
          y={composerTop}
          width="448"
          height="136"
          fill="var(--color-surface)"
          stroke="currentColor"
          strokeWidth="1"
        />
        <text
          x="28"
          y={composerTop + 22}
          fontFamily="var(--font-mono)"
          fontSize="9"
          fill="var(--color-moss)"
          letterSpacing="0.14em"
        >
          {copy.composerLabel.toUpperCase()}
        </text>
        <line
          x1="28"
          y1={composerTop + 30}
          x2="452"
          y2={composerTop + 30}
          stroke="var(--color-border-subtle)"
          strokeWidth="1"
        />

        {copy.fragments.map((fragment, index) => {
          const style = fragmentStyles[index];
          const lineY = composerTop + 52 + index * 22;
          const fontFamily =
            style.font === "handwritten"
              ? "var(--font-handwritten)"
              : style.font === "mono"
                ? "var(--font-mono)"
                : "var(--font-body)";
          const textFill =
            style.font === "handwritten"
              ? "var(--color-golden)"
              : style.font === "mono"
                ? "var(--color-moss)"
                : "var(--color-foreground)";

          return (
            <g key={fragment}>
              <rect
                x="24"
                y={lineY - 14}
                width="432"
                height="20"
                fill="var(--color-golden)"
                opacity="0.14"
                stroke="var(--color-golden)"
                strokeWidth="0.75"
                strokeOpacity="0.35"
              />
              <text
                x="32"
                y={lineY}
                fontFamily={fontFamily}
                fontSize={style.fontSize}
                fill={textFill}
                fontStyle={"italic" in style && style.italic ? "italic" : undefined}
              >
                {fragment}
              </text>
            </g>
          );
        })}

        <rect x="404" y={composerTop + 104} width="48" height="24" fill="var(--color-foreground)" />
        <text
          x="428"
          y={composerTop + 120}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="8"
          fill="var(--color-surface)"
          letterSpacing="0.12em"
        >
          {copy.sendLabel}
        </text>
      </ChatWindowChrome>
    </svg>
  );
}
