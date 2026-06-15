import { cn } from "@my-ai-orchestrator/ui";
import type { HTMLAttributes, ReactNode } from "react";

export interface AppCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly hover?: boolean;
  readonly padding?: "default" | "compact" | "none";
}

const paddingClasses = {
  default: "p-5",
  compact: "p-4",
  none: ""
} as const;

export function AppCard({
  children,
  hover = false,
  padding = "default",
  className,
  ...props
}: AppCardProps) {
  return (
    <div
      className={cn(
        "workspace-card",
        hover && "workspace-card--hover",
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
