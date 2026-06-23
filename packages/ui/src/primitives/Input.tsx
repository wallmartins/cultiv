import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full bg-off-white border-dotted-cartography rounded-[5px] px-4 py-3 ui-type-conducao text-base text-ink placeholder:text-ink-muted",
        "focus-visible:border-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/30",
        className
      )}
      {...props}
    />
  );
}
