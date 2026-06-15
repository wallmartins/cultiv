import { cn } from "@my-ai-orchestrator/ui";
import { useRef } from "react";
import {
  FALLING_LEAF_PRESETS,
  leafWidthStyle,
  useFallingLeaves,
  type FallingLeavesDensity
} from "~/marketing/animations/use-falling-leaves";
import { BotanicalLeaf } from "./illustrations/BotanicalLeaf";

export interface FallingLeavesLayerProps {
  readonly density: FallingLeavesDensity;
  readonly className?: string;
  readonly colorClassName?: string;
}

export function FallingLeavesLayer({
  density,
  className,
  colorClassName = "text-moss"
}: FallingLeavesLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFallingLeaves(containerRef, density);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {FALLING_LEAF_PRESETS[density].map((preset, index) => (
        <div
          key={`${density}-${index}`}
          data-falling-leaf
          className="absolute top-0 left-0 will-change-transform"
          style={{
            width: leafWidthStyle(preset)
          }}
        >
          <BotanicalLeaf variant={preset.variant} className={cn("h-auto w-full", colorClassName)} />
        </div>
      ))}
    </div>
  );
}
