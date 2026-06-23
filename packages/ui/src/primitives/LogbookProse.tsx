import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../lib/cn.js";

export function LogbookProse({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "border-dotted-cartography bg-off-white p-6 ui-type-logbook leading-relaxed text-ink",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
