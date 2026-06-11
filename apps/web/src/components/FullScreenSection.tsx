import type { ReactNode } from "react";
import { cn } from "@my-ai-orchestrator/ui";

export interface FullScreenSectionProps {
  readonly id?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

export function FullScreenSection({ id, className, children }: FullScreenSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "flex min-h-svh flex-col justify-center py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]",
        className
      )}
    >
      {children}
    </section>
  );
}
