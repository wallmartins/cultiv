import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../lib/cn.js";

export function ReadingSurface({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("bg-paper px-6 py-8", className)} {...props}>
      <div className="ui-type-reading text-ink">{children}</div>
    </div>
  );
}
