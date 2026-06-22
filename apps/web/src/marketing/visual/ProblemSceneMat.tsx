import type { ReactNode } from "react";
import { cn } from "@my-ai-orchestrator/ui";

export interface ProblemSceneMatProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly reverse?: boolean;
}

function CornerMark({ className }: { readonly className: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 12.5V3.5H12.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.8 9.2V4.8H9.2"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function ProblemSceneMat({ children, className, reverse = false }: ProblemSceneMatProps) {
  return (
    <div
      className={cn(
        "scene-artifact-mat",
        reverse && "scene-artifact-mat--reverse",
        className
      )}
    >
      <div className="scene-artifact-mat__halo" aria-hidden />
      <div className="scene-artifact-mat__underlay" aria-hidden />
      <div className="scene-artifact-mat__plate imprint-grain">
        <div className="scene-artifact-mat__rule" aria-hidden />
        <CornerMark className="scene-artifact-mat__corner scene-artifact-mat__corner--tl" />
        <CornerMark className="scene-artifact-mat__corner scene-artifact-mat__corner--tr" />
        <CornerMark className="scene-artifact-mat__corner scene-artifact-mat__corner--bl" />
        <CornerMark className="scene-artifact-mat__corner scene-artifact-mat__corner--br" />
        <div className="scene-artifact-mat__content">{children}</div>
      </div>
    </div>
  );
}
