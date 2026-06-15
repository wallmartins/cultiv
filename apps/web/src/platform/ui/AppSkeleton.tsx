import { cn } from "@my-ai-orchestrator/ui";
import type { HTMLAttributes } from "react";

export interface AppSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  readonly className?: string;
}

export function AppSkeleton({ className, ...props }: AppSkeletonProps) {
  return <div aria-hidden className={cn("workspace-skeleton", className)} {...props} />;
}
