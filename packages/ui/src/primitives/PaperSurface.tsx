import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../lib/cn.js";

export function PaperSurface({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("imprint-grain bg-paper press-edge", className)} {...props}>
      {children}
    </div>
  );
}
