import { forwardRef, type ReactNode } from "react";
import { cn } from "../lib/cn.js";

export interface ContainerProps {
  readonly className?: string;
  readonly children: ReactNode;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { className, children },
  ref
) {
  return (
    <div ref={ref} className={cn("mx-auto w-full max-w-[88rem] px-[var(--spacing-gutter)]", className)}>
      {children}
    </div>
  );
});
