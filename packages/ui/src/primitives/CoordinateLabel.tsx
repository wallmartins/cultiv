import { cn } from "../lib/cn.js";

export interface CoordinateLabelProps {
  readonly index: number | string;
  readonly label: string;
  readonly className?: string;
}

function formatIndex(index: number | string): string {
  if (typeof index === "number") {
    return String(index).padStart(2, "0");
  }

  return index;
}

export function CoordinateLabel({ index, label, className }: CoordinateLabelProps) {
  return (
    <span className={cn("ui-type-mono text-ink-muted", className)}>
      §{formatIndex(index)} · {label}
    </span>
  );
}
