import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full border border-foreground bg-transparent px-4 py-3 font-body text-base text-foreground placeholder:text-muted focus-visible:bg-surface-elevated press-edge rounded-[var(--radius-press)] focus-visible:ring-2 focus-visible:ring-pigment-terracotta/40 focus-visible:outline-none",
        className
      )}
      {...props}
    />
  );
}
