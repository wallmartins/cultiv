import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full border border-foreground bg-transparent px-4 py-3 font-body text-base text-foreground placeholder:text-muted focus-visible:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        className
      )}
      {...props}
    />
  );
}
