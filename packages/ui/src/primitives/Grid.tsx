import { forwardRef, type ReactNode } from "react";
import { cn } from "../lib/cn.js";

export interface GridProps {
  readonly className?: string;
  readonly columns?: 1 | 2 | 3;
  readonly children: ReactNode;
}

const columnClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3"
} as const;

export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { className, columns = 1, children },
  ref
) {
  return (
    <div ref={ref} className={cn("grid gap-6", columnClasses[columns], className)}>
      {children}
    </div>
  );
});
