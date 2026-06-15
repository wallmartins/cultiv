import { forwardRef, type ReactNode } from "react";
import { cn } from "@my-ai-orchestrator/ui";

export interface IllustrationFrameProps {
  readonly className?: string;
  readonly children: ReactNode;
  readonly grain?: boolean;
}

export const IllustrationFrame = forwardRef<HTMLDivElement, IllustrationFrameProps>(
  function IllustrationFrame({ className, children, grain = true }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-none relative text-foreground",
          grain && "paper-grain",
          className
        )}
        aria-hidden
      >
        {children}
      </div>
    );
  }
);
