import type { ReactNode } from "react";
import { cn } from "@my-ai-orchestrator/ui";

export interface HandwrittenNoteProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function HandwrittenNote({ children, className }: HandwrittenNoteProps) {
  return (
    <p
      className={cn(
        "font-handwritten text-[clamp(1.35rem,3.5vw,2rem)] leading-snug text-golden",
        className
      )}
      style={{ letterSpacing: "var(--tracking-handwritten)" }}
    >
      {children}
    </p>
  );
}
