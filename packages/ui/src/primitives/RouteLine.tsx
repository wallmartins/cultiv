import { cn } from "../lib/cn.js";

export interface RouteLineProps {
  readonly progress?: number;
  readonly orientation?: "vertical" | "horizontal";
  readonly animate?: boolean;
  readonly className?: string;
}

const PATH_LENGTH = 100;

export function RouteLine({
  progress = 1,
  orientation = "vertical",
  animate = false,
  className,
}: RouteLineProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const dashOffset = PATH_LENGTH * (1 - clampedProgress);

  const pathD =
    orientation === "vertical" ? "M 50 0 L 50 100" : "M 0 50 L 100 50";

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-ink-ghost)"
        strokeWidth={1.5}
        strokeDasharray={PATH_LENGTH}
        strokeDashoffset={dashOffset}
        pathLength={PATH_LENGTH}
        vectorEffect="non-scaling-stroke"
        className={cn(
          animate && "transition-[stroke-dashoffset] duration-[250ms] ease-out",
          "motion-reduce:[stroke-dashoffset:0]"
        )}
      />
    </svg>
  );
}
