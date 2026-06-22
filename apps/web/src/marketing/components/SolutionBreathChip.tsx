import { useId, useState } from "react";
import { cn } from "@my-ai-orchestrator/ui";

export interface SolutionBreathChipProps {
  readonly phrase: string;
  readonly microcopy: string;
  readonly className?: string;
}

function ChipCornerMark({ className }: { readonly className: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2.5 8V2.5H8"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SolutionBreathChip({ phrase, microcopy, className }: SolutionBreathChipProps) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const descriptionId = useId();
  const active = hovered || pinned;

  return (
    <div className={cn("solution-breath-chip-host", className)}>
      <div className="solution-breath-chip-host__underlay" aria-hidden />
      <button
        type="button"
        className={cn("solution-breath-chip imprint-grain", active && "solution-breath-chip--expanded")}
        aria-expanded={active}
        aria-describedby={active ? descriptionId : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={() => setPinned((current) => !current)}
      >
        <ChipCornerMark className="solution-breath-chip__corner solution-breath-chip__corner--tl" />
        <ChipCornerMark className="solution-breath-chip__corner solution-breath-chip__corner--br" />
        <span className="solution-breath-chip__rule" aria-hidden />
        <span className="solution-breath-chip__phrase">{phrase}</span>
        <span className="solution-breath-chip__detail-grid" aria-hidden={!active}>
          <span className="solution-breath-chip__detail-inner">
            <span id={descriptionId} className="solution-breath-chip__detail">
              {microcopy}
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}
