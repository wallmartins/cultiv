import { cn } from "@my-ai-orchestrator/ui";
import type { LocaleMessages } from "~/i18n/marketing/types";
import { AssistantMessageBubble, ChatWindowChrome } from "./chat-scene-primitives";

export interface GenericOutputStackProps {
  readonly className?: string;
  readonly copy: LocaleMessages["scenes"]["genericOutput"];
}

const messageOffsets = [60, 132, 204] as const;

export function GenericOutputStack({ className, copy }: GenericOutputStackProps) {
  return (
    <svg
      viewBox="0 0 480 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-auto w-full max-w-[440px] text-ink", className)}
      aria-hidden
    >
      <ChatWindowChrome title={copy.chatTitle}>
        <text
          x="240"
          y="72"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="9"
          fill="var(--color-ink-muted)"
          letterSpacing="0.12em"
        >
          {copy.recentRepliesLabel}
        </text>
        {copy.lines.map((line, index) => (
          <AssistantMessageBubble
            key={`${line}-${index}`}
            y={messageOffsets[index]}
            assistantName={copy.assistantName}
            line={line}
          />
        ))}
        <text
          x="240"
          y="318"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="9"
          fill="var(--color-pigment-terracotta)"
          opacity="0.75"
          letterSpacing="0.14em"
        >
          {copy.repeatToneLabel}
        </text>
        <rect
          x="16"
          y="336"
          width="448"
          height="48"
          fill="var(--color-paper)"
          stroke="var(--color-ink-ghost)"
          strokeWidth="1"
        />
        <rect x="28" y="358" width="280" height="6" fill="var(--color-ink-ghost)" opacity="0.45" />
        <circle cx="444" cy="360" r="12" fill="var(--color-ink)" opacity="0.12" />
      </ChatWindowChrome>
    </svg>
  );
}
