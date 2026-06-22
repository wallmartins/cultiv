import type { ReactNode } from "react";
import { Container, Text, cn } from "@my-ai-orchestrator/ui";

export interface ChapterPanelProps {
  readonly index: string;
  readonly title: string;
  readonly body: string;
  readonly visual?: ReactNode;
  readonly variant?: "default" | "showcase";
  readonly visualEmphasis?: "default" | "prominent";
  readonly pinned?: boolean;
  readonly children?: ReactNode;
}

export function ChapterPanel({
  index,
  title,
  body,
  visual,
  variant = "default",
  visualEmphasis = "default",
  pinned = false,
  children
}: ChapterPanelProps) {
  const isShowcase = variant === "showcase";
  const isProminentVisual = visualEmphasis === "prominent";

  return (
    <div
      data-chapter
      className={cn(
        "flex w-full flex-col justify-center py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]",
        pinned && "absolute inset-0 h-svh",
        isShowcase ? "bg-ink text-paper" : "bg-paper"
      )}
    >
      <Container
        className={cn(
          "grid items-center gap-10 lg:gap-16",
          isProminentVisual
            ? "lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.28fr)]"
            : "lg:grid-cols-[1fr_1.1fr]"
        )}
      >
        <div className="space-y-5">
          <Text as="p" variant="meta" className={isShowcase ? "text-pigment-ochre" : "text-ink-muted"}>
            [{index}]
          </Text>
          <Text
            as="h3"
            variant="display-sm"
            className={isShowcase ? "text-paper" : undefined}
          >
            {title}
          </Text>
          <Text
            as="p"
            variant="body-lg"
            className={isShowcase ? "text-ink-muted" : "text-ink-muted"}
          >
            {body}
          </Text>
        </div>
        <div
          className={cn(
            "flex flex-col gap-6",
            isProminentVisual && "items-center justify-center lg:min-h-[min(26rem,52vh)]"
          )}
        >
          {visual}
          {children}
        </div>
      </Container>
    </div>
  );
}
