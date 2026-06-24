import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../lib/cn.js";

export interface CartographySurfaceProps extends ComponentPropsWithoutRef<"div"> {
  readonly vignette?: boolean;
}

export function CartographySurface({
  className,
  vignette = false,
  children,
  ...props
}: CartographySurfaceProps) {
  return (
    <div
      className={cn(
        "relative bg-cream",
        "before:pointer-events-none before:absolute before:inset-0 before:cartography-grain",
        vignette &&
          "after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(26,46,60,0.06)_100%)]",
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
